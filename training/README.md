# Disease Scoring — Training Pipeline

Trains three classifiers (HMM, Random Forest, Logistic Regression) on sequences of
medical codes to predict disease presence. Each model is saved as a self-contained
artifact that can be loaded for inference without access to the original data.

---

## Quick Start

```bash
# From the training/ directory

# Pull data from MongoDB and train (recommended)
uv run train.py --from-mongo

# With 5-fold cross-validation
uv run train.py --from-mongo --cv

# From a pre-exported JSON file
uv run train.py --data path/to/patients.json

# Smoke test with synthetic data (no database needed)
uv run train.py --synthetic

# Custom output directory
uv run train.py --from-mongo --output my_artifacts/
```

Artifacts are saved to `artifacts/` by default:

```text
artifacts/
├── hmm_model.pkl
├── rf_model.pkl
└── lr_model.pkl
```

---

## Directory Layout

```text
training/
├── pipeline/
│   ├── data.py          # data loading and patient-level splitting
│   ├── preprocessor.py  # CodeVocabulary (HMM integer encoding)
│   └── evaluate.py      # metrics, GroupKFold cross-validation
├── models/
│   ├── hmm.py           # TwoClassHMM
│   ├── random_forest.py # RFClassifier
│   └── logistic.py      # LRClassifier
├── train.py             # CLI entry point
└── artifacts/           # saved model files (created on first run)
```

---

## Input Data Format

### MongoDB (recommended)

`load_from_mongo()` connects to the `catalog_db.lung_cancer` collection. Each document
must have this structure:

```json
{
  "_id": "<patient_id>",
  "codes": ["A01", "'B02", "C03", "'D04", "E05"],
  "active_phase": {
    "ground_truth": [0, 1]
  }
}
```

A code prefixed with `'` marks the start of a new visit sequence. The example above
produces two sequences: `["A01"]` labeled `0` and `["B02", "C03"]` labeled `1`, etc.

The number of sequences in a document equals the number of `'`-prefixed codes plus one
(the first sequence has no leading boundary marker). `ground_truth` must have one label
per sequence.

Connection is configured via the `MONGO_URL` environment variable:

```bash
export MONGO_URL="mongodb://user:pass@host:27017"
uv run train.py --from-mongo
```

Default: `mongodb://root:pass@localhost:27017`

### JSON file

```json
{
  "patients": [
    {
      "id": "patient_001",
      "sequences": [
        {"codes": ["A01", "B02"], "label": 0},
        {"codes": ["C03", "D04", "E05"], "label": 1}
      ]
    }
  ]
}
```

---

## Pipeline Steps

### 1. Patient-level train / val / test split

```text
all patients  →  shuffle (seed=42)  →  70% train | 15% val | 15% test
```

The split operates on the **patient list**, not on individual sequences. A patient's
sequences all land in the same partition. This prevents the model from seeing
sequences from the same patient in both training and evaluation, which would inflate
metrics because the model could learn patient-specific code patterns instead of
generalizing across patients.

### 2. Feature representation

Each model converts sequences to its own internal representation after the split:

| Model | Representation | Fit on |
| --- | --- | --- |
| HMM | Integer-encoded via `CodeVocabulary` | Train sequences only |
| RF | TF-IDF sparse matrix, top-30 chi2 features | Train sequences only |
| LR | TF-IDF sparse matrix (full) | Train sequences only |

All representations are learned from training data exclusively and saved alongside
the model weights. At inference time, the saved representation is loaded — the
original data is not needed.

### 3. HMM training

`TwoClassHMM` trains two `CategoricalHMM` models independently:

- `hmm_pos` — fitted on class-1 sequences only
- `hmm_neg` — fitted on class-0 sequences only

Classification uses the log-likelihood ratio: a sequence is assigned to whichever
class model assigns it higher log-probability. This is a generatively correct
decision rule — it compares `P(seq | disease)` against `P(seq | no disease)`.

Each HMM runs 100 EM iterations (`n_iter=100`). Initial parameters are set
explicitly before training:

| Parameter | Value | Rationale |
| --- | --- | --- |
| `startprob` | `[0.9, 0.1]` | Most sequences start in background state |
| `transmat` | `[[0.9, 0.1], [0.2, 0.8]]` | Disease-motif state is sticky once entered |
| `emissionprob` | uniform | No prior on which codes are informative |

`init_params=""` prevents hmmlearn from reinitializing parameters at the start of
each `fit()` call, which would destroy the work done in previous iterations.

### 4. RF training

A single sklearn `Pipeline` object:

```text
TfidfVectorizer  →  SelectKBest(chi2, k=30)  →  RandomForestClassifier(n_estimators=100)
```

TF-IDF downweights codes that appear in almost every patient and upweights codes
distinctive to specific patients. Chi2 feature selection then keeps the 30 features
most statistically associated with the class label. The Pipeline API enforces that
the vectorizer and selector are fitted on training data only — calling `.predict()`
never re-fits any step.

### 5. LR training

A single sklearn `Pipeline` object:

```text
TfidfVectorizer  →  LogisticRegression(max_iter=1000, L2 regularization)
```

No explicit feature selection is needed: L2 regularization shrinks irrelevant feature
weights toward zero automatically. `max_iter=1000` is set because the default 100
iterations often does not converge on large sparse feature spaces.

### 6. Evaluation

Each model is evaluated on the val split (for development feedback) and the test
split (final numbers). Reported metrics:

| Metric | What it measures |
| --- | --- |
| Accuracy | Overall correct predictions |
| Precision | Of predicted positives, how many are truly positive |
| Recall | Of true positives, how many were found |
| F1 | Harmonic mean of precision and recall |
| ROC-AUC | Ranking quality, threshold-independent |

Accuracy alone is not a reliable metric for medical data, which is typically
class-imbalanced. F1 and AUC give a more honest picture.

### 7. Cross-validation (optional, `--cv`)

Runs 5-fold **patient-level** cross-validation using `GroupKFold`. The group key is
the patient ID, so no patient's sequences appear in both the training and validation
fold within any split. Results are reported as `mean ± std` across folds.

---

## Model Artifacts

Each artifact is a self-contained `joblib` pickle:

| File | Contents |
| --- | --- |
| `hmm_model.pkl` | `{"model": TwoClassHMM, "vocab": CodeVocabulary}` |
| `rf_model.pkl` | sklearn `Pipeline` (TfidfVectorizer + SelectKBest + RF) |
| `lr_model.pkl` | sklearn `Pipeline` (TfidfVectorizer + LR) |

The vocabulary and vectorizer are bundled with the model so inference is
self-contained. Loading a model and running prediction:

```python
import joblib

# HMM
data = joblib.load("artifacts/hmm_model.pkl")
model = data["model"]
preds = model.predict([["A01", "B02", "C03"]])

# RF or LR
pipeline = joblib.load("artifacts/rf_model.pkl")
preds = pipeline.predict(["A01 B02 C03"])   # space-joined string
```

---

## Dependencies

Managed with `uv`. Install from `requirements.txt`:

```bash
uv sync
# or
uv add -r requirements.txt
```

Key packages: `hmmlearn`, `scikit-learn`, `numpy`, `joblib`, `pymongo` (only needed
for `--from-mongo`).
