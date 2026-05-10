import os
import numpy as np
import joblib
from worker.worker import celery_app
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


class _HMMPredictor:
    """Inference-only reconstructor for TwoClassHMM_v1 saved state."""

    def __init__(self, state: dict):
        from hmmlearn import hmm as _hmm
        self._code_to_id = state["vocab"]["code_to_id"]
        n = state["n_components"]

        def _build(d):
            m = _hmm.CategoricalHMM(n_components=n)
            m.startprob_ = d["startprob_"]
            m.transmat_ = d["transmat_"]
            m.emissionprob_ = d["emissionprob_"]
            return m

        self._hmm_pos = _build(state["hmm_pos"])
        self._hmm_neg = _build(state["hmm_neg"])

    def _encode(self, codes: list) -> np.ndarray:
        ids = [self._code_to_id.get(c, 0) for c in codes]
        return np.array(ids).reshape(-1, 1)

    def predict_proba(self, sequences: list) -> np.ndarray:
        results = []
        for seq in sequences:
            arr = self._encode(seq)
            ll_pos = self._hmm_pos.score(arr)
            ll_neg = self._hmm_neg.score(arr)
            log_lls = np.array([ll_neg, ll_pos], dtype=float)
            log_lls -= log_lls.max()
            probs = np.exp(log_lls)
            probs /= probs.sum()
            results.append(probs.tolist())
        return np.array(results)

    def predict(self, sequences: list) -> np.ndarray:
        return (self.predict_proba(sequences)[:, 1] >= 0.5).astype(int)


@celery_app.task(name="run_model_prediction")
def run_model_prediction(model_id: str, model_path: str, codes: list, encoder_path: str = None):
    try:
        if not model_path or not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")

        raw = joblib.load(model_path)
        if isinstance(raw, dict) and raw.get("_format") == "TwoClassHMM_v1":
            model = _HMMPredictor(raw)
            is_hmm = True
        else:
            model = raw
            is_hmm = False

        encoder = None
        if encoder_path and os.path.exists(encoder_path):
            encoder = joblib.load(encoder_path)

        def encode_input(codes):
            if encoder:
                return encoder.transform([codes])
            if hasattr(model, "feature_names_in_"):
                feature_names = list(model.feature_names_in_)
                return [[1 if code in codes else 0 for code in feature_names]]
            if hasattr(model, "features"):
                feature_names = model.features
                return [[1 if code in codes else 0 for code in feature_names]]
            raise RuntimeError("Model does not contain feature names to construct input vector")

        def run_inference(entry_codes):
            if is_hmm:
                input_data = [entry_codes]
            else:
                input_data = encode_input(entry_codes)
            if hasattr(model, "predict_proba"):
                probas = model.predict_proba(input_data)
                return float(probas[0][1])
            result = model.predict(input_data)
            return int(result[0]) if hasattr(result, "__iter__") else int(result)

        if codes and isinstance(codes[0], dict) and "id" in codes[0] and "codes" in codes[0]:
            return {
                "predictions": [
                    {"id": entry["id"], "prediction": run_inference(entry["codes"])}
                    for entry in codes
                ],
                "model_id": model_id,
            }
        else:
            return {"prediction": run_inference(codes), "model_id": model_id}

    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise RuntimeError(f"Model execution failed: {str(e)}")
