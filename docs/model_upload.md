# Model Upload & Management

## Overview

Authenticated scientists and admins can upload trained models in `.onnx` format. Uploaded models are stored on the server filesystem and registered in MongoDB. They can then be selected in the Scoring Wizard to run predictions.

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
| --- | --- | --- | --- |
| `model_name` | string | ✅ | Display name |
| `disease` | enum | ✅ | `lung_cancer`, `multiple_sclerosis`, or `hidradenitis_suppurativa` |
| `description` | string | — | Free-text description |
| `is_public` | bool | — | Whether other authenticated users can use this model (default `false`) |
| `algorithm` | string | — | Algorithm name, e.g. `Random Forest` |
| `accuracy` | float 0–1 | — | Reported accuracy on the training set |
| `model_type` | string | — | Internal algorithm key, e.g. `random_forest`, `hmm` |
| `summary` | string | — | One-line summary shown in the model card |

### File attachments

| Field | Format | Required | Description |
| --- | --- | --- | --- |
| `file` | `.onnx` | ✅ | Self-contained ONNX model |
| `image` | `.jpg` / `.jpeg` / `.png` / `.webp` | — | Optional thumbnail shown in the model list |

The uploaded `.onnx` file is validated with `onnx.checker.check_model()` before being written to disk. Uploads that fail validation are rejected with HTTP 422.

---

## Preparing a model for upload

Models must be exported to ONNX format before uploading. Use the conversion script in the `training` directory:

```bash
cd training
uv sync
python convert/to_onnx.py --input artifacts/ --output artifacts/onnx/
```

This converts `rf_model.pkl`, `lr_model.pkl`, and `hmm_model.pkl` to self-contained `.onnx` files. Each file embeds all parameters (weights, vocabulary mappings, HMM matrices) so no additional files are needed at inference time.

### Required ONNX interface

The worker expects a specific input/output contract:

| Model type | Input name | Input shape | Input dtype | Output name | Output shape |
| --- | --- | --- | --- | --- | --- |
| RF / LR | `input` | `[N, 1]` | `string` | `probabilities` | `float32[N, 2]` |
| HMM | `input` | `[seq_len]` | `string` | `probabilities` | `float32[1, 2]` |

For RF/LR, the single input string is a space-separated list of ICD-10 codes (e.g. `"J44 C34 J44"`). For HMM, each code is a separate element in the 1-D array.

The worker auto-detects the model type from the input shape and finds the probability output by selecting the first `float32` output tensor, so output naming is flexible as long as the probability tensor is float.

---

## Storage

Files are written to the filesystem under a per-user directory with a UUID filename to avoid collisions:

```
model_storage/
└── {user_id}/
    ├── a3f9e1b2....onnx
    └── thumbnail.jpg    (optional)
```

The base path is controlled by the `MODEL_STORAGE_PATH` environment variable (default: `./model_storage`). In Docker deployments this is a named volume (`model_storage`) shared between the `api` and `worker` containers so the worker can read the file at prediction time.

The absolute path is stored in MongoDB at upload time, so it remains valid regardless of the working directory used by either service.

---

## MongoDB Record

Each uploaded model is inserted into `scoring_system.models` with the following shape:

```json
{
  "_id": "<ObjectId>",
  "user": "<user-uuid>",
  "name": "Random Forest",
  "disease": "lung_cancer",
  "model_type": "random_forest",
  "description": "Random forest classifier trained on lung cancer ICD-10 sequences.",
  "summary": "Best all-round choice for most users.",
  "algorithm": "Random Forest",
  "is_public": false,
  "recommended": false,
  "status": "active",
  "path": "/absolute/path/to/model_storage/<user-id>/a3f9e1b2....onnx",
  "image": "/absolute/path/to/model_storage/<user-id>/thumbnail.jpg",
  "onnx_metadata": {
    "input_name": "input",
    "input_dtype": "string",
    "output_name": "probabilities"
  }
}
```

Default models (shipped with the application) use `"user": "default"` and are accessible to everyone including unauthenticated users.

---

## Model Listing & Filtering

```
GET /api/v1/model
```

| Query param | Default | Description |
| --- | --- | --- |
| `include_default` | `true` | Include built-in default models |
| `include_public` | `false` | Include models marked `is_public = true` |
| `include_user` | `false` | Include the authenticated user's own models |
| `disease` | — | Filter by disease key |
| `accuracy` | — | Minimum accuracy threshold (0–1) |
| `algorithm` | — | Filter by algorithm name |
| `author` | — | Filter by user ID |

Even after the DB query, each result is passed through `can_view_model(user, model)` before being returned.

---

## Editing & Deletion

**Edit** (metadata only — the file itself cannot be replaced):

```http
PATCH /api/v1/model/{model_id}
```

Updatable fields: `name`, `description`, `summary`, `is_public`, `recommended`, `algorithm`, `model_type`, `disease`, `metrics`.

**Delete:**

```http
DELETE /api/v1/model/{model_id}
```

Removes the MongoDB record **and** deletes both files from disk (`path`, `image`) if they exist.

Both endpoints use `get_model_for_modify`, which enforces that only the owner or an admin can make changes.

---

## Security

ONNX is a standardised serialisation format based on Protocol Buffers. Unlike pickle/joblib, loading an ONNX file cannot execute arbitrary code — `onnxruntime` only interprets the declared compute graph. This eliminates the entire class of malicious-payload attacks that affected the previous `.pkl`-based approach.

The remaining controls in place:

| Control | Detail |
| --- | --- |
| **Upload requires authentication** | Only approved scientists and admins can upload |
| **ONNX validation at upload** | `onnx.checker.check_model()` rejects structurally invalid files before they reach disk |
| **UUID filename** | Uploaded files are renamed to a UUID, preventing path traversal via crafted filenames |
| **Extension check** | The API rejects any file whose extension is not `.onnx` |
| **Per-user storage directory** | Files are written to `model_storage/{user_id}/` — one user cannot overwrite another user's files |

---

## API Endpoint Summary

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/model` | JWT (scientist / admin) | Upload a new model |
| `GET` | `/model` | Optional JWT | List models (filtered) |
| `GET` | `/model/{id}` | Optional JWT | Get a single model |
| `PATCH` | `/model/{id}` | JWT (owner / admin) | Update model metadata |
| `DELETE` | `/model/{id}` | JWT (owner / admin) | Delete model and files |
