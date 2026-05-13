# Training Workflow

## Task

Binary classification of patient visit sequences: predict whether a sequence contains
a disease indicator (class 1) or not (class 0). Labels come from
`active_phase.ground_truth` in the MongoDB collection, assigned per visit sequence.

---

## Data Format

### MongoDB source (`catalog_db.lung_cancer`)

Each document represents one patient:

```json
{
  "_id": "<patient_id>",
  "codes": ["A01", "'B02", "C03", "'D04", "E05"],
  "active_phase": {
    "ground_truth": [0, 1]
  }
}
```

The `codes` array is a flat list. A code prefixed with `'` marks the start of a new
visit sequence — the boundary convention. The pipeline splits on these boundaries:

```text
codes:        ["A01", "'B02", "C03", "'D04", "E05"]
ground_truth: [0, 1]
                  ↓ parse
sequences: [["A01"], ["B02", "C03"]]   ← ["D04", "E05"] discarded: no label
labels:    [   0,         1        ]
```

The first sequence has no leading boundary marker. `ground_truth` must contain exactly
one label per sequence. Any trailing sequence that exceeds the length of `ground_truth`
is silently discarded.

All codes are kept as-is — no vocabulary filtering at load time. Each model handles
its own feature selection internally.

### Internal patient format

After loading, each patient is a dict:

```python
{
    "id": "patient_001",
    "sequences": [
        {"codes": ["A01", "B02"], "label": 0},
        {"codes": ["C03", "D04", "E05"], "label": 1},
    ]
}
```

This is also the format of the JSON file input (`--data` flag).

---

## Pipeline

### Step 1 — Patient-level split

```text
all patients  →  shuffle (seed=42)  →  70% train | 15% val | 15% test
```

The split operates on the **patient list** before sequences are flattened. All
sequences from a patient land in the same partition. This is critical: splitting
sequences directly would allow the model to see different sequences from the same
patient in both train and test, inflating metrics because patient-specific code
patterns would leak across splits.

After splitting, `flatten_sequences()` converts each partition to three parallel
lists: `(sequences, labels, patient_ids)`. `patient_ids` is used as the group key
for cross-validation.

### Step 2 — Model training

Three models are trained independently on the same train split. Each builds its
own internal representation from training data only.

#### HMM — `TwoClassHMM`

Trains two separate `CategoricalHMM` models (hmmlearn):

- `hmm_pos` on class-1 sequences only
- `hmm_neg` on class-0 sequences only

Classification: `argmax(log P(seq | HMM_pos), log P(seq | HMM_neg))`.
This is a log-likelihood ratio — comparing "how well does the disease model explain
this sequence" against "how well does the background model explain it". The
single-class approach used in the legacy scripts (train only on positives, predict
by whether state 1 activates) has no principled decision boundary.

**Vocabulary**: `CodeVocabulary` is built from all training sequences (both classes).
It maps each string code to a unique integer. Codes not seen during training are
mapped to `UNK_ID=0` at inference. Vocabulary is saved with the model artifact.

**OOV handling**: After EM training, `emissionprob_[:, 0]` (the UNK slot) converges
to 0 because UNK never appears in training sequences. A floor of `1e-10` is applied
to all emission probabilities and the rows are renormalised after training. Without
this, test sequences containing novel codes would yield `-inf` log-likelihood from
both models, causing `-inf - (-inf) = nan` during the likelihood ratio computation.

**EM training details**:

- 100 iterations, `tol=0` (no early stopping), `init_params=""` (no re-init between steps)
- Initial `startprob=[0.9, 0.1]`: most sequences start in the background state
- Initial `transmat=[[0.9, 0.1], [0.2, 0.8]]`: disease-motif state is sticky once entered
- Initial `emissionprob=uniform`: no prior on which codes are informative

The `n_iter=1` loop pattern with `tol=0` is used to enable per-10th-iteration
logging. Setting `init_params=""` is essential — without it hmmlearn reinitialises
all parameters at the start of each `fit()` call, destroying the previous iteration.

#### RF — `RFClassifier`

sklearn `Pipeline`:

```text
TfidfVectorizer  →  SelectKBest(chi2, k=30)  →  RandomForestClassifier(n_estimators=100)
```

Sequences are joined to space-separated strings before TF-IDF. The pipeline is fitted
on training data only. Calling `.predict()` never re-fits any step.

Feature selection uses chi2 (statistically associated with class label) rather than
total TF-IDF mass (which selects frequent but not necessarily discriminative codes).
`mutual_info_classif` is not used because it fails with sparse TF-IDF matrices
(`ValueError: Sparse matrix can't have continuous features`).

#### LR — `LRClassifier`

sklearn `Pipeline`:

```text
TfidfVectorizer  →  LogisticRegression(max_iter=1000, L2 regularisation)
```

No explicit feature selection: L2 regularisation shrinks irrelevant feature weights
toward zero. `max_iter=1000` is needed because the default 100 often does not converge
on large sparse vocabularies.

### Step 3 — Evaluation

Each model is evaluated on the val split (development feedback) and test split (final
numbers). Metrics: accuracy, precision, recall, F1, ROC-AUC.

AUC and F1 are the primary signals. Accuracy is unreliable for imbalanced medical
data. Precision/recall decompose F1 to show whether a model is missing positives
(low recall) or generating false alarms (low precision).

### Step 4 — Cross-validation (optional, `--cv`)

5-fold `GroupKFold` on the full patient list. The group key is `patient_id`, so no
patient appears in both the training and validation fold within any split. Each fold
instantiates a fresh model. Results are reported as `mean ± std` across folds.

### Step 5 — Artifact saving

| File | Contents |
| --- | --- |
| `hmm_model.pkl` | `{"model": TwoClassHMM, "vocab": CodeVocabulary}` |
| `rf_model.pkl` | sklearn `Pipeline` (TfidfVectorizer + SelectKBest + RF) |
| `lr_model.pkl` | sklearn `Pipeline` (TfidfVectorizer + LR) |

Every artifact is self-contained — the vocabulary and vectorizer travel with the
model so inference does not require access to the original data.

---

## Directory Structure

```text
training/
├── pipeline/
│   ├── data.py          # load_patients, load_from_mongo, patient_split, flatten_sequences
│   ├── preprocessor.py  # CodeVocabulary: fit on train only, OOV→UNK_ID, save/load
│   └── evaluate.py      # evaluate(), cross_validate_patients(), print_comparison()
├── models/
│   ├── hmm.py           # TwoClassHMM
│   ├── random_forest.py # RFClassifier
│   └── logistic.py      # LRClassifier
├── train.py             # CLI entry point
├── artifacts/           # saved model files
└── utils/               # legacy preprocessing utilities (see Legacy Scripts below)
```

---

## Running

```bash
# From training/
uv run train.py --from-mongo          # recommended
uv run train.py --from-mongo --cv     # with cross-validation
uv run train.py --data patients.json  # from JSON file
uv run train.py --synthetic           # synthetic data, no database needed
```

MongoDB connection via `MONGO_URL` env var (default: `mongodb://root:pass@localhost:27017`).
Output artifacts go to `artifacts/` by default, override with `--output <dir>`.

---

## Legacy Scripts

The `utils/`, `hmm/`, `logistic_regression/`, `random_forest/`, `tf-idf/`, and
`frequencies/` directories contain earlier prototype scripts. They are kept as
experiment references and are **not** part of the current pipeline.

### Known problems in legacy scripts

| Problem | Location | Effect |
| --- | --- | --- |
| TF-IDF fitted on full corpus before split | all discriminative scripts | IDF values leak test document frequencies |
| Sequence-level train/test split | all scripts | same patient can appear in both train and test |
| HMM trained on class-1 only, classified by state-1 presence | `hmm_traintest*.py` | no principled decision boundary; threshold is arbitrary |
| Vocabulary built from all data before split | `hmm_traintest.py`, `hmm_traintest_label.py` | OOV handling incorrect at inference |
| Label mismatch in test loop | `hmm_traintest_label.py` | `y_labels[i]` is the label of the i-th code, not the i-th sequence |
| NameError `specific_codes` | `hmm_traintest_generated.py` | crashes at runtime; should be `class_1_codes` |
| NameError bare `sequencies` | `hmm_traintest.py` line 11 | crashes at runtime; delete the line |
| Feature selection by total TF-IDF mass | `random-forest.py` | selects frequent but not discriminative codes |
| Binary encoding after feature selection | `random-forest.py` | discards frequency information before RF |
