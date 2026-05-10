"""
Visualization for training results.

Usage:
    python visualize.py                                  # uses artifacts/metrics.json
    python visualize.py --metrics artifacts/metrics.json --output plots/
"""

import argparse
import json
import os
import sys

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from sklearn.metrics import roc_curve, auc, precision_recall_curve

MODEL_COLORS = {"hmm": "#1f77b4", "rf": "#2ca02c", "lr": "#ff7f0e"}
MODEL_LABELS = {"hmm": "HMM", "rf": "Random Forest", "lr": "Logistic Regression"}
SPLIT_LABELS = {"val": "Validation", "test": "Test"}

THESIS_RC = {
    "figure.dpi": 150,
    "savefig.dpi": 300,
    "font.size": 11,
    "axes.titlesize": 12,
    "axes.labelsize": 11,
    "legend.fontsize": 10,
    "xtick.labelsize": 10,
    "ytick.labelsize": 10,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.grid": True,
    "grid.alpha": 0.3,
    "grid.linestyle": "--",
}


def _load(path: str) -> dict:
    with open(path) as f:
        return json.load(f)


def _save(fig, path: str) -> None:
    fig.savefig(path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"  saved: {path}")


# ─── ROC curves ────────────────────────────────────────────────────────────────

def plot_roc_curves(metrics: dict, split: str, output_dir: str) -> None:
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.plot([0, 1], [0, 1], "k--", lw=1, alpha=0.4, label="Random baseline")

    y_true = metrics["split"][split]["y_true"]
    for name, model_data in metrics["models"].items():
        y_prob = model_data[split].get("y_prob")
        if y_prob is None:
            continue
        fpr, tpr, _ = roc_curve(y_true, y_prob)
        roc_auc = auc(fpr, tpr)
        ax.plot(fpr, tpr, color=MODEL_COLORS[name], lw=2,
                label=f"{MODEL_LABELS[name]}  (AUC = {roc_auc:.4f})")

    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title(f"ROC Curves — {SPLIT_LABELS[split]} set")
    ax.legend(loc="lower right")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1.02)
    fig.tight_layout()
    _save(fig, os.path.join(output_dir, f"roc_{split}.png"))


# ─── Precision-Recall curves ───────────────────────────────────────────────────

def plot_pr_curves(metrics: dict, split: str, output_dir: str) -> None:
    y_true = metrics["split"][split]["y_true"]
    prevalence = sum(y_true) / len(y_true)

    fig, ax = plt.subplots(figsize=(6, 5))
    ax.axhline(prevalence, color="k", lw=1, linestyle="--", alpha=0.4,
               label=f"No-skill baseline (prevalence = {prevalence:.2f})")

    for name, model_data in metrics["models"].items():
        y_prob = model_data[split].get("y_prob")
        if y_prob is None:
            continue
        precision, recall, _ = precision_recall_curve(y_true, y_prob)
        pr_auc = auc(recall, precision)
        ax.plot(recall, precision, color=MODEL_COLORS[name], lw=2,
                label=f"{MODEL_LABELS[name]}  (AUC = {pr_auc:.4f})")

    ax.set_xlabel("Recall")
    ax.set_ylabel("Precision")
    ax.set_title(f"Precision-Recall Curves — {SPLIT_LABELS[split]} set")
    ax.legend(loc="upper right")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1.02)
    fig.tight_layout()
    _save(fig, os.path.join(output_dir, f"pr_{split}.png"))


# ─── Confusion matrices ────────────────────────────────────────────────────────

def plot_confusion_matrices(metrics: dict, split: str, output_dir: str) -> None:
    model_names = list(metrics["models"].keys())
    fig, axes = plt.subplots(1, len(model_names),
                             figsize=(4.5 * len(model_names), 4))
    if len(model_names) == 1:
        axes = [axes]

    class_labels = ["Negative (0)", "Positive (1)"]

    for ax, name in zip(axes, model_names):
        cm = np.array(metrics["models"][name][split]["confusion_matrix"])
        cm_pct = cm.astype(float) / cm.sum()

        im = ax.imshow(cm_pct, cmap="Blues", aspect="auto")

        ax.set_xticks([0, 1])
        ax.set_yticks([0, 1])
        ax.set_xticklabels(class_labels, rotation=15, ha="right")
        ax.set_yticklabels(class_labels)
        ax.set_xlabel("Predicted")
        ax.set_ylabel("True")
        ax.set_title(MODEL_LABELS[name])

        # Cell annotations: count + percentage
        thresh = cm_pct.max() / 2.0
        for i in range(2):
            for j in range(2):
                color = "white" if cm_pct[i, j] > thresh else "black"
                ax.text(j, i, f"{cm[i, j]:,}\n({cm_pct[i, j]:.1%})",
                        ha="center", va="center", color=color, fontsize=11)

    fig.suptitle(f"Confusion Matrices — {SPLIT_LABELS[split]} set", y=1.02)
    fig.tight_layout()
    _save(fig, os.path.join(output_dir, f"confusion_matrices_{split}.png"))


# ─── Metrics bar chart ─────────────────────────────────────────────────────────

def plot_metrics_comparison(metrics: dict, output_dir: str) -> None:
    metric_keys = ["accuracy", "precision", "recall", "f1", "roc_auc"]
    metric_labels = ["Accuracy", "Precision", "Recall", "F1", "ROC-AUC"]
    model_names = list(metrics["models"].keys())

    fig, axes = plt.subplots(1, 2, figsize=(13, 5), sharey=True)

    for ax, split in zip(axes, ["val", "test"]):
        x = np.arange(len(metric_keys))
        n = len(model_names)
        width = 0.65 / n

        for i, name in enumerate(model_names):
            vals = [
                metrics["models"][name][split].get(k) or 0.0
                for k in metric_keys
            ]
            offset = (i - (n - 1) / 2) * width
            bars = ax.bar(x + offset, vals, width,
                          label=MODEL_LABELS[name],
                          color=MODEL_COLORS[name], alpha=0.85)
            for bar, val in zip(bars, vals):
                ax.text(
                    bar.get_x() + bar.get_width() / 2,
                    bar.get_height() + 0.005,
                    f"{val:.3f}",
                    ha="center", va="bottom", fontsize=7, rotation=0,
                )

        ax.set_xticks(x)
        ax.set_xticklabels(metric_labels)
        ax.set_ylim(0, 1.12)
        ax.yaxis.set_major_formatter(mticker.FormatStrFormatter("%.2f"))
        ax.set_title(f"{SPLIT_LABELS[split]} set")
        ax.legend(loc="lower right")

    fig.suptitle("Model Performance Comparison", fontsize=13)
    fig.tight_layout()
    _save(fig, os.path.join(output_dir, "metrics_comparison.png"))


# ─── CV stability ──────────────────────────────────────────────────────────────

def plot_cv_stability(metrics: dict, output_dir: str) -> None:
    if "cv" not in metrics:
        return

    cv = metrics["cv"]
    model_names = list(cv.keys())
    plot_keys = [k for k in ["accuracy", "f1", "roc_auc"] if any(
        any(f.get(k) is not None for f in cv[n]["folds"]) for n in model_names
    )]
    plot_labels = {"accuracy": "Accuracy", "f1": "F1", "roc_auc": "ROC-AUC"}

    fig, axes = plt.subplots(1, len(plot_keys), figsize=(5 * len(plot_keys), 4))
    if len(plot_keys) == 1:
        axes = [axes]

    for ax, key in zip(axes, plot_keys):
        for name in model_names:
            folds = cv[name]["folds"]
            vals = [f[key] for f in folds if f.get(key) is not None]
            fold_nums = list(range(1, len(vals) + 1))
            summary = cv[name].get("summary", {})
            mean = summary.get(f"{key}_mean")
            std = summary.get(f"{key}_std")
            label = MODEL_LABELS[name]
            if mean is not None:
                label += f"\n{mean:.3f} ± {std:.3f}"
            ax.plot(fold_nums, vals, marker="o", lw=2,
                    color=MODEL_COLORS[name], label=label)
            if mean is not None:
                ax.axhline(mean, color=MODEL_COLORS[name],
                           lw=1, linestyle=":", alpha=0.6)

        ax.set_xlabel("Fold")
        ax.set_ylabel(plot_labels[key])
        ax.set_title(f"CV {plot_labels[key]} per Fold")
        ax.set_xticks(fold_nums)
        ax.legend(fontsize=9)

    fig.suptitle("5-Fold Patient-Level Cross-Validation Stability", fontsize=13)
    fig.tight_layout()
    _save(fig, os.path.join(output_dir, "cv_stability.png"))


# ─── Summary table ─────────────────────────────────────────────────────────────

def _print_summary(metrics: dict) -> None:
    src = metrics.get("data_source", "?")
    ts = metrics.get("timestamp", "?")
    sp = metrics["split"]
    print(f"\nMetrics file: {src}  [{ts}]")
    print(f"  Train: {sp['train']['n_patients']} patients, "
          f"{sp['train']['n_sequences']} sequences  "
          f"(class-1: {sp['train']['n_class_1']}, "
          f"class-0: {sp['train']['n_class_0']})")
    print(f"  Val:   {sp['val']['n_patients']} patients, "
          f"{sp['val']['n_sequences']} sequences")
    print(f"  Test:  {sp['test']['n_patients']} patients, "
          f"{sp['test']['n_sequences']} sequences")
    if "cv" in metrics:
        print("  CV:    present")


# ─── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Visualize training metrics for thesis")
    parser.add_argument(
        "--metrics", default="artifacts/metrics.json",
        help="Path to metrics.json (default: artifacts/metrics.json)",
    )
    parser.add_argument(
        "--output", default=None,
        help="Output directory for plots (default: <metrics_dir>/plots/)",
    )
    args = parser.parse_args()

    if not os.path.exists(args.metrics):
        print(f"Error: metrics file not found: {args.metrics}")
        print("Run train.py first to generate metrics.json.")
        sys.exit(1)

    metrics = _load(args.metrics)
    _print_summary(metrics)

    output_dir = args.output or os.path.join(
        os.path.dirname(os.path.abspath(args.metrics)), "plots"
    )
    os.makedirs(output_dir, exist_ok=True)
    print(f"\nSaving plots to: {output_dir}")

    plt.rcParams.update(THESIS_RC)

    for split in ["val", "test"]:
        print(f"\n[{split}]")
        plot_roc_curves(metrics, split, output_dir)
        plot_pr_curves(metrics, split, output_dir)
        plot_confusion_matrices(metrics, split, output_dir)

    print("\n[comparison]")
    plot_metrics_comparison(metrics, output_dir)

    print("\n[cv]")
    plot_cv_stability(metrics, output_dir)

    print(f"\nDone. {len(os.listdir(output_dir))} files in {output_dir}")


if __name__ == "__main__":
    main()
