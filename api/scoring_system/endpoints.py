from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from celery.result import AsyncResult
import os
import json

from worker import celery_app
from . import models


router = APIRouter()


@router.get("/{id}")
def get_result(id: str):
    task = AsyncResult(id, app=celery_app)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task with id {id} does not exist!")
    if task.state == "SUCCESS":
        response = {
            "status": task.status,
            "result": task.result,
            "task_id": id
        }
    elif task.state == "FAILURE":
        response = json.loads(
            task.backend.get(
                task.backend.get_key_for_task(task.id),
            ).decode("utf-8")
        )
    else:
        response = {
            "status": task.status,
            "result": task.info,
            "task_id": id
        }
    return JSONResponse(status_code=200, content=response)


@router.post("/{disease}/")
def predict(
    disease: str, data: models.Data):
    match disease:
        case "lung-cancer":
            task = celery_app.send_task("lung_cancer", args=[data.codes])
        case "multiple-sclerosis":
            task = celery_app.send_task("multiple_sclerosis", args=[data.codes])
        case "hidradentis-supporativa":
            task = celery_app.send_task("hidradentis_supporativa", args=[data.codes])
        case _:
            raise HTTPException(status_code=404, detail=f"Disease {disease} not found.")

    response = {
        "id": task.id
    }
    return JSONResponse(status_code=202, content=response)


