from typing import List
import traceback
from celery import states

from worker import celery_app
import models

lung_cancer = models.LungCancer()
multiple_sclerosis = models.MultipleSclerosis()
hidradentis_supporativa = models.HidradentisSupporativa()

@celery_app.task(name="lung_cancer", bind=True)
def score_lung_cancer(self, data: List[int]):
    try:
        result = lung_cancer(data)
    except Exception as e:
        self.update_state(
            state=states.FAILURE,
            meta={
                "exc_type": type(e).__name__,
                "exc_message": traceback.format_exc().split("\n"),
            },
        )
        raise e
    return result


@celery_app.task(name="multiple_sclerosis", bind=True)
def score_multiple_sclerosis(self, data: List[int]):
    try:
        result = multiple_sclerosis(data)
    except Exception as e:
        self.update_state(
            state=states.FAILURE,
            meta={
                "exc_type": type(e).__name__,
                "exc_message": traceback.format_exc().split("\n"),
            },
        )
        raise e
    return result


@celery_app.task(name="hidradentis_supporativa", bind=True)
def score_hidradentis_supporativa(self, data: List[int]):
    try:
        result = hidradentis_supporativa(data)
    except Exception as e:
        self.update_state(
            state=states.FAILURE,
            meta={
                "exc_type": type(e).__name__,
                "exc_message": traceback.format_exc().split("\n"),
            },
        )
        raise e
    return result