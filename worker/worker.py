import os

from celery import Celery

# celery broker and backend urls
CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://redis_server:6379")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://redis_server:6379")


# create celery application
celery_app = Celery(
    "celery",
    backend=CELERY_RESULT_BACKEND,
    broker=CELERY_BROKER_URL,
)
