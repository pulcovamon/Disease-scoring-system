import os
from typing import Optional

from fastapi import APIRouter, UploadFile, HTTPException, File, Depends, Query, Security
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from bson import ObjectId
from bson.json_util import dumps
from fastapi.encoders import jsonable_encoder

from api.database import MongoDatabase
from api.models.utils import sanitize_filename

from api.auth import models
from api.auth.sql_database import get_session
from api.auth.security import (
    hash_password,
    authenticate,
    create_access_token,
    http_basic,
    get_user_by_email,
    JWTBearer,
    verify_jwt
)

router = APIRouter(prefix="/model", tags=["Models"])
models_db = MongoDatabase(db_name="scoring_system", collection_name="models")


class ModelUploadForm(BaseModel):
    model_name: str
    disease: str
    description: str = ""
    is_public: bool = False

    @classmethod
    def as_form(
        cls,
        disease: str,
        model_name: str,
        description: str = "",
        is_public: bool = False
    ):
        return cls(model_name=model_name, description=description, is_public=is_public, disease=disease)


@router.post("")
async def upload_model(
    form: ModelUploadForm = Depends(ModelUploadForm.as_form),
    file: UploadFile = File(...),
    image: Optional[UploadFile] = File(None),
    encoder: Optional[UploadFile] = File(None),
    token: str = Depends(JWTBearer())
):
    user = verify_jwt(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext != ".pkl":
        raise HTTPException(status_code=422, detail="Unsupported file type. Expected .pkl file.")

    storage_path = os.getenv("MODEL_STORAGE_PATH", "./model_storage")
    user_dir = os.path.join(storage_path, str(user.id))
    os.makedirs(user_dir, exist_ok=True)

    model_path = os.path.join(user_dir, sanitize_filename(file.filename))
    with open(model_path, "wb") as f:
        content = await file.read()
        f.write(content)

    image_filename = None
    image_path = None
    if image:
        img_ext = os.path.splitext(image.filename)[1].lower()
        if img_ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(status_code=422, detail="Unsupported image format.")
        image_path = os.path.join(user_dir, sanitize_filename(image.filename))
        with open(image_path, "wb") as f:
            img_content = await image.read()
            f.write(img_content)
        image_filename = image_path

    encoder_path = None
    if encoder:
        encoder_ext = os.path.splitext(encoder.filename)[1].lower()
        if encoder_ext != ".pkl":
            raise HTTPException(status_code=422, detail="Unsupported encoder format. Expected .pkl file.")
        encoder_path = os.path.join(user_dir, sanitize_filename(encoder.filename))
        with open(encoder_path, "wb") as f:
            enc_content = await encoder.read()
            f.write(enc_content)

    model_entry = {
        "user": str(user.id),
        "path": model_path,
        "name": form.model_name,
        "disease": form.disease,
        "description": form.description,
        "image": image_filename,
        "is_public": form.is_public,
        "encoder": encoder_path
    }

    result = models_db.collection.insert_one(model_entry)
    model_id = result.inserted_id

    return {"status": "Model uploaded", "model_id": str(model_id)}

@router.get("/{_id}")
async def get_model_by_id(_id: str):
    try:
        object_id = ObjectId(_id)
    except Exception:
        object_id = _id

    data = models_db.collection.find_one({"_id": object_id})
    if not data:
        raise HTTPException(status_code=404, detail="Model not found")
    data["_id"] = str(data["_id"])
    return JSONResponse(content=jsonable_encoder(data), status_code=200)

@router.get("")
async def get_models(
    include_user: bool = Query(False),
    include_public: bool = Query(False),
    include_default: bool = Query(True),
    token: Optional[str] = Security(JWTBearer(auto_error=False))
):
    user = verify_jwt(token)

    filters = []

    if include_user:
        if not user:
            raise HTTPException(status_code=401, detail="Permission denied!")
        filters.append({"user": str(user.id)})

    if include_default:
        filters.append({"user": "default"})

    if include_public:
        filters.append({"is_public": True})

    if not filters:
        raise HTTPException(status_code=400, detail="No filters specified.")

    query = {"$or": filters} if len(filters) > 1 else filters[0]
    raw_models = list(models_db.collection.find(query))

    unique_models = {}
    for model in raw_models:
        model["_id"] = str(model["_id"])
        unique_models[model["_id"]] = model

    return JSONResponse(content=list(unique_models.values()), status_code=200)

