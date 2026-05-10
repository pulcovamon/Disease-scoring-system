"""
Main training entry point for the disease scoring pipeline.

Usage:
    # Pull data directly from MongoDB (recommended)
    python train.py --from-mongo

    # MongoDB with cross-validation
    python train.py --from-mongo --cv

    # From a preprocessed JSON file
    python train.py --data hmm/patients_filtered.json

    # Synthetic data (no database needed)
    python train.py --synthetic

    # Custom output directory
    python train.py --from-mongo --output artifacts/
"""

import argparse
import json
import logging
import os
import sys
import time

import numpy as np

from pipeline.data import load_patients, load_from_mongo, patient_split, flatten_sequences
from pipeline.evaluate import (
    evaluate,
    cross_validate_patients,
    print_comparison,
    summarize_cv,
)
from models.hmm import TwoClassHMM
from models.random_forest import RFClassifier
from models.logistic import LRClassifier
from _old.utils.generate_sequences import generate_sequences

logger = logging.getLogger(__name__)

MODELS = {
    "hmm": TwoClassHMM,
    "rf": RFClassifier,
    "lr": LRClassifier,
}


def patients_from_synthetic(n: int = 2000, length: int = 20) -> list:
    """Wrap flat synthetic sequences in the patients.json format."""
    raw = generate_sequences(num_sequences=n, sequence_length=length)
    return [
        {
            "id": i,
            "sequences": [{"codes": item["codes"], "label": item["label"]}],
        }
        for i, item in enumerate(raw)
    ]


def setup_logging(output_dir: str) -> None:
    """Configure root logger to write to stdout and a timestamped log file."""
    os.makedirs(output_dir, exist_ok=True)
    log_path = os.path.join(
        output_dir, f"training_{time.strftime('%Y%m%d_%H%M%S')}.log"
    )
    fmt = logging.Formatter("[%(asctime)s] %(message)s", datefmt="%H:%M:%S")

    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(logging.INFO)
    for handler in (logging.StreamHandler(sys.stdout), logging.FileHandler(log_path, encoding="utf-8")):
        handler.setFormatter(fmt)
        root.addHandler(handler)

    logger.info(f"Log file: {log_path}")


def _elapsed(t0: float) -> str:
    s = int(time.time() - t0)
    return f"{s // 60}m {s % 60}s" if s >= 60 else f"{s}s"


class _NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        return super().default(obj)


def _save_metrics(
    path, data_source,
    train_p, val_p, test_p,
    train_labels, val_labels, test_labels,
    val_results, test_results,
    val_preds, test_preds,
    cv_results,
):
    data = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "data_source": str(data_source),
        "split": {
            "train": {
                "n_patients": len(train_p),
                "n_sequences": len(train_labels),
                "n_class_1": int(sum(train_labels)),
                "n_class_0": int(train_labels.count(0)),
            },
            "val": {
                "n_patients": len(val_p),
                "n_sequences": len(val_labels),
                "y_true": list(val_labels),
            },
            "test": {
                "n_patients": len(test_p),
                "n_sequences": len(test_labels),
                "y_true": list(test_labels),
            },
        },
        "models": {
            name: {
                "val": {**val_results[name], "y_prob": val_preds[name]["y_prob"]},
                "test": {**test_results[name], "y_prob": test_preds[name]["y_prob"]},
            }
            for name in val_results
        },
    }
    if cv_results:
        data["cv"] = cv_results

    with open(path, "w") as f:
        json.dump(data, f, indent=2, cls=_NpEncoder)


def run(data_path=None, output_dir="artifacts", cv=False, synthetic=False, from_mongo=False):
    os.makedirs(output_dir, exist_ok=True)
    setup_logging(output_dir)

    if synthetic:
        logger.info("Generating synthetic data (2000 sequences, length 20)...")
        t0 = time.time()
        patients = patients_from_synthetic()
        logger.info(f"Generated {len(patients)} synthetic patients  ({_elapsed(t0)})")
    elif from_mongo:
        logger.info("Connecting to MongoDB...")
        t0 = time.time()
        patients = load_from_mongo()
        logger.info(f"Loaded {len(patients)} patients from MongoDB  ({_elapsed(t0)})")
    elif data_path is not None:
        if not os.path.exists(data_path):
            logger.error(f"Data file not found: {data_path}")
            logger.error("Options:")
            logger.error("  Pull directly from MongoDB:  python train.py --from-mongo")
            logger.error("  Use synthetic data:          python train.py --synthetic")
            sys.exit(1)
        logger.info(f"Loading {data_path}...")
        t0 = time.time()
        patients = load_patients(data_path)
        logger.info(f"Loaded {len(patients)} patients  ({_elapsed(t0)})")
    else:
        logger.error("No data source specified. Use --from-mongo, --data <path>, or --synthetic.")
        sys.exit(1)

    logger.info("Splitting data at patient level (70 / 15 / 15)...")
    train_p, val_p, test_p = patient_split(patients)
    train_seqs, train_labels, _ = flatten_sequences(train_p)
    val_seqs, val_labels, _ = flatten_sequences(val_p)
    test_seqs, test_labels, _ = flatten_sequences(test_p)

    logger.info(
        f"  Train : {len(train_p):>5} patients  →  {len(train_seqs):>6} sequences"
        f"  (class-1: {sum(train_labels)}, class-0: {train_labels.count(0)})"
    )
    logger.info(f"  Val   : {len(val_p):>5} patients  →  {len(val_seqs):>6} sequences")
    logger.info(f"  Test  : {len(test_p):>5} patients  →  {len(test_seqs):>6} sequences")

    val_results = {}
    test_results = {}
    val_preds = {}
    test_preds = {}

    for name, model_cls in MODELS.items():
        logger.info(f"── {name.upper()} ──────────────────────────────────")

        t_fit = time.time()
        model = model_cls(verbose=True)
        model.fit(train_seqs, train_labels)
        logger.info(f"Fit complete  ({_elapsed(t_fit)})")

        t_eval = time.time()
        logger.info(f"  Evaluating on val  ({len(val_seqs)} sequences)...")
        val_pred = model.predict(val_seqs)
        val_prob = model.predict_proba(val_seqs)[:, 1] if hasattr(model, "predict_proba") else None
        val_results[name] = evaluate(val_labels, val_pred, val_prob)
        val_preds[name] = {"y_prob": val_prob}
        logger.info(f"  Val eval done  ({_elapsed(t_eval)})")

        t_eval = time.time()
        logger.info(f"  Evaluating on test ({len(test_seqs)} sequences)...")
        test_pred = model.predict(test_seqs)
        test_prob = model.predict_proba(test_seqs)[:, 1] if hasattr(model, "predict_proba") else None
        test_results[name] = evaluate(test_labels, test_pred, test_prob)
        test_preds[name] = {"y_prob": test_prob}
        logger.info(f"  Test eval done  ({_elapsed(t_eval)})")

        artifact_path = os.path.join(output_dir, f"{name}_model.pkl")
        model.save(artifact_path)
        logger.info(f"Saved → {artifact_path}")

    logger.info("=== Validation Results ===")
    print_comparison(val_results)

    logger.info("=== Test Results ===")
    print_comparison(test_results)

    cv_results = {}
    if cv:
        logger.info("=== 5-Fold Patient-Level Cross-Validation ===")
        for name, model_cls in MODELS.items():
            logger.info(f"Cross-validating {name.upper()}...")
            fold_results = cross_validate_patients(
                model_cls, patients, n_splits=5, verbose=True, name=name
            )
            summary = summarize_cv(fold_results)
            cv_results[name] = {"folds": fold_results, "summary": summary}
            metric_keys = ["accuracy", "precision", "recall", "f1", "roc_auc"]
            parts = [
                f"{k}: {summary[f'{k}_mean']:.4f} ± {summary[f'{k}_std']:.4f}"
                for k in metric_keys
                if f"{k}_mean" in summary
            ]
            logger.info(f"  {name.upper()} summary: {',  '.join(parts)}")

    metrics_path = os.path.join(output_dir, "metrics.json")
    _save_metrics(
        path=metrics_path,
        data_source="mongodb" if from_mongo else ("synthetic" if synthetic else data_path),
        train_p=train_p, val_p=val_p, test_p=test_p,
        train_labels=train_labels, val_labels=val_labels, test_labels=test_labels,
        val_results=val_results, test_results=test_results,
        val_preds=val_preds, test_preds=test_preds,
        cv_results=cv_results,
    )
    logger.info(f"Metrics saved → {metrics_path}")


def main():
    parser = argparse.ArgumentParser(description="Train disease scoring models")
    parser.add_argument(
        "--data", type=str, default=None, help="Path to patients JSON file"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="artifacts",
        help="Output directory for saved models (default: artifacts/)",
    )
    parser.add_argument(
        "--cv",
        action="store_true",
        help="Run 5-fold patient-level cross-validation after training",
    )
    parser.add_argument(
        "--synthetic",
        action="store_true",
        help="Use generated synthetic data (no database or file needed)",
    )
    parser.add_argument(
        "--from-mongo",
        action="store_true",
        dest="from_mongo",
        help="Pull data directly from MongoDB (uses MONGO_URL env var, default: mongodb://root:pass@localhost:27017)",
    )
    args = parser.parse_args()
    run(
        data_path=args.data,
        output_dir=args.output,
        cv=args.cv,
        synthetic=args.synthetic,
        from_mongo=args.from_mongo,
    )


if __name__ == "__main__":
    main()
