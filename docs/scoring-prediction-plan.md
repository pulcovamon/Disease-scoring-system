# Scoring Form & Prediction Workflow — Analysis & Implementation Plan

## 1. Architecture & Implementation Overview

### System Components

```
Browser
  └── ScoringSystem.tsx (3-step wizard)
        ├── Step 0: Model selection  (GET /api/v1/model)
        ├── Step 1: Data input       (Manual codes | CSV upload)
        └── Step 2: Preview & send   (POST /api/v1/prediction/patient
                                      POST /api/v1/prediction/dataset)
                                              │
                                        FastAPI (api/)
                                              │
                                        Celery task → Redis broker
                                              │
                                        Worker (worker/)
                                              │
                                        joblib model.pkl → prediction
                                              │
                                        Redis result backend
                                              │
                                  GET /api/v1/prediction/result/{id}
                                              │
                                  ResultPage.tsx / History.tsx
```

### Frontend State (ScoringWizardProvider)

Persisted to `sessionStorage` across refreshes:
| Field | Type | Purpose |
|---|---|---|
| `step` | 0 \| 1 \| 2 | Current wizard step |
| `currentModelId` | string \| null | Selected model |
| `inputMethod` | Manual \| CSV | Input path chosen |
| `codes` | string[] | Medical codes (manual path) |
| `patient` | `{id, name, surname}` | Patient info |
| `unallowed` | boolean | Validation error flag |

Transient (memory only): `models`, `loadingModels`, `uploadedFile`, `sending`, `submissionError`

### Backend Request Lifecycle

```
POST /prediction/patient
  → ensure_can_run_prediction dependency
      → get_model_for_read (MongoDB lookup)
      → can_run_prediction() permission check
  → resolve_model_path() (filesystem lookup with fallback)
  → celery_app.send_task("run_model_prediction",
      args=[model_id, model_path, codes, encoder_path])
  ← 202 { task_id }

Worker (separate Docker container):
  run_model_prediction(model_id, model_path, codes, encoder_path)
  → joblib.load(model_path)
  → encode_input(codes)        # encoder > feature_names_in_ > features
  → model.predict_proba()      # or predict()
  ← { prediction: float, model_id: str }  stored in Redis

GET /prediction/result/{id}
  → AsyncResult(task_id)       # queries Redis
  → MongoDB lookup for disease name
  ← { status, result, task_id, model_id, disease }
```

### Two Separate Dataset Submission Paths (Important)

There are **two different flows** for CSV/dataset submission that currently conflict:

- **DatasetsPage** (`/datasets` route): Uses `postFormMethod`, sends actual file as multipart to `POST /prediction/dataset` — **works correctly**
- **ScoringSystem wizard CSV path**: Uses `DataSender` class which sends JSON body to `POST /prediction/dataset` — **broken**, endpoint expects `UploadFile`

---

## 2. Desired Behavior & Requirements

### Manual Prediction (single patient)
- User selects a model
- User enters a patient name and a sequence of medical codes
- System sends `POST /prediction/patient` with codes list and model ID
- System returns task ID immediately (202), user is redirected to result page
- Result page polls until prediction is complete and displays probability

### CSV/Batch Prediction (from wizard)
- User selects a model
- User uploads a CSV file with `id` and `codes` columns
- System previews the CSV before sending
- System sends `POST /prediction/dataset` with the actual **file** (multipart)
- System returns task ID, user is redirected to result page
- Result page displays batch results (multiple predictions)

### History
- **Any authenticated user** can view their own past prediction results
- Results are identified by task ID stored locally after submission
- Admin can see all results

### Result Page
- Shows: status, probability, disease name, created timestamp
- Can refresh if still processing
- Can start a new prediction

### Acceptance Criteria
- AC-1: Manual path submits codes with correct model ID and the disease is derived from the selected model
- AC-2: CSV path sends the actual uploaded file to the backend
- AC-3: Authenticated non-admin users can view their own predictions in History
- AC-4: Result page shows `created_at` timestamp
- AC-5: Celery tasks publish correctly (no crash on task publish)
- AC-6: Prediction result endpoints return consistent shape regardless of task state

---

## 3. Problems in Current Code

### Critical — Broken Functionality

#### P-1: CSV path in wizard sends wrong request type
**File:** `frontend/src/lib/classes/data.ts`

`DataSender.postData()` uses `postMethod` (JSON body) for both `"patient"` and `"dataset"` prediction types. The backend `POST /prediction/dataset` endpoint expects `UploadFile` (multipart form). The CSV file is never sent — only an empty codes array reaches the backend, which causes a 400/422 error.

```typescript
// current — sends JSON body, no file
await postMethod(`/prediction/${this.predictionType}?model_id=${this.modelID}`, this.data)

// dataset endpoint expects:
// POST /prediction/dataset?model_id=... with multipart form field "dataset"
```

#### P-2: Disease hardcoded in DataSender
**File:** `frontend/src/lib/classes/data.ts:39`

```typescript
this.disease = "lung-cancer"; // hardcoded — never used by backend but wrong regardless
```

Disease should derive from the selected model object, not be hardcoded.

#### P-3: Celery signal handler crashes on every task publish
**Files:** `api/worker.py:24`, `worker/worker.py:24`

```python
@after_task_publish.connect
def update_sent_state(sender=None, headers=None, **kwargs):
    backend = (
        task.backend if celery_app.tasks.get(sender) else celery_app.backend  # `task` is undefined
    )
    backend.store_result(headers["id"], None, "SENT")
```

`task` is not defined in this scope. This raises a `NameError` every time a task is published, meaning no tasks are processed. The intent is to pre-set the task state to `"SENT"` so clients don't see `PENDING` before the worker picks it up.

#### P-4: History page returns 403 for non-admin users
**File:** `api/prediction/endpoints.py:52`

```python
@router.get("/result")
async def get_all_results(_: None = Depends(require_admin)):  # admin only
```

`History.tsx` calls `Results.getAllResults()` which hits this endpoint. Any non-admin user gets a 403 when visiting their history — they see an error page instead of results.

#### P-5: `created_at` not included in result response
**File:** `api/prediction/utils.py` — `format_task_result()` never adds `created_at`

`ResultPage.tsx` tries to display `task.created_at` but the field is never returned by the API. It always renders as `undefined`.

### Medium — Incorrect Behaviour

#### P-6: `GET /prediction/result/{id}` requires no authentication
**File:** `api/prediction/endpoints.py:47`

Anyone who knows (or guesses) a task ID can retrieve the prediction result, including the disease diagnosis probability. No auth token required. For a medical application this is a data exposure risk.

#### P-7: No Redis TTL on task results
**Files:** `api/worker.py`, `worker/worker.py`

Results accumulate in Redis indefinitely. `get_all_task_ids()` will degrade as Redis fills. Medical data persists with no expiration.

#### P-8: `model_type` field sent but not used
**File:** `frontend/src/lib/classes/data.ts:35`

```typescript
this.data = { codes, model_type: "unordered" }  // backend ignores this field
```

The backend `PredictionRequest` has no `model_type` field. The value is silently ignored.

#### P-9: Duplicate Celery configuration
**Files:** `api/worker.py`, `worker/worker.py`

Two files with identical Celery setup. They must stay in sync manually or configurations drift.

#### P-10: `get_all_task_ids()` loads all results into memory without pagination
**File:** `api/prediction/utils.py:48`

`GET /prediction/result` iterates all Redis keys, fetches every result, and returns everything in one response. No pagination, no filtering. Will become unusable at scale.

### Minor

#### P-11: Typo in DataSender error message
`"An error occured."` → `"An error occurred."`

#### P-12: Hardcoded patients in NewPatient component
`NewPatient.tsx` has `"Jan Novak"` and `"Jana Novotna"` hardcoded as selectable patients — never loaded from the database.

#### P-13: Encoder loaded silently if path doesn't exist
**File:** `worker/tasks.py:16`
```python
if encoder_path and os.path.exists(encoder_path):
    encoder = joblib.load(encoder_path)
```
If file doesn't exist, `encoder` variable is never assigned but still referenced below — results in `NameError`. Should initialize to `None` before the conditional.

---

## 4. Technical Solutions

### S-1: Fix CSV path in wizard (P-1)

**Approach:** Split `DataSender.postData()` into two code paths. For `"dataset"`, use `postFormMethod` with `FormData` containing the file. The wizard must pass the `uploadedFile` down to `DataSender`.

**Frontend changes:**
- `DataSender` constructor accepts optional `file: File | null`
- In `postData()`, if `predictionType === "dataset"`, build `FormData` and call `postFormMethod`
- `ScoringWizardProvider.submitPrediction()` passes `state.uploadedFile` to `DataSender`

```typescript
// DataSender with file support
if (this.predictionType === "dataset" && this.file) {
  const fd = new FormData()
  fd.append("dataset", this.file)
  return postFormMethod<Identificator>(
    `/prediction/dataset?model_id=${this.modelID}`,
    fd,
    { includeAuth: true }
  ).then(...)
} else {
  return postMethod<Identificator>(
    `/prediction/patient?model_id=${this.modelID}`,
    { codes: this.data.codes },
    { includeAuth: true }
  ).then(...)
}
```

**Note:** Auth token should be sent with both requests — currently neither call includes `{ includeAuth: true }`.

### S-2: Derive disease from model (P-2)

Remove `this.disease` from `DataSender` entirely — it's not sent to or used by the backend. The backend derives disease from the model document in MongoDB.

```typescript
// Remove these lines from DataSender:
this.disease = "lung-cancer"  // delete
```

### S-3: Fix Celery signal handler (P-3)

The intent of the handler is to store `"SENT"` state before the worker picks up the task, so clients polling immediately after submission see `SENT` rather than `PENDING`.

**Fix in both `api/worker.py` and `worker/worker.py`:**

```python
@after_task_publish.connect
def update_sent_state(sender=None, headers=None, **kwargs):
    celery_app.backend.store_result(headers["id"], None, "SENT")
```

Remove the conditional — always use `celery_app.backend` directly.

### S-4: Add per-user history endpoint (P-4)

Add a new endpoint that returns only the authenticated user's own task IDs. Task IDs must be associated with users at submission time — stored in a new MongoDB collection `prediction_tasks`.

**Backend changes:**

New collection `prediction_tasks`:
```json
{ "task_id": "uuid", "user_id": "uuid", "model_id": "str", "created_at": "datetime" }
```

New endpoint:
```python
@router.get("/result/mine")
async def get_my_results(user: User = Depends(require_authenticated_user)):
    task_docs = list(tasks_db.collection.find({"user_id": str(user.id)},
                     sort=[("created_at", -1)]))
    results = [format_task_result(doc["task_id"]) for doc in task_docs]
    return JSONResponse(status_code=200, content=results)
```

Update `POST /prediction/patient` and `POST /prediction/dataset` to insert into `prediction_tasks` after dispatching Celery task.

**Frontend change:** `Results.getAllResults()` calls `/prediction/result/mine` instead of `/prediction/result/`.

### S-5: Add `created_at` to result response (P-5)

At submission, store `created_at` in `prediction_tasks` (handled by S-4). In `format_task_result()`, accept an optional `created_at` argument (passed from the task doc) and include it in the response.

Alternatively, read `created_at` from Celery task metadata:
```python
# AsyncResult.date_done is set by Celery on completion
created_at = task.date_done.isoformat() if task.date_done else None
```

### S-6: Require auth on result retrieval (P-6)

Add optional auth to `GET /prediction/result/{id}`. Validate that the requesting user owns the task (via `prediction_tasks` collection introduced in S-4), or is admin, or the task belongs to a default/public model.

```python
@router.get("/result/{id}")
async def get_task_by_id(
    id: str,
    user: Optional[User] = Depends(get_current_user_optional)
):
    task_doc = tasks_db.collection.find_one({"task_id": id})
    if task_doc:
        owner_id = task_doc.get("user_id")
        if owner_id and not is_admin(user) and str(getattr(user, "id", "")) != owner_id:
            raise HTTPException(status_code=403, detail="Permission denied")
    result = format_task_result(id)
    return JSONResponse(status_code=200, content=result)
```

### S-7: Set Redis TTL on results (P-7)

Configure Celery result expiry in both `api/worker.py` and `worker/worker.py`:

```python
celery_app.conf.result_expires = 60 * 60 * 24 * 7  # 7 days
```

### S-8: Fix encoder undefined variable (P-13)

In `worker/tasks.py`, initialize `encoder = None` before the conditional block:

```python
encoder = None
if encoder_path and os.path.exists(encoder_path):
    encoder = joblib.load(encoder_path)
```

### S-9: Add auth to patient prediction (no current auth)

Currently `POST /prediction/patient` and `POST /prediction/dataset` accept unauthenticated requests for default/public models. That is intentional. But the `patient` field in `PredictionRequest` is accepted but never stored or used — it should either be removed or wired to the `prediction_tasks` record.

---

## 5. Solution vs. Requirements Comparison

| Requirement | Solution | Gap / Note |
|---|---|---|
| AC-1: Manual path sends codes with model ID and correct disease | S-2 removes hardcoded disease (backend already derives it from model) | No gap |
| AC-1: Auth token sent with prediction requests | S-1 adds `includeAuth: true` | Currently neither path sends auth |
| AC-2: CSV path sends actual file | S-1 (DataSender file support + FormData) | Core fix |
| AC-3: Non-admin users can see their history | S-4 (new `/result/mine` endpoint + `prediction_tasks` collection) | Requires new MongoDB collection + schema |
| AC-4: Result page shows `created_at` | S-5 (store on submission, return in result) | Depends on S-4 |
| AC-5: Celery tasks publish without crash | S-3 (fix signal handler) | One-line fix, high priority |
| AC-6: Consistent result shape | Partially covered by S-4/S-5 | `FAILURE` result format is inconsistent (returns nested error dict instead of string) |

**Additional concern:** S-4 introduces a `prediction_tasks` MongoDB collection. This means historical predictions made before the migration won't appear in user history. The `/result/mine` endpoint should note this clearly. Existing task IDs stored in the browser (e.g. via `sessionStorage` or URL) still work via `GET /result/{id}`.

**Solution adjustment:** For `FAILURE` results, `format_task_result()` currently returns `result` as an error dict (from Redis backend). Frontend `ResultPage.tsx` tries to display `task.error` as a string. Normalize: always return `result` as `float | null` and `error` as `string | null` as separate fields.

---

## 6. Implementation Plan

### Phase 1 — Critical Fixes (unblocks basic functionality)

---

#### BE-1: Fix Celery signal handler
**Files:** `api/worker.py`, `worker/worker.py`

Replace undefined `task` reference:
```python
# before
backend = (task.backend if celery_app.tasks.get(sender) else celery_app.backend)
# after
backend = celery_app.backend
```

---

#### BE-2: Fix encoder undefined variable
**File:** `worker/tasks.py`

Add `encoder = None` initialization before the `if encoder_path` block (line ~16).

---

#### BE-3: Add `prediction_tasks` MongoDB collection + save on submit
**File:** `api/prediction/endpoints.py`, new `api/prediction/db.py`

1. Create `tasks_db = MongoDatabase(db_name="scoring_system", collection_name="prediction_tasks")`
2. After `celery_app.send_task(...)` in both `/patient` and `/dataset` endpoints, insert:
```python
tasks_db.collection.insert_one({
    "task_id": task.id,
    "user_id": str(user.id) if user else None,
    "model_id": model_id,
    "created_at": datetime.utcnow().isoformat(),
})
```

---

#### BE-4: Add `GET /prediction/result/mine` endpoint
**File:** `api/prediction/endpoints.py`

```python
@router.get("/result/mine")
async def get_my_results(user: User = Depends(require_authenticated_user)):
    task_docs = list(tasks_db.collection.find(
        {"user_id": str(user.id)},
        sort=[("created_at", -1)]
    ))
    results = []
    for doc in task_docs:
        r = format_task_result(doc["task_id"])
        r["created_at"] = doc.get("created_at")
        results.append(r)
    return JSONResponse(status_code=200, content=results)
```

**Route order note:** Define `/result/mine` **before** `/result/{id}` in the router — FastAPI matches routes in order and `{id}` would otherwise capture "mine".

---

#### BE-5: Add `created_at` to single result response
**File:** `api/prediction/utils.py` — `format_task_result()`

Accept an optional `created_at` param:
```python
def format_task_result(task_id, created_at=None):
    ...
    # add to all return dicts:
    "created_at": created_at,
```

Update `GET /result/{id}` to look up `prediction_tasks` for `created_at`:
```python
task_doc = tasks_db.collection.find_one({"task_id": id})
created_at = task_doc.get("created_at") if task_doc else None
result = format_task_result(id, created_at=created_at)
```

---

#### BE-6: Normalize result response shape
**File:** `api/prediction/utils.py`

Change `FAILURE` branch to return consistent shape. Currently returns error as `result` field:
```python
# before — inconsistent
return {"status": "FAILURE", "result": error_data, ...}

# after — consistent with SUCCESS
return {
    "status": "FAILURE",
    "result": None,
    "error": str(task.info),
    "task_id": ...,
    "model_id": ...,
    "disease": ...,
    "created_at": ...,
}
```

Apply same `error` field to SUCCESS and PENDING (set to `None`).

---

#### BE-7: Set Redis result TTL
**Files:** `api/worker.py`, `worker/worker.py`

```python
celery_app.conf.result_expires = 60 * 60 * 24 * 7  # 7 days
```

---

#### FE-1: Fix DataSender — CSV sends file, both paths send auth token
**File:** `frontend/src/lib/classes/data.ts`

```typescript
export class DataSender {
  private codes: string[]
  private modelID: string | null
  private predictionType: "patient" | "dataset"
  private file: File | null
  public id: string | null = null
  public message: string | null = null

  constructor(
    codes: string[],
    modelID: string | null,
    predictionType: "patient" | "dataset" = "patient",
    file: File | null = null
  ) {
    this.codes = codes
    this.modelID = modelID
    this.predictionType = predictionType
    this.file = file
  }

  public async postData() {
    try {
      let response: Identificator
      if (this.predictionType === "dataset" && this.file) {
        const fd = new FormData()
        fd.append("dataset", this.file)
        response = await postFormMethod<Identificator>(
          `/prediction/dataset?model_id=${this.modelID}`,
          fd,
          { includeAuth: true }
        )
      } else {
        response = await postMethod<Identificator>(
          `/prediction/patient?model_id=${this.modelID}`,
          { codes: this.codes },
          { includeAuth: true }
        )
      }
      this.id = response.task_id
    } catch (error) {
      if (error instanceof HTTPError) {
        this.message = error.getMessage()
      } else {
        this.message = "An error occurred."
      }
    }
  }
}
```

Remove `this.disease` and `model_type` from data — not needed.

---

#### FE-2: Pass uploadedFile to DataSender in wizard
**File:** `frontend/src/lib/store/scoringWizard.tsx`

In `submitPrediction()`, pass `state.uploadedFile` when constructing `DataSender`:

```typescript
const sender = new DataSender(
  state.codes,
  currentModel._id,
  state.inputMethod === WizardInputMethod.Manual ? "patient" : "dataset",
  state.inputMethod === WizardInputMethod.CSV ? state.uploadedFile : null
)
```

---

#### FE-3: Switch History to `/result/mine`
**File:** `frontend/src/lib/classes/result.ts`

Change `getAllResults()` to call `/prediction/result/mine` instead of `/prediction/result/`:

```typescript
static async getAllResults(): Promise<Task[]> {
  return getMethod<Task[]>("/prediction/result/mine", undefined, { includeAuth: true })
}
```

---

#### FE-4: Add `error` and `created_at` to Task type and display them
**Files:** `frontend/src/lib/classes/result.ts`, `frontend/src/lib/pages/ResultPage.tsx`, `frontend/src/lib/pages/History.tsx`

Update the `Task` type:
```typescript
type Task = {
  status: string
  result: number | null
  task_id: string
  model_id: string | null
  disease: string | null
  error: string | null     // add
  created_at: string | null  // now actually populated
}
```

In `ResultPage.tsx`: replace references to `task.error` (already there) and `task.created_at` — these will now actually have values.

---

### Phase 2 — Security & Operational Hardening (after Phase 1 is stable)

#### BE-8: Add auth check on `GET /prediction/result/{id}`
**File:** `api/prediction/endpoints.py`

Add `get_current_user_optional` dependency. Validate ownership via `prediction_tasks` before returning.

#### BE-9: Add result pagination to admin endpoint
**File:** `api/prediction/endpoints.py`

Add `skip` and `limit` query params to `GET /prediction/result` to prevent memory exhaustion.

---

### Sequencing

```
BE-1 (signal fix)  ← do first, unblocks all task submission
BE-2 (encoder fix) ← do with BE-1, independent
BE-3 (tasks collection) ← required by BE-4, BE-5, BE-6
BE-4 (result/mine) ← depends on BE-3
BE-5 (created_at)  ← depends on BE-3
BE-6 (normalize shape) ← independent, do with BE-5
BE-7 (Redis TTL)   ← independent one-liner

FE-1 (DataSender)  ← core fix, independent
FE-2 (pass file)   ← depends on FE-1
FE-3 (history url) ← independent, do after BE-4 is deployed
FE-4 (Task type)   ← depends on BE-6
```

Backend Phase 1 can be deployed independently of frontend Phase 1. Both must complete before the full wizard CSV path works end-to-end.
