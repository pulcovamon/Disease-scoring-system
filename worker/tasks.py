import os
import traceback
from typing import List, Dict, Tuple, Union

import joblib
from pymongo import MongoClient
from celery import states

from worker.worker import celery_app

client = MongoClient("mongodb://root:pass@0.0.0.0:27017")
scoring_db = client["scoring_system"]
models_collection = scoring_db["models"]

def get_model_path(model_name: str) -> str:
    model_doc = models_collection.find_one({"_id": "default"})
    if model_doc:
        base_path = model_doc.get("path", "/app/models/default/")
        for child in model_doc.get("children", []):
            if child.get("name") == model_name:
                return os.path.join(base_path, child.get("filename"))
    raise ValueError(f"Model s názvem {model_name} nebyl nalezen.")

def load_real_model(model_name: str):
    model_path = get_model_path(model_name)
    if os.path.exists(model_path):
        return joblib.load(model_path)
    else:
        raise FileNotFoundError(f"Soubor s modelem {model_path} nebyl nalezen.")

class RealModelWrapper:
    def __init__(self, model, model_type: str):
        self.model = model
        self.model_type = model_type

    def __call__(self, codes: List[str]) -> float:
        prediction = self.model.predict([codes])
        return float(prediction[0])

def process_predictions(
    model, data: Union[List[str], List[Dict[str, List[str]]]]
) -> List[Tuple[str, float]]:
    results = []
    if isinstance(data[0], dict):
        for patient in data:
            codes = patient.get("codes", [])
            if not codes:
                raise ValueError("Každý dict musí obsahovat klíč 'codes' s neprázdným seznamem.")
            result = model(codes)
            results.append((result, model.model_type))
    else:
        result = model(data)
        results.append((result, model.model_type))
    return results

@celery_app.task(name="lung_cancer", bind=True)
def score_lung_cancer(
    self, data: Union[List[str], List[Dict[str, List[str]]]]
) -> Union[Tuple[str, float], List[Tuple[str, float]]]:
    try:
        if not isinstance(data, list):
            raise ValueError("Input data must be a list.")
        raw_model = load_real_model("Logistic Regression")
        lung_cancer_model = RealModelWrapper(raw_model, "lung_cancer")
        result = process_predictions(lung_cancer_model, data)
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

@celery_app.task(name="multiple_sclerosis", bind=True)
def score_multiple_sclerosis(
    self, data: Union[List[str], List[Dict[str, List[str]]]]
) -> Union[Tuple[str, float], List[Tuple[str, float]]]:
    try:
        if not isinstance(data, list):
            raise ValueError("Input data must be a list.")
        raw_model = load_real_model("Random Forest")
        ms_model = RealModelWrapper(raw_model, "multiple_sclerosis")
        result = process_predictions(ms_model, data)
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
    try:
        if not isinstance(data, list):
            raise ValueError("Input data must be a list.")
        raw_model = load_real_model("Some Hidradentis Model")
        hs_model = RealModelWrapper(raw_model, "hidradentis_supporativa")
        result = process_predictions(hs_model, data)
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
