import os
import joblib
from worker.worker import celery_app
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

@celery_app.task(name="run_model_prediction")
def run_model_prediction(model_id: str, model_path: str, codes: list, encoder_path: str = None):
    try:
        if not model_path or not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")

        model = joblib.load(model_path)

        if encoder_path and os.path.exists(encoder_path):
            encoder = joblib.load(encoder_path)

        def encode_input(codes):
            if encoder_path and encoder:
                return encoder.transform([codes])
            if hasattr(model, "feature_names_in_"):
                feature_names = list(model.feature_names_in_)
                return [[1 if code in codes else 0 for code in feature_names]]
            if hasattr(model, "features"):
                feature_names = model.features
                return [[1 if code in codes else 0 for code in feature_names]]
            raise RuntimeError("Model does not contain feature names to construct input vector")

        if codes and isinstance(codes[0], dict) and "id" in codes[0] and "codes" in codes[0]:
            results = []
            for entry in codes:
                input_vector = encode_input(entry["codes"])
                if hasattr(model, "predict_proba"):
                    probas = model.predict_proba(input_vector)
                    prediction = float(probas[0][1])
                else:
                    prediction = model.predict(input_vector)
                    prediction = int(prediction[0]) if hasattr(prediction, "__iter__") else int(prediction)
                results.append({"id": entry["id"], "prediction": prediction})
            return {"predictions": results, "model_id": model_id}
        else:
            input_vector = encode_input(codes)
            if hasattr(model, "predict_proba"):
                probas = model.predict_proba(input_vector)
                result = float(probas[0][1])
            else:
                result = model.predict(input_vector)
                result = int(result[0]) if hasattr(result, "__iter__") else int(result)
            return {"prediction": result, "model_id": model_id}

    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise RuntimeError(f"Model execution failed: {str(e)}")
