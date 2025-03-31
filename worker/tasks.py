import os
import joblib
from worker.worker import celery_app
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

@celery_app.task(name="run_model_prediction")
def run_model_prediction(model_path: str, codes: list, encoder_path: str = None):
    try:
        if not model_path or not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")

        model = joblib.load(model_path)

        if encoder_path and os.path.exists(encoder_path):
            encoder = joblib.load(encoder_path)
            input_vector = encoder.transform([codes])
        else:
            if hasattr(model, "feature_names_in_"):
                feature_names = list(model.feature_names_in_)
                input_vector = [[1 if code in codes else 0 for code in feature_names]]
            elif hasattr(model, "features"):
                feature_names = model.features
                input_vector = [[1 if code in codes else 0 for code in feature_names]]
            else:
                raise RuntimeError("Model does not contain feature names to construct input vector")

        if hasattr(model, "predict_proba"):
            probas = model.predict_proba(input_vector)
            result = float(probas[0][1])
        else:
            result = model.predict(input_vector)
            result = int(result[0]) if hasattr(result, "__iter__") else int(result)

        return {"prediction": result}

    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise RuntimeError(f"Model execution failed: {str(e)}")
