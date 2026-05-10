#!/usr/bin/env python3
"""
Convert trained .pkl models to self-contained .onnx artifacts.

RF / LR : converted via skl2onnx (sklearn Pipeline → ONNX)
HMM     : converted via a manually constructed ONNX graph that implements
          the log-space forward algorithm using the ONNX Scan operator.

Usage:
    python convert/to_onnx.py --input artifacts/ --output artifacts/onnx/
"""
import argparse
import os
import sys

# Ensure the training root is on the path so old-format pkl files that
# embed "models.hmm" and "pipeline.preprocessor" class references can load.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import joblib
import numpy as np
import onnx
from onnx import TensorProto, checker, helper, numpy_helper
from onnx.helper import (
    make_graph,
    make_model,
    make_node,
    make_opsetid,
    make_tensor_value_info,
)
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import StringTensorType

OPSET = 17      # main domain
ML_OPSET = 4    # ai.onnx.ml domain (LabelEncoder with keys_strings/values_int64)


# ─────────────────────────────────────────────────────────────────────────────
# sklearn Pipeline → ONNX  (Random Forest and Logistic Regression)
# ─────────────────────────────────────────────────────────────────────────────

def _fix_rf_binary_proba(model_onnx: onnx.ModelProto) -> onnx.ModelProto:
    """
    Workaround for skl2onnx ≥1.20 binary RandomForestClassifier bug: the
    `probabilities` output is [P0-1, P1] instead of [P0, P1].  The offset is
    a constant [1, 0] — add it back.
    """
    graph = model_onnx.graph
    raw = "probabilities_raw_rf"

    # rename the existing `probabilities` tensor throughout the graph
    for node in graph.node:
        for i, o in enumerate(node.output):
            if o == "probabilities":
                node.output[i] = raw

    offset_name = "rf_proba_offset"
    graph.initializer.append(
        numpy_helper.from_array(np.array([1.0, 0.0], dtype=np.float32), name=offset_name)
    )
    graph.node.append(make_node("Add", [raw, offset_name], ["probabilities"]))
    return model_onnx


def convert_sklearn_pipeline(pkl_path: str, onnx_path: str, name: str) -> None:
    pipeline = joblib.load(pkl_path)
    last_estimator = pipeline.steps[-1][1]
    model_onnx = convert_sklearn(
        pipeline,
        name=name,
        initial_types=[("input", StringTensorType([None, 1]))],
        # zipmap=False → plain float32[N, 2] instead of a list-of-dicts
        options={id(last_estimator): {"zipmap": False}},
    )

    if name == "RandomForest":
        model_onnx = _fix_rf_binary_proba(model_onnx)

    checker.check_model(model_onnx)
    onnx.save(model_onnx, onnx_path)


# ─────────────────────────────────────────────────────────────────────────────
# TwoClassHMM → ONNX  (manual graph)
# ─────────────────────────────────────────────────────────────────────────────

def _scan_body(log_transmat: np.ndarray, sfx: str) -> onnx.GraphProto:
    """
    Body graph for the ONNX Scan operator: one forward-pass step.

    Inputs  : log_alpha_prev [n], emit_t [n]
    Output  : new_log_alpha  [n]

    Numerically stable log-sum-exp over from-states:
        candidates[i, j] = log_alpha_prev[i] + log_transmat[i, j]
        new_alpha[j]      = logsumexp_i(candidates[:, j]) + emit_t[j]
    """
    n = log_transmat.shape[0]
    # node names
    tm   = f"tm_{sfx}"    # log_transmat constant [n, n]
    ax1  = f"ax1_{sfx}"  # axes=[1] tensor for Unsqueeze  (opset 13+: input)
    ax0s = f"ax0s_{sfx}" # axes=[0] tensor for ReduceSum  (opset 13+: input)

    alpha = f"a_{sfx}"
    emit  = f"e_{sfx}"
    col   = f"col_{sfx}"   # alpha as column [n, 1]
    cand  = f"cd_{sfx}"    # candidates [n, n]
    mx    = f"mx_{sfx}"    # col-wise max [n]   (ReduceMax: axes still attribute in opset 17)
    sh    = f"sh_{sfx}"    # shifted [n, n]
    ex    = f"ex_{sfx}"    # exp(shifted) [n, n]
    sm    = f"sm_{sfx}"    # col-wise sum [n]   (ReduceSum: axes became input in opset 13)
    lg    = f"lg_{sfx}"    # log(sum) [n]
    lse   = f"lse_{sfx}"   # log_sum_exp [n]
    out   = f"out_{sfx}"   # new log_alpha [n]

    return make_graph(
        name=f"fwd_{sfx}",
        inputs=[
            make_tensor_value_info(alpha, TensorProto.FLOAT, [n]),
            make_tensor_value_info(emit,  TensorProto.FLOAT, [n]),
        ],
        outputs=[make_tensor_value_info(out, TensorProto.FLOAT, [n])],
        initializer=[
            numpy_helper.from_array(log_transmat, name=tm),
            numpy_helper.from_array(np.array([1], dtype=np.int64), name=ax1),
            numpy_helper.from_array(np.array([0], dtype=np.int64), name=ax0s),
        ],
        nodes=[
            make_node("Unsqueeze", [alpha, ax1],   [col]),
            make_node("Add",       [col, tm],       [cand]),
            # ReduceMax: axes still an attribute in opset 17
            make_node("ReduceMax", [cand],          [mx],  axes=[0], keepdims=0),
            make_node("Sub",       [cand, mx],      [sh]),
            make_node("Exp",       [sh],            [ex]),
            # ReduceSum: axes moved to input in opset 13
            make_node("ReduceSum", [ex, ax0s],      [sm],  keepdims=0),
            make_node("Log",       [sm],            [lg]),
            make_node("Add",       [lg, mx],        [lse]),
            make_node("Add",       [lse, emit],     [out]),
        ],
    )


def _hmm_ll_nodes(
    token_ids: str,
    sfx: str,
    log_sp: np.ndarray,   # log startprob      [n]
    log_tm: np.ndarray,   # log transmat        [n, n]
    log_ep: np.ndarray,   # log emissionprob    [n, vocab_size]
) -> tuple[list, list, str]:
    """
    Build the outer-graph nodes and initializers for one HMM's forward pass.
    Returns (nodes, initializers, name_of_scalar_ll_output).

    Graph fragment:
        Gather(log_ep.T, token_ids) → emit_all [seq_len, n]
        emit_all[0] + log_sp       → log_alpha_0 [n]
        Scan(log_alpha_0, emit_all[1:]) → log_alpha_final [n]
        ReduceLogSumExp(log_alpha_final) → ll (scalar)
    """
    n = log_ep.shape[0]

    # initializer names
    ep_T = f"epT_{sfx}"   # emissionprob transposed [vocab_size, n]
    sp   = f"sp_{sfx}"    # log startprob [n]
    s0   = f"s0_{sfx}"    # starts=[0] for Slice
    e1   = f"e1_{sfx}"    # ends=[1]
    s1   = f"s1_{sfx}"    # starts=[1]
    einf = f"ei_{sfx}"    # ends=[INT64_MAX]
    ax   = f"ax_{sfx}"    # axis=[0] for Slice
    sqax = f"sq_{sfx}"    # axes=[0] for Squeeze

    # intermediate names
    ea  = f"ea_{sfx}"    # emit_all [seq_len, n]
    e0s = f"e0s_{sfx}"   # emit_all[0:1, :] [1, n]
    e0  = f"e0_{sfx}"    # emit_all[0]  [n]
    er  = f"er_{sfx}"    # emit_all[1:] [seq_len-1, n]
    a0  = f"a0_{sfx}"    # log_alpha_0  [n]
    af  = f"af_{sfx}"    # log_alpha final [n]
    ll  = f"ll_{sfx}"    # log-likelihood (scalar)

    inits = [
        numpy_helper.from_array(log_ep.T.astype(np.float32), name=ep_T),
        numpy_helper.from_array(log_sp.astype(np.float32),   name=sp),
        numpy_helper.from_array(np.array([0],                   dtype=np.int64), name=s0),
        numpy_helper.from_array(np.array([1],                   dtype=np.int64), name=e1),
        numpy_helper.from_array(np.array([1],                   dtype=np.int64), name=s1),
        numpy_helper.from_array(np.array([np.iinfo(np.int64).max], dtype=np.int64), name=einf),
        numpy_helper.from_array(np.array([0],                   dtype=np.int64), name=ax),
        numpy_helper.from_array(np.array([0],                   dtype=np.int64), name=sqax),
    ]

    nodes = [
        # emit_all[t, j] = log P(obs=token_ids[t] | state=j)
        make_node("Gather", [ep_T, token_ids], [ea], axis=0),
        # Initialise: log_alpha_0 = log_startprob + emission_0
        make_node("Slice",   [ea, s0, e1, ax], [e0s]),
        make_node("Squeeze", [e0s, sqax],       [e0]),
        make_node("Slice",   [ea, s1, einf, ax], [er]),
        make_node("Add",     [sp, e0],           [a0]),
        # Forward pass: iterate over emit_all[1:]
        make_node("Scan", [a0, er], [af],
                  body=_scan_body(log_tm.astype(np.float32), sfx),
                  num_scan_inputs=1),
        # Log-likelihood = logsumexp(log_alpha_final)
        make_node("ReduceLogSumExp", [af], [ll], axes=[0], keepdims=0),
    ]

    return nodes, inits, ll


def _normalise_hmm_state(raw) -> dict:
    """
    Accept both pkl formats and return a uniform TwoClassHMM_v1-style dict.

    Old format (pre-migration):  {"model": TwoClassHMM, "vocab": CodeVocabulary}
    New format (TwoClassHMM_v1): plain dict with numpy arrays
    """
    if isinstance(raw, dict) and raw.get("_format") == "TwoClassHMM_v1":
        return raw

    if isinstance(raw, dict) and "model" in raw and "vocab" in raw:
        obj   = raw["model"]   # TwoClassHMM instance
        vocab = raw["vocab"]   # CodeVocabulary instance
        return {
            "_format": "TwoClassHMM_v1",
            "n_components": obj.n_components,
            "vocab": {
                "code_to_id": vocab.code_to_id,
                "vocab_size":  vocab.vocab_size,
            },
            "hmm_pos": {
                "startprob_":    obj.hmm_pos.startprob_,
                "transmat_":     obj.hmm_pos.transmat_,
                "emissionprob_": obj.hmm_pos.emissionprob_,
            },
            "hmm_neg": {
                "startprob_":    obj.hmm_neg.startprob_,
                "transmat_":     obj.hmm_neg.transmat_,
                "emissionprob_": obj.hmm_neg.emissionprob_,
            },
        }

    raise ValueError(f"Unrecognised HMM pkl format: keys={list(raw.keys()) if isinstance(raw, dict) else type(raw)}")


def convert_hmm(pkl_path: str, onnx_path: str) -> None:
    state = _normalise_hmm_state(joblib.load(pkl_path))

    vocab = state["vocab"]
    keys = list(vocab["code_to_id"].keys())
    vals = [int(vocab["code_to_id"][k]) for k in keys]

    def _log(hmm_dict: dict, key: str) -> np.ndarray:
        return np.log(np.clip(hmm_dict[key], 1e-300, None)).astype(np.float32)

    lsp_pos = _log(state["hmm_pos"], "startprob_")
    ltm_pos = _log(state["hmm_pos"], "transmat_")
    lep_pos = _log(state["hmm_pos"], "emissionprob_")

    lsp_neg = _log(state["hmm_neg"], "startprob_")
    ltm_neg = _log(state["hmm_neg"], "transmat_")
    lep_neg = _log(state["hmm_neg"], "emissionprob_")

    tids = "token_ids"

    nodes_pos, inits_pos, ll_pos = _hmm_ll_nodes(tids, "pos", lsp_pos, ltm_pos, lep_pos)
    nodes_neg, inits_neg, ll_neg = _hmm_ll_nodes(tids, "neg", lsp_neg, ltm_neg, lep_neg)

    # Combine: softmax([ll_neg, ll_pos]) → float32[1, 2]
    ax_n = "axn"; ax_p = "axp"; ax_2d = "ax2d"
    neg1d = "neg1d"; pos1d = "pos1d"; logits = "logits"; logits2d = "logits2d"

    combine_inits = [
        numpy_helper.from_array(np.array([0], dtype=np.int64), name=ax_n),
        numpy_helper.from_array(np.array([0], dtype=np.int64), name=ax_p),
        numpy_helper.from_array(np.array([0], dtype=np.int64), name=ax_2d),
    ]
    combine_nodes = [
        make_node("Unsqueeze", [ll_neg, ax_n],       [neg1d]),
        make_node("Unsqueeze", [ll_pos, ax_p],       [pos1d]),
        make_node("Concat",    [neg1d, pos1d],        [logits],   axis=0),
        make_node("Unsqueeze", [logits, ax_2d],       [logits2d]),
        make_node("Softmax",   [logits2d], ["probabilities"], axis=1),
    ]

    # Vocab lookup: string[seq_len] → int64[seq_len]
    le_node = make_node(
        "LabelEncoder", ["input"], [tids],
        domain="ai.onnx.ml",
        keys_strings=keys,
        values_int64s=vals,
        default_int64=0,
    )

    graph = make_graph(
        nodes=[le_node] + nodes_pos + nodes_neg + combine_nodes,
        name="TwoClassHMM",
        inputs=[make_tensor_value_info("input", TensorProto.STRING, [None])],
        outputs=[make_tensor_value_info("probabilities", TensorProto.FLOAT, [1, 2])],
        initializer=inits_pos + inits_neg + combine_inits,
    )

    model = make_model(
        graph,
        opset_imports=[make_opsetid("", OPSET), make_opsetid("ai.onnx.ml", ML_OPSET)],
    )
    model.ir_version = 8

    checker.check_model(model)
    onnx.save(model, onnx_path)


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

_MODELS = [
    ("rf_model.pkl",  "rf_model.onnx",  "rf"),
    ("lr_model.pkl",  "lr_model.onnx",  "lr"),
    ("hmm_model.pkl", "hmm_model.onnx", "hmm"),
]


def main() -> None:
    p = argparse.ArgumentParser(description="Convert .pkl models to .onnx")
    p.add_argument("--input",  required=True, help="Directory containing .pkl files")
    p.add_argument("--output", required=True, help="Directory to write .onnx files")
    args = p.parse_args()

    os.makedirs(args.output, exist_ok=True)
    failed: list[str] = []

    for pkl_name, onnx_name, kind in _MODELS:
        src = os.path.join(args.input, pkl_name)
        dst = os.path.join(args.output, onnx_name)
        if not os.path.exists(src):
            print(f"  ⚠  {pkl_name} not found, skipping")
            continue
        print(f"Converting {pkl_name} → {onnx_name} …")
        try:
            if kind == "hmm":
                convert_hmm(src, dst)
            else:
                display = "RandomForest" if kind == "rf" else "LogisticRegression"
                convert_sklearn_pipeline(src, dst, display)
            print(f"  ✓ {onnx_name}")
        except Exception as exc:
            print(f"  ✗ {onnx_name}: {exc}")
            failed.append(pkl_name)

    if failed:
        print(f"\nFailed: {', '.join(failed)}")
        sys.exit(1)
    print("\nAll conversions complete.")


if __name__ == "__main__":
    main()
