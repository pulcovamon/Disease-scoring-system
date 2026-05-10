import numpy as np
import onnxruntime as ort
from functools import lru_cache


@lru_cache(maxsize=32)
def _get_session(model_path: str) -> ort.InferenceSession:
    return ort.InferenceSession(model_path)


@lru_cache(maxsize=32)
def _session_metadata(model_path: str) -> tuple[str, str]:
    """Return (input_name, prob_output_name) for a model."""
    session = _get_session(model_path)
    input_name = session.get_inputs()[0].name
    # sklearn models via skl2onnx emit two outputs: output_label (int64) then
    # output_probability (float32).  HMM has a single output named probabilities.
    # Find the first float output to skip the label tensor.
    for out in session.get_outputs():
        if out.type in ("tensor(float)", "tensor(double)"):
            return input_name, out.name
    return input_name, session.get_outputs()[-1].name


def run(model_path: str, codes: list) -> float:
    """Run inference and return P(class=1)."""
    session = _get_session(model_path)
    input_name, output_name = _session_metadata(model_path)

    # HMM: input is 1-D string array [seq_len]
    # RF/LR: input is 2-D string array [N, 1] — single space-joined code string
    shape = session.get_inputs()[0].shape
    if len(shape) == 1:
        input_data = np.array(codes, dtype=object)
    else:
        input_data = np.array([[" ".join(codes)]], dtype=object)

    result = session.run([output_name], {input_name: input_data})
    probas = result[0].ravel()   # flatten: always 1-D [P0, P1] or [P1]
    return float(probas[1] if probas.size > 1 else probas[0])
