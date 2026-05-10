import os
from typing import Optional

from fastapi import APIRouter, UploadFile, HTTPException, File, Depends, Query
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from fastapi.encoders import jsonable_encoder

from api.database import MongoDatabase
from api.models.utils import sanitize_filename

from api.auth import models
from api.auth.dependencies import (
    ensure_can_upload_model,
    get_current_user_optional,
    get_model_for_read,
    get_model_for_modify,
)
from api.auth.permissions import can_view_model

router = APIRouter(prefix="/model", tags=["Models"])
models_db = MongoDatabase(db_name="scoring_system", collection_name="models")


class ModelUploadForm(BaseModel):
    model_name: str
    disease: str
    description: str = ""
    is_public: bool = False
    recommended: bool = False
    algorithm: Optional[str] = None
    accuracy: Optional[float] = None
    model_type: Optional[str] = None
    summary: Optional[str] = None

    @classmethod
    def as_form(
        cls,
        disease: str,
        model_name: str,
        description: str = "",
        is_public: bool = False,
        recommended: bool = False,
        algorithm: Optional[str] = None,
        accuracy: Optional[float] = None,
        model_type: Optional[str] = None,
        summary: Optional[str] = None,
    ):
        return cls(
            model_name=model_name,
            description=description,
            is_public=is_public,
            recommended=recommended,
            disease=disease,
            algorithm=algorithm,
            accuracy=accuracy,
            model_type=model_type,
            summary=summary,
        )


@router.post("")
async def upload_model(
    form: ModelUploadForm = Depends(ModelUploadForm.as_form),
    file: UploadFile = File(...),
    image: Optional[UploadFile] = File(None),
    encoder: Optional[UploadFile] = File(None),
    user: models.User = Depends(ensure_can_upload_model),
):
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
        "model_type": form.model_type,
        "summary": form.summary,
        "description": form.description,
        "image": image_filename,
        "is_public": form.is_public,
        "recommended": form.recommended,
        "encoder": encoder_path,
        "algorithm": form.algorithm,
        "accuracy": form.accuracy,
    }

    result = models_db.collection.insert_one(model_entry)
    model_id = result.inserted_id

    return {"status": "Model uploaded", "model_id": str(model_id)}

class MetricsPatch(BaseModel):
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1: Optional[float] = None
    roc_auc: Optional[float] = None


class ModelPatchForm(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    summary: Optional[str] = None
    is_public: Optional[bool] = None
    recommended: Optional[bool] = None
    algorithm: Optional[str] = None
    accuracy: Optional[float] = None
    model_type: Optional[str] = None
    disease: Optional[str] = None
    metrics: Optional[MetricsPatch] = None


@router.get("/{_id}")
async def get_model_by_id(data=Depends(get_model_for_read)):
    data["_id"] = str(data["_id"])
    return JSONResponse(content=jsonable_encoder(data), status_code=200)

@router.get("")
async def get_models(
    include_user: bool = Query(False),
    include_public: bool = Query(False),
    include_default: bool = Query(True),
    disease: Optional[str] = Query(None),
    accuracy: Optional[float] = Query(None, ge=0.0, le=1.0),
    author: Optional[str] = Query(None),
    algorithm: Optional[str] = Query(None),
    user: Optional[models.User] = Depends(get_current_user_optional),
):
    if include_user and not user:
        raise HTTPException(status_code=401, detail="Authentication required to access user models")
    base_filters = []
    if include_default:
        base_filters.append({"user": "default"})
    if include_public:
        base_filters.append({"is_public": True})
    if include_user and user:
        base_filters.append({"user": str(user.id)})

    if not base_filters:
        base_filters.append({"user": "default"})

    attribute_filters = {}
    if disease:
        attribute_filters["disease"] = disease
    if accuracy is not None:
        attribute_filters["accuracy"] = {"$gte": accuracy}
    if author:
        attribute_filters["user"] = author
    if algorithm:
        attribute_filters["algorithm"] = algorithm

    if attribute_filters:
        query = {"$and": [{"$or": base_filters}, attribute_filters]}
    else:
        query = {"$or": base_filters} if len(base_filters) > 1 else base_filters[0]

    raw_models = list(models_db.collection.find(query))

    visible_models = []
    for model in raw_models:
        if not can_view_model(user, model):
            continue
        model["_id"] = str(model["_id"])
        visible_models.append(model)

    return JSONResponse(content=visible_models, status_code=200)


@router.patch("/{model_id}")
async def update_model(
    body: ModelPatchForm,
    ctx: dict = Depends(get_model_for_modify),
):
    raw = body.dict()
    update_data = {}
    for k, v in raw.items():
        if v is None:
            continue
        if k == "metrics" and isinstance(v, dict):
            v = {mk: mv for mk, mv in v.items() if mv is not None}
            if not v:
                continue
        update_data[k] = v
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    models_db.collection.update_one(
        {"_id": ctx["object_id"]},
        {"$set": update_data},
    )
    return JSONResponse(content={"status": "updated"}, status_code=200)


@router.delete("/{model_id}", status_code=204)
async def delete_model(ctx: dict = Depends(get_model_for_modify)):
    model_doc = ctx["model"]
    for field in ("path", "image", "encoder"):
        file_path = model_doc.get(field)
        if file_path and os.path.isfile(file_path):
            os.remove(file_path)
    models_db.collection.delete_one({"_id": ctx["object_id"]})
    return Response(status_code=204)
