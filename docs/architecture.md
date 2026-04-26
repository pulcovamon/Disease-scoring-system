# Architecture Overview

## System Overview

A multi-service disease scoring and patient catalog application. A single Nginx proxy is the public entry point — it routes browser requests to the React frontend and `/api/*` to the FastAPI backend.

```
Browser
  └─► Nginx :9123
        ├─► React SPA  :3001   (everything except /api/)
        └─► FastAPI    :8080   (/api/ → /api/v1/...)
```

---

## Services

| Service | Image / Build | Purpose |
|---|---|---|
| `proxy` | nginx:alpine | Public gateway, routes traffic |
| `frontend` | `./frontend` | React SPA |
| `api` | `./api` | FastAPI REST API |
| `worker` | `./worker` | Celery ML prediction worker |
| `catalog_db` | mongo:4.4 | Patient catalog + ML model registry |
| `mysql_server` | mysql:8.0 | User accounts, auth, patient records |
| `redis_server` | redis:alpine | Celery broker + result backend |
| `elasticsearch` | elasticsearch:8.11.1 | Medical code full-text search index |
| `flower` | `./flower` | Celery task monitoring UI |

A shared Docker volume `model_storage` is mounted into both `api` and `worker` so uploaded model files (`.joblib`) are accessible to both.

---

## Backend — FastAPI (`/api/v1`)

### Routers

```
/auth/*        — JWT auth, user registration/approval, patient CRUD  (MySQL via SQLModel)
/catalog/*     — Patient catalog browse/filter                        (MongoDB)
/model/*       — ML model upload, list, edit, delete                  (MongoDB + filesystem)
/prediction/*  — Submit prediction jobs, poll results                 (Celery → Redis)
/code/*        — Medical code autocomplete search                     (Elasticsearch)
```

### Auth System (MySQL)

- `users` table — UUID primary key, role (`admin` / `scientist` / `user`), `is_approved` flag
- `auth` table — bcrypt-hashed password + salt, FK to users
- Login → JWT Bearer token (15-day expiry)
- New users require admin approval before they can act
- Role-based permission checks in `permissions.py` / `dependencies.py`

### MongoDB Databases

| Database | Collection | Contents |
|---|---|---|
| `catalog_db` | `lung_cancer` | Patient records with ICD-10 codes, ground-truth labels, model predictions |
| `scoring_system` | `models` | Uploaded ML model metadata (path, disease, algorithm, accuracy, owner) |

---

## Async ML Prediction Flow

```
1. Client POSTs codes + model_id  →  POST /prediction/patient
                                  or POST /prediction/dataset  (CSV / JSON file)
2. FastAPI looks up model doc in MongoDB, resolves file path on shared volume
3. celery_app.send_task("run_model_prediction", ...)  →  Redis broker
4. Returns 202 + { task_id }

5. Worker picks up task from Redis queue
6. Loads model with joblib.load(model_path)
7. Optionally loads encoder from encoder_path
8. Runs prediction (predict_proba or predict)
9. Stores result in Redis result backend

10. Client polls  GET /prediction/result/{task_id}
11. FastAPI reads AsyncResult from Redis, returns status + result
```

Task lifecycle: `SENT` → `PENDING` → `SUCCESS` / `FAILURE`

---

## Frontend — React SPA

**Stack**: React 18 · TypeScript · Tailwind CSS v4 · React Router v6

### Routes

All routes are prefixed with a language code (`/en/`, `/cs/`).

| Path | Page | Auth required |
|---|---|---|
| `/` | Home | No |
| `/score` | Scoring wizard (multi-step) | No |
| `/catalog` | Patient list with code filter | No |
| `/catalog/:id` | Patient detail with heatmap | No |
| `/result/:id` | Prediction result | No |
| `/result` | Prediction history | No |
| `/models` | ML model management | Yes |
| `/datasets` | Dataset management | Yes |
| `/account` | User account | Yes |

### State Management

Context API only (no Redux / Zustand):

| Provider | Contents |
|---|---|
| `AuthProvider` | JWT token, user profile, login/logout, unauthorized redirect |
| `ThemeProvider` | Light / dark mode |
| `LanguageProvider` | Active locale (en / cs), path builder |
| `scoringWizard` | Multi-step prediction form state (sessionStorage-persisted) |

### Key Data Patterns

- `catalogCache` — module-level singleton; caches patient list and count by query key, preventing redundant fetches on filter/page changes
- `codeCache` — localStorage-backed singleton; caches Elasticsearch code lookups across browser sessions
- All API calls go through `getMethod` / `postMethod` / `patchMethod` / `deleteMethod` in `api.ts`, which attach the JWT Bearer token and handle 401 globally
