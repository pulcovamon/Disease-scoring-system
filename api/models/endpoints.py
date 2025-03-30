import os
from typing import Optional

from fastapi import APIRouter, UploadFile, HTTPException, File, Depends
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from bson import ObjectId

from api.database import MongoDatabase
from api.models.utils import sanitize_filename

router = APIRouter()
models_db = MongoDatabase(db_name="scoring_system", collection_name="models")


class ModelUploadForm(BaseModel):
    username: str
    model_name: str
    description: str = ""

    @classmethod
    def as_form(
        cls,
        username: str = File(...),
        model_name: str = File(...),
        description: str = File("")
    ):
        return cls(username=username, model_name=model_name, description=description)


@router.post("/model")
async def upload_model(
    form: ModelUploadForm = Depends(ModelUploadForm.as_form),
    file: UploadFile = File(...),
    image: Optional[UploadFile] = File(None)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext != ".pkl":
        raise HTTPException(status_code=422, detail="Unsupported file type. Expected .pkl file.")

    storage_path = os.getenv("MODEL_STORAGE_PATH", "./model_storage")
    user_dir = os.path.join(storage_path, form.username)
    os.makedirs(user_dir, exist_ok=True)

    model_path = os.path.join(user_dir, sanitize_filename(file.filename))
    with open(model_path, "wb") as f:
        content = await file.read()
        f.write(content)

    image_filename = None
    if image:
        img_ext = os.path.splitext(image.filename)[1].lower()
        if img_ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(status_code=422, detail="Unsupported image format.")
        image_path = os.path.join(user_dir, sanitize_filename(image.filename))
        with open(image_path, "wb") as f:
            img_content = await image.read()
            f.write(img_content)
        image_filename = image.filename

    model_entry = {
        "filename": file.filename,
        "name": form.model_name,
        "description": form.description,
        "image": image_filename
    }

    existing_doc = models_db.collection.find_one({"user": form.username})
    if existing_doc:
        models_db.collection.update_one(
            {"user": form.username},
            {"$push": {"children": model_entry}}
        )
        model_id = existing_doc["_id"]
    else:
        result = models_db.collection.insert_one({
            "user": form.username,
            "path": user_dir,
            "children": [model_entry]
        })
        model_id = result.inserted_id

    return {"status": "Model uploaded", "model_id": str(model_id)}


@router.get("/model")
async def get_models(username: str):
    data = models_db.collection.find_one({"user": username})
    if not data:
        return JSONResponse(content={"models": []}, status_code=200)
    return JSONResponse(content=jsonable_encoder(data["children"]), status_code=200)


@router.get("/model/{_id}")
async def get_model_by_id(_id: str):
    try:
        object_id = ObjectId(_id)
    except Exception:
        object_id = _id

    data = models_db.collection.find_one({"_id": object_id})
    if not data:
        raise HTTPException(status_code=404, detail="Model not found")

    return JSONResponse(content=jsonable_encoder(data), status_code=200)
