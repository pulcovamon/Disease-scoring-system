"""
Celery tasks definition.
"""

import traceback
from typing import List, Dict, Tuple, Union

import models
from celery import states

from worker import celery_app

# Initialize ML models
lung_cancer = models.LungCancer()
multiple_sclerosis = models.MultipleSclerosis()
hidradentis_supporativa = models.HidradentisSupporativa()


def process_predictions(
    model, data: Union[List[str], List[Dict[str, List[str]]]]
) -> List[Tuple[str, float]]:
    """
    Helper function to process predictions for single or multiple patients.

    Args:
        model: ML model instance to use for predictions.
        data: Either a single patient's codes or a list of dicts with patient codes.

    Returns:
        List of tuples with probability and disease name.
    """
    results = []

    if isinstance(data[0], dict):  # List of dicts
        for patient in data:
            codes = patient.get("codes", [])
            if not codes:
                raise ValueError("Each dict must contain a 'codes' key with a non-empty list.")
            result = model(codes)
            results.append((result, model.model_type))
    else:  # Single patient (list of codes)
        result = model(data)
        results.append((result, model.model_type))

    return results


@celery_app.task(name="lung_cancer", bind=True)
def score_lung_cancer(
    self, data: Union[List[str], List[Dict[str, List[str]]]]
) -> Union[Tuple[str, float], List[Tuple[str, float]]]:
    """
    Predict probability of lung cancer.

    Args:
        data: Single patient's codes or a list of dicts with patient codes.

    Returns:
        Single or list of tuples with probability and disease name.
    """
    try:
        if not isinstance(data, list):
            raise ValueError("Input data must be a list.")
        result = process_predictions(lung_cancer, data)
        return result if len(result) > 1 else result[0]  # Single result if one patient
    except Exception as e:
        self.update_state(
            state=states.FAILURE,
            meta={
                "exc_type": type(e).__name__,
                "exc_message": traceback.format_exc().split("\n"),
            },
        )
        raise e


@celery_app.task(name="multiple_sclerosis", bind=True)
def score_multiple_sclerosis(
    self, data: Union[List[str], List[Dict[str, List[str]]]]
) -> Union[Tuple[str, float], List[Tuple[str, float]]]:
    """
    Predict probability of multiple sclerosis.

    Args:
        data: Single patient's codes or a list of dicts with patient codes.

    Returns:
        Single or list of tuples with probability and disease name.
    """
    try:
        if not isinstance(data, list):
            raise ValueError("Input data must be a list.")
        result = process_predictions(multiple_sclerosis, data)
        return result if len(result) > 1 else result[0]
    except Exception as e:
        self.update_state(
            state=states.FAILURE,
            meta={
                "exc_type": type(e).__name__,
                "exc_message": traceback.format_exc().split("\n"),
            },
        )
        raise e


@celery_app.task(name="hidradentis_supporativa", bind=True)
def score_hidradentis_supporativa(
    self, data: Union[List[str], List[Dict[str, List[str]]]]
) -> Union[Tuple[str, float], List[Tuple[str, float]]]:
    """
    Predict probability of hidradentis supporativa.

    Args:
        data: Single patient's codes or a list of dicts with patient codes.

    Returns:
        Single or list of tuples with probability and disease name.
    """
    try:
        if not isinstance(data, list):
            raise ValueError("Input data must be a list.")
        result = process_predictions(hidradentis_supporativa, data)
        return result if len(result) > 1 else result[0]
    except Exception as e:
        self.update_state(
            state=states.FAILURE,
            meta={
                "exc_type": type(e).__name__,
                "exc_message": traceback.format_exc().split("\n"),
            },
        )
        raise e
