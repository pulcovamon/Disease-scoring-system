"""
Celery tasks definition.
"""
import traceback
from typing import List, Tuple

import models
from celery import states

from worker import celery_app


# Initialize ML models
lung_cancer = models.LungCancer()
multiple_sclerosis = models.MultipleSclerosis()
hidradentis_supporativa = models.HidradentisSupporativa()


@celery_app.task(name="lung_cancer", bind=True)
def score_lung_cancer(self, data: List[int]) -> Tuple[str, float]:
    """
    Predict probability of lung cancer.

    Args:
        data (List[int]): list of examination codes

    returns:
        Tuple[float, str]: probability of lung cancer and disease name
    """
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
    return result, "lung cancer"


@celery_app.task(name="multiple_sclerosis", bind=True)
def score_multiple_sclerosis(self, data: List[int]):
    """
    Predict probability of multiple sclerosis.

    Args:
        data (List[int]): list of examination codes

    returns:
        Tuple[float, str]:
                probability of multiple sclerosis and disease name
    """
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
    return result, "multiple sclerosis"


@celery_app.task(name="hidradentis_supporativa", bind=True)
def score_hidradentis_supporativa(self, data: List[int]):
    """
    Predict probability of hidradentis supporativa.

    Args:
        data (List[int]): list of examination codes

    returns:
        Tuple[float, str]:
                probability of hidradentis supporativa and disease name
    """
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
    return result, "hidradentis supporativa"
