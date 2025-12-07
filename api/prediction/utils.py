import json
from celery.result import AsyncResult
from bson import ObjectId

from api.worker import celery_app
from api.database import MongoDatabase

models_db = MongoDatabase(db_name="scoring_system", collection_name="models")


def format_task_result(task_id):
    task = AsyncResult(task_id, app=celery_app)

    result_data = task.result if isinstance(task.result, dict) else {}

    model_id = result_data.get("model_id")
    disease = None

    if model_id:
        try:
            object_id = ObjectId(model_id)
        except Exception:
            object_id = model_id
        model_doc = models_db.collection.find_one({"_id": object_id})
        if model_doc:
            disease = model_doc.get("disease")

    if task.state == "PENDING":
        return {
                "status": "PENDING",
                "result": None,
                "task_id": str(task_id),
                "model_id": str(model_id),
                "disease": disease,
            }

    if task.state == "SUCCESS":
        return {
                "status": "SUCCESS",
                "result": result_data.get("prediction"),
                "task_id": str(task_id),
                "model_id": str(model_id),
                "disease": disease,
            }

    if task.state == "FAILURE":
        try:
            error_data = json.loads(
                task.backend.get(
                    task.backend.get_key_for_task(task.id),
                ).decode("utf-8")
            )
        except Exception:
            error_data = {"error": str(task.info)}

        return {
                "status": "FAILURE",
                "result": error_data,
                "task_id": str(task_id),
                "model_id": str(model_id),
                "disease": disease,
            }

    return {
            "status": task.status,
            "result": task.info,
            "task_id": str(task_id),
            "model_id": str(model_id),
            "disease": disease,
        }

def get_all_task_ids():
    inspect_data = celery_app.control.inspect()
    task_ids = set()

    for group in [inspect_data.active(), inspect_data.scheduled(), inspect_data.reserved()]:
        if group:
            for tasks in group.values():
                for task in tasks:
                    if task_id := task.get("id"):
                        task_ids.add(task_id)

    backend = celery_app.backend
    if hasattr(backend, "client"):
        for key in backend.client.keys("celery-task-meta-*"):
            task_id = key.decode("utf-8").replace("celery-task-meta-", "")
            task_ids.add(task_id)

    return list(task_ids)
