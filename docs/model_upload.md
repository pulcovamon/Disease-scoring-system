# Model Upload & Management

## Overview

Authenticated scientists and admins can upload trained scikit-learn models in `.pkl` format. Uploaded models are stored on the server filesystem and registered in MongoDB. They can then be selected in the Scoring Form to run predictions.

---

## Who can upload

Only users with the `scientist` or `admin` role **and** `is_approved = True` may upload models. The `ensure_can_upload_model` dependency enforces this — unapproved scientists are also blocked.

See [User Roles](user_roles.md) for the full permission matrix.

---

## Upload API

```
POST /api/v1/model
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

### Form fields

| Field | Type | Required | Description |
|---|---|---|---|
| `model_name` | string | ✅ | Display name |
| `disease` | enum | ✅ | `lung_cancer`, `multiple_sclerosis`, or `hidradenitis_suppurativa` |
| `description` | string | — | Free-text description |
| `is_public` | bool | — | Whether other authenticated users can use this model (default `false`) |
| `algorithm` | string | — | Algorithm name, e.g. `Random Forest` |
| `accuracy` | float 0–1 | — | Reported accuracy on the training set |

### File attachments

| Field | Format | Required | Description |
|---|---|---|---|
| `file` | `.pkl` | ✅ | The serialised scikit-learn model |
| `encoder` | `.pkl` | — | Optional label encoder (e.g. `LabelEncoder`) |
| `image` | `.jpg` / `.jpeg` / `.png` / `.webp` | — | Optional thumbnail shown in the model list |

---

## Storage

Files are written to the filesystem under a per-user directory:

```
model_storage/
└── {user_id}/
    ├── random_forest_model.pkl
    ├── encoder.pkl          (optional)
    └── thumbnail.jpg        (optional)
```

The base path is controlled by the `MODEL_STORAGE_PATH` environment variable (default: `./model_storage`). In Docker deployments this is a named volume (`model_storage`) shared between the `api` and `worker` containers so the worker can read the file at prediction time.

The file path stored in MongoDB is the absolute path resolved at upload time, so it remains valid regardless of the working directory the worker process uses.

---

## MongoDB Record

Each uploaded model is inserted into `scoring_system.models` with the following shape:

```json
{
  "_id": "<ObjectId>",
  "user": "<user-uuid>",
  "name": "Random Forest",
  "disease": "lung_cancer",
  "description": "Random forest classifier with default hyperparameters.",
  "algorithm": "Random Forest",
  "accuracy": 0.87,
  "is_public": false,
  "path": "/absolute/path/to/model_storage/<user-id>/random_forest_model.pkl",
  "encoder": "/absolute/path/to/model_storage/<user-id>/encoder.pkl",
  "image": "/absolute/path/to/model_storage/<user-id>/thumbnail.jpg"
}
```

Default models (shipped with the application) use `"user": "default"` and are accessible to everyone including unauthenticated users.

---

## Model Listing & Filtering

```
GET /api/v1/model
```

| Query param | Default | Description |
|---|---|---|
| `include_default` | `true` | Include built-in default models |
| `include_public` | `false` | Include models marked `is_public = true` |
| `include_user` | `false` | Include the authenticated user's own models |
| `disease` | — | Filter by disease key |
| `accuracy` | — | Minimum accuracy threshold (0–1) |
| `algorithm` | — | Filter by algorithm name |
| `author` | — | Filter by user ID |

Even after the DB query, each result is passed through `can_view_model(user, model)` before being returned — so the access check is applied twice (once in the query, once per result).

---

## Editing & Deletion

**Edit** (metadata only — the file itself cannot be replaced):
```
PATCH /api/v1/model/{model_id}
```
Updatable fields: `name`, `description`, `is_public`, `algorithm`, `accuracy`.

**Delete:**
```
DELETE /api/v1/model/{model_id}
```
Removes the MongoDB record **and** deletes all three files from disk (`path`, `encoder`, `image`) if they exist.

Both endpoints use `get_model_for_modify`, which enforces that only the owner or an admin can make changes.

---

## Security of `.pkl` Files

### The inherent risk

Python's `pickle` / `joblib` serialisation format can execute **arbitrary code** during deserialisation. A malicious `.pkl` file can run any Python when `joblib.load()` is called — this is a well-known and unavoidable property of the format.

### What the current implementation does

| Control | Detail |
|---|---|
| **Upload requires authentication** | Only approved scientists and admins can upload — anonymous users cannot introduce a model |
| **Extension check** | The API rejects any file whose extension is not `.pkl` |
| **Per-user storage directory** | Files are written to `model_storage/{user_id}/` — one user cannot overwrite another user's files |
| **Access control at execution** | `can_run_prediction` is checked before the worker loads the model — unauthenticated users can only trigger default models |

### What it does NOT do

| Gap | Risk |
|---|---|
| **No content scanning** | The `.pkl` bytes are written to disk and later loaded without any validation that they contain a legitimate scikit-learn model |
| **Weak filename sanitisation** | `sanitize_filename()` only replaces spaces with underscores — it does not prevent path traversal characters such as `../` |
| **No file size limit** | An arbitrarily large file can be uploaded and stored |
| **Pickle execution in worker** | `joblib.load(model_path)` in the Celery worker will execute any embedded payload at task time, not at upload time |

### Recommendations for a production deployment

- **Restrict uploaders** — keep the `scientist` role tightly controlled; treat every uploaded model as potentially hostile code.
- **Sandbox the worker** — run the Celery worker in a container or VM with no network access and minimal filesystem permissions, so that even if a malicious model runs, the blast radius is contained.
- **Validate after loading** — after `joblib.load()`, check that the result is an instance of a known base class (e.g. `sklearn.base.BaseEstimator`) before calling `predict`.
- **Improve filename sanitisation** — strip or reject path separators, null bytes, and non-ASCII characters in `sanitize_filename()`.
- **Add a file size cap** — set `MAX_CONTENT_LENGTH` or a FastAPI body size limit.

---

## API Endpoint Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/model` | JWT (scientist / admin) | Upload a new model |
| `GET` | `/model` | Optional JWT | List models (filtered) |
| `GET` | `/model/{id}` | Optional JWT | Get a single model |
| `PATCH` | `/model/{id}` | JWT (owner / admin) | Update model metadata |
| `DELETE` | `/model/{id}` | JWT (owner / admin) | Delete model and files |
