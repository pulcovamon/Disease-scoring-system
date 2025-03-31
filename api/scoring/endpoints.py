"""
API endpoints
"""
import json
import os
import io
import pandas as pd
from bson import ObjectId
from typing import List

from celery.result import AsyncResult
from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks, File, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from api.worker import celery_app
from api.scoring.utils import get_task_dict
from api.database import MongoDatabase

from . import models

models_db = MongoDatabase(db_name="scoring_system", collection_name="models")

class PredictionRequest(BaseModel):
    codes: List[str]

router = APIRouter()

MODEL_DIR = "/app/models"

@router.get("/result/")
async def get_all_results():
    i = celery_app.control.inspect()

    active_tasks = i.active() or {}
    scheduled_tasks = i.scheduled() or {}
    reserved_tasks = i.reserved() or {}

    all_task_ids = set()

    for worker_tasks in [active_tasks, scheduled_tasks, reserved_tasks]:
        for worker, tasks in worker_tasks.items():
            for task in tasks:
                task_id = task.get("id")
                if task_id:
                    all_task_ids.add(task_id)

    backend = celery_app.backend
    if hasattr(backend, "client"):
        keys = backend.client.keys("celery-task-meta-*")
        for key in keys:
            task_id = key.decode("utf-8").replace("celery-task-meta-", "")
            all_task_ids.add(task_id)

    all_tasks = [get_task_dict(task_id) for task_id in all_task_ids]

    return JSONResponse(status_code=200, content=all_tasks)


@router.get("/result/{id}")
async def get_result(id: str):
    """
    Get result from machine learning models.
    (probability of presence of given disease)

    Args:
        id (str): task id

    Returns:
        JSON response with status code 200:
                result, status and disease name

    Raises:
        HTTP exeption with status code 404:
                if task with given id does not exist
    """
    task = AsyncResult(id, app=celery_app)
    match task.state:
        case "PENDING":
            raise HTTPException(
                status_code=404, detail=f"Task with id {id} does not exist!"
            )
        case "SUCCESS":
            result_data = task.result
            response = {
                "status": task.status,
                "result": result_data.get("prediction"),  # tady vytáhneš konkrétní hodnotu
                "task_id": id,
                "disease": None,
            }
        case "FAILURE":
            response = json.loads(
                task.backend.get(
                    task.backend.get_key_for_task(task.id),
                ).decode("utf-8")
            )
        case _:
            response = {
                "status": task.status,
                "result": task.info,
                "task_id": id,
                "disease": None,
            }
    return JSONResponse(status_code=200, content=response)

@router.post("/predict")
async def predict(model_id: str, data: PredictionRequest):
    """
    Request a model prediction based on model ID and input code sequence.
    """
    try:
        object_id = ObjectId(model_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid model ID")

    model_doc = models_db.collection.find_one({
        "$or": [
            {"_id": object_id},
            {"_id": model_id}
        ]
    })

    if not model_doc:
        raise HTTPException(status_code=404, detail="Model not found")

    model_path = model_doc.get("path")
    if not model_path or not os.path.isfile(model_path):
        raise HTTPException(status_code=500, detail="Model file is missing on server")

    encoder_path = model_doc.get("encoder")
    if encoder_path and not os.path.isfile(encoder_path):
        encoder_path = None

    task = celery_app.send_task("run_model_prediction", args=[model_path, data.codes, encoder_path])
    return JSONResponse(status_code=202, content={"task_id": task.id})

@router.post("/{disease}/dataset")
async def predict_dataset(disease: str, dataset: UploadFile):
    if disease in [
        "lung-cancer",
        "multiple-sclerosis",
        "hidradentis-supporativa",
    ]:
        disease = disease.split("-")
        disease = f"{disease[0]}_{disease[1]}"
    else:
        raise HTTPException(
            status_code=404, detail=f"Disease {disease} not found.")
    try:
        data = []

        if dataset.content_type == "text/csv":
            content = await dataset.read()
            df = pd.read_csv(io.BytesIO(content))

            if "id" not in df.columns or "codes" not in df.columns:
                raise HTTPException(
                    status_code=400,
                    detail="CSV must contain 'id' and 'codes' columns!"
                )
            
            data = [
                {"id": row["id"], "codes": row["codes"].split(",")}
                for _, row in df.iterrows()
            ]

        elif dataset.content_type == "application/json":
            content = await dataset.read()
            data = json.loads(content.decode("utf-8"))

            if not all("id" in entry and "codes" in entry for entry in data):
                raise HTTPException(
                    status_code=400,
                    detail="JSON entries must contain 'id' and 'codes' keys!"
                )

        else:
            raise HTTPException(status_code=400, detail="File must be CSV or JSON!")

        task = celery_app.send_task(disease, args=[data])
        return JSONResponse(status_code=201, content={"id": task.id})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


