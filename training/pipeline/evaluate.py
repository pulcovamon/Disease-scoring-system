import logging
import time
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import GroupKFold

from pipeline.data import flatten_sequences

logger = logging.getLogger(__name__)


def evaluate(y_true, y_pred, y_prob=None) -> dict:
    metrics = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
    }
    if y_prob is not None:
        try:
            metrics["roc_auc"] = roc_auc_score(y_true, y_prob)
        except ValueError:
            metrics["roc_auc"] = None
    return metrics


def cross_validate_patients(
    model_cls, patients: list, n_splits: int = 5, verbose: bool = False, name: str = ""
) -> list:
    """Patient-level k-fold: no patient appears in both train and validation fold."""
    sequences, labels, patient_ids = flatten_sequences(patients)
    gkf = GroupKFold(n_splits=n_splits)

    fold_results = []
    for fold, (train_idx, val_idx) in enumerate(
        gkf.split(sequences, labels, groups=patient_ids)
    ):
        train_seqs = [sequences[i] for i in train_idx]
        train_labels = [labels[i] for i in train_idx]
        val_seqs = [sequences[i] for i in val_idx]
        val_labels = [labels[i] for i in val_idx]

        t0 = time.time()
        model = model_cls(verbose=False)  # suppress per-iteration output inside CV
        model.fit(train_seqs, train_labels)
        y_pred = model.predict(val_seqs)

        y_prob = None
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(val_seqs)
            if proba is not None and hasattr(proba, "ndim") and proba.ndim == 2:
                y_prob = proba[:, 1]

        result = evaluate(val_labels, y_pred, y_prob)
        result["fold"] = fold
        fold_results.append(result)

        if verbose:
            s = int(time.time() - t0)
            elapsed = f"{s // 60}m {s % 60}s" if s >= 60 else f"{s}s"
            auc = result.get("roc_auc")
            auc_str = f"  auc={auc:.4f}" if auc is not None else ""
            logger.info(
                f"    Fold {fold + 1}/{n_splits}"
                f"  acc={result['accuracy']:.4f}"
                f"  prec={result['precision']:.4f}"
                f"  rec={result['recall']:.4f}"
                f"  f1={result['f1']:.4f}"
                f"{auc_str}"
                f"  ({elapsed})"
            )

    return fold_results


def summarize_cv(fold_results: list) -> dict:
    keys = ["accuracy", "precision", "recall", "f1", "roc_auc"]
    summary = {}
    for key in keys:
        values = [r[key] for r in fold_results if r.get(key) is not None]
        if values:
            summary[f"{key}_mean"] = float(np.mean(values))
            summary[f"{key}_std"] = float(np.std(values))
    return summary


def print_comparison(results: dict) -> None:
    header = (
        f"{'Model':<20} {'Accuracy':>10} {'Precision':>10}"
        f" {'Recall':>10} {'F1':>10} {'AUC':>10}"
    )
    logger.info(header)
    logger.info("-" * len(header))
    for name, m in results.items():
        auc = m.get("roc_auc")
        auc_str = f"{auc:>10.4f}" if auc is not None else f"{'N/A':>10}"
        logger.info(
            f"{name:<20}"
            f" {m['accuracy']:>10.4f}"
            f" {m['precision']:>10.4f}"
            f" {m['recall']:>10.4f}"
            f" {m['f1']:>10.4f}"
            f" {auc_str}"
        )
