from celery.result import AsyncResult

from api.worker import celery_app

def get_task_dict(task_id):
    task = AsyncResult(task_id, app=celery_app)
    match task.state:
        case "PENDING":
            response = {
                "status": task.state,
                "task_id": task.id,
            }
        case "SUCCESS":
            response = {
                "status": task.state,
                "result": task.result[0],
                "task_id": task.id,
                "disease": task.result[1],
            }
        case "FAILURE":
            response = {
                "status": task.state,
                "error": str(task.info),
                "task_id": task.id,
            }
        case _:
            response = {
                "status": task.state,
                "info": task.info,
                "task_id": task.id,
                "disease": None,
            }
    return response
