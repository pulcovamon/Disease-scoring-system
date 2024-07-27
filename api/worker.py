import os

from celery import Celery
from celery.signals import after_task_publish

# celery broker and backend urls
CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://redis_server:6379")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://redis_server:6379")


# create celery application
celery_app = Celery(
    "celery",
    backend=CELERY_RESULT_BACKEND,
    broker=CELERY_BROKER_URL,
)

@after_task_publish.connect
def update_sent_state(sender=None, headers=None, **kwargs):
    """
    Set celery task state to 'SENT' if in process.
    """
    backend = (
        task.backend if celery_app.tasks.get(sender) else celery_app.backend
    )
    backend.store_result(headers["id"], None, "SENT")
