"""
API endpoints
"""

import json
import os
import io
import pandas as pd

from celery.result import AsyncResult
from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks, File, UploadFile
from fastapi.responses import JSONResponse

from api.worker import celery_app
from api.scoring.utils import get_task_dict

from . import models

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
            response = {
                "status": task.status,
                "result": task.result[0],
                "task_id": id,
                "disease": task.result[1],
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


@router.post("/{model}/")
async def predict(disease: str, data: models.Data):
    """
    Reuqest calculation of probability of presence of disease
    from given examination codes (health assurance codes).

    Args:
        disease (str): disease name
        data (models.Data): sequence of health assurance codes

    Returns:
        JSON response with status code 202: task id

    Raises:
        HTTP exeption with status code 404:
                if given disease does not exist
    """
    if disease in [
        "lung-cancer",
        "multiple-sclerosis",
        "hidradentis-supporativa",
    ]:
        disease = disease.split("-")
        disease = f"{disease[0]}_{disease[1]}"
        task = celery_app.send_task(disease, args=[data.codes])
    else:
        raise HTTPException(
            status_code=404, detail=f"Disease {disease} not found."
        )
    response = {"id": task.id}
    return JSONResponse(status_code=202, content=response)


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
    


