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

    base = {
        "task_id": str(task_id),
        "model_id": str(model_id) if model_id else None,
        "disease": disease,
    }

    if task.state == "PENDING":
        return {**base, "status": "PENDING", "result": None, "result_type": None, "predictions": None}

    if task.state == "SUCCESS":
        predictions = result_data.get("predictions")
        if predictions is not None:
            return {**base, "status": "SUCCESS", "result": None, "result_type": "bulk", "predictions": predictions}
        return {**base, "status": "SUCCESS", "result": result_data.get("prediction"), "result_type": "single", "predictions": None}

    if task.state == "FAILURE":
        try:
            error_data = json.loads(
                task.backend.get(
                    task.backend.get_key_for_task(task.id),
                ).decode("utf-8")
            )
        except Exception:
            error_data = {"error": str(task.info)}

        return {**base, "status": "FAILURE", "result": error_data, "result_type": None, "predictions": None}

    return {**base, "status": task.status, "result": task.info, "result_type": None, "predictions": None}

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
