"""
API endpoints
"""

import json
import os

from celery.result import AsyncResult
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from worker import celery_app
from .utils import get_task_dict

from . import models

router = APIRouter()


@router.get("/result/")
def get_all_results():
    i = celery_app.control.inspect()

    # Aktivní, rezervované a naplánované úkoly
    active_tasks = i.active() or {}
    scheduled_tasks = i.scheduled() or {}
    reserved_tasks = i.reserved() or {}

    all_task_ids = set()

    # Získání ID ze všech dostupných úkolů
    for worker_tasks in [active_tasks, scheduled_tasks, reserved_tasks]:
        for worker, tasks in worker_tasks.items():
            for task in tasks:
                task_id = task.get("id")
                if task_id:
                    all_task_ids.add(task_id)

    # Ručně přidat dokončené úkoly (např. SUCCESS nebo FAILURE)
    backend = celery_app.backend
    if hasattr(backend, "client"):
        # Pro Redis backend
        keys = backend.client.keys("celery-task-meta-*")
        for key in keys:
            task_id = key.decode("utf-8").replace("celery-task-meta-", "")
            all_task_ids.add(task_id)

    # Generovat výsledky pro všechny úkoly
    all_tasks = [get_task_dict(task_id) for task_id in all_task_ids]

    return JSONResponse(status_code=200, content=all_tasks)


@router.get("/result/{id}")
def get_result(id: str):
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


@router.post("/{disease}/")
def predict(disease: str, data: models.Data):
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
