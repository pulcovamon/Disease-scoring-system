# Disease Prediction — Data Flow

## Overview

```
Browser (Scoring Wizard)
  │
  │  POST /api/v1/prediction/patient   (or /dataset)
  ▼
FastAPI (API)
  │  validates auth + permissions
  │  resolves model file path (absolute)
  │  send_task("run_model_prediction", ...)
  ▼
Redis (broker)
  │  task queued
  ▼
Celery Worker
  │  onnxruntime.InferenceSession(model.onnx)
  │  build input array from ICD-10 codes
  │  session.run() → P(class=1)
  │  stores result
  ▼
Redis (result backend)
  │
  │  GET /api/v1/prediction/result/{task_id}
  ▼
Browser (Result Page)
```

---

## 1. Wizard Initialisation

When the user opens `/score`, `ScoringWizardProvider` mounts and immediately fetches all available models:

```
GET /api/v1/model?include_default=true&include_user=true&include_public=true
```

The API returns model documents from MongoDB (`scoring_system.models`). The wizard state (selected model ID, codes, patient, current step) is persisted in `sessionStorage` so it survives a page refresh.

---

## 2. Step 1 — Select Model

The user picks a model from the list. The selected model's `_id` is stored in wizard state. Switching model clears the code list.

---

## 3. Step 2 — Enter Data

**Manual input:**
- User types patient name + surname.
- User adds ICD-10 codes one by one via the code search field (backed by Elasticsearch autocomplete at `GET /api/v1/code/search`).

**CSV / JSON upload:**
- User uploads a file. Required columns: `id` and `codes` (comma-separated code list per row for CSV).

Validation: the Next button is disabled until `patient.name` is non-empty and at least one code is present (manual), or a file is selected (CSV).

---

## 4. Step 3 — Check & Send

The user reviews:
- **Selected model card** — model name, algorithm, disease, description.
- **Data preview** — patient full name and each ICD-10 code with its resolved name and specialty (fetched from Elasticsearch).

Clicking **Send** triggers `submitPrediction()` in `scoringWizard.tsx`.

---

## 5. Frontend → API Request

`DataSender.postData()` sends one of:

```
POST /api/v1/prediction/patient?model_id={id}     ← manual entry
POST /api/v1/prediction/dataset?model_id={id}     ← file upload
```

**Manual request body:**
```json
{
  "codes": ["96900", "35532", "4560"],
  "patient": { "name": "Jan", "surname": "Novak", "id": null }
}
```

**Dataset:** multipart file upload (CSV or JSON).

---

## 6. API — Authorisation & Path Resolution

The `ensure_can_run_prediction` FastAPI dependency runs before the handler:

1. Loads the model document from MongoDB by `model_id`.
2. Evaluates `can_run_prediction(user, model)` — see permission table below.
3. Returns **403** if the check fails.

`resolve_model_path()` then resolves the stored path to an absolute path:

- Tries the raw stored path first (will succeed for all models registered with absolute paths).
- Falls back to `REPO_ROOT / raw_path` for any legacy relative paths.
- Returns **404** if the file is missing on disk.

---

## 7. Celery Task Dispatch

```python
celery_app.send_task(
    "run_model_prediction",
    args=[model_id, "/absolute/path/to/model.onnx", codes]
)
```

The task is serialised and enqueued in **Redis**. The API immediately returns:

```
HTTP 202 Accepted
{ "task_id": "c9de70ce-9f63-4ef5-bc2d-b9f4b7315f75" }
```

The frontend navigates to `/result?id={task_id}`.

---

## 8. Worker — Task Execution

The Celery worker picks up the task from the Redis queue (`worker/tasks.py`):

1. **Load model** — `onnxruntime.InferenceSession(model_path)` loads the `.onnx` file from the shared `model_storage` volume. Sessions are LRU-cached in memory (up to 32 models) so repeated predictions on the same model skip the disk read.
2. **Detect model type** — `inference.py` inspects the ONNX input shape:
   - **1-D input** (`[seq_len]`) → HMM model; codes are passed as a raw string array.
   - **2-D input** (`[N, 1]`) → RF or LR model; codes are joined into a single space-separated string and passed as `[["J44 C34 J44"]]`.
3. **Find probability output** — iterates `session.get_outputs()` and selects the first `float32` output, skipping the `output_label` (int64 predicted class) that sklearn-converted models emit as their first output.
4. **Run inference** — `session.run([output_name], {input_name: data})` returns a probability array. `P(class=1)` is extracted from the result (`probas[1]` for 1-D output, `probas[0,1]` for 2-D).
5. **Return value:**
   - Single patient: `{ "prediction": 0.78, "model_id": "..." }`
   - Batch dataset: `{ "predictions": [{"id": ..., "prediction": ...}, ...], "model_id": "..." }`
6. Result is stored in the **Redis result backend** keyed by `task_id`.

---

## 9. Frontend — Result Page

The result page (`/result?id={task_id}`) calls on load:

```http
GET /api/v1/prediction/result/{task_id}
```

The API reads `AsyncResult(task_id, app=celery_app)` from Redis. `format_task_result()` also looks up the model document in MongoDB to attach the disease name to the response.

| `status` | Meaning |
| --- | --- |
| `PENDING` | Task is queued or not yet started |
| `SUCCESS` | Prediction complete — `result` holds `P(class=1)` as a float 0–1 |
| `FAILURE` | Worker raised an exception — `result` holds the error detail |

The result page displays the probability as a percentage for `SUCCESS`, or the error message for `FAILURE`. There is no automatic polling — the user can manually refresh via the **Refresh** button.

---

## Permission Matrix

`can_run_prediction(user, model)` in `api/auth/permissions.py`:

| Model type | Unauthenticated | Any authenticated user | Owner | Admin |
| --- | --- | --- | --- | --- |
| Default (`user = "default"`) | ✅ | ✅ | ✅ | ✅ |
| Public (`is_public = true`) | ❌ | ✅ | ✅ | ✅ |
| Private | ❌ | ❌ | ✅ | ✅ |
| Shared (`shared_with` list) | ❌ | ✅ (if listed) | ✅ | ✅ |

---

## Key Files

| Layer | File |
|---|---|
| Frontend wizard state | `frontend/src/lib/store/scoringWizard.tsx` |
| Frontend API call | `frontend/src/lib/classes/data.ts` — `DataSender` |
| Frontend result page | `frontend/src/lib/pages/ResultPage.tsx` |
| API prediction endpoints | `api/prediction/endpoints.py` |
| API task result formatting | `api/prediction/utils.py` |
| API permissions | `api/auth/permissions.py` |
| Celery task | `worker/tasks.py` |
| Worker inference engine | `worker/inference.py` |
