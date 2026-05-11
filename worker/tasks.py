import os
from worker.worker import celery_app
from worker import inference
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@celery_app.task(name="run_model_prediction")
def run_model_prediction(model_id: str, model_path: str, codes: list, encoder_path: str = None):
    try:
        if not model_path or not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")

        def predict_one(entry_codes):
            return inference.run(model_path, entry_codes)

        if codes and isinstance(codes[0], dict) and "id" in codes[0] and "codes" in codes[0]:
            return {
                "predictions": [
                    {"id": entry["id"], "prediction": predict_one(entry["codes"]), "codes": entry["codes"]}
                    for entry in codes
                ],
                "model_id": model_id,
            }
        else:
            return {"prediction": predict_one(codes), "model_id": model_id}

    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise RuntimeError(f"Model execution failed: {str(e)}")
