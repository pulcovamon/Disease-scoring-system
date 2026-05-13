# Disease Scoring System

A web application for predicting disease outcomes from ICD-10 codes using trained machine learning models. Developed as a master's thesis at the Faculty of Biomedical Engineering, CTU Prague.

| | |
|---|---|
| **Author** | Monika Pulcová |
| **Supervisor** | Ing. Ondřej Klempíř, Ph.D. |
| **Faculty** | Faculty of Biomedical Engineering, CTU Prague |
| **Department** | Department of Biomedical Informatics |
| **Programme** | Biomedical and Clinical Informatics |
| **Specialisation** | Software Technologies |
| **Thesis title** | Data Catalog: A Web Application for Visualization and Analysis of Longitudinal Administrative Data |

---

## What it does

- Accepts ICD-10 billing codes for a patient (entered manually or via CSV upload)
- Runs them through a scikit-learn model to predict disease probability
- Supports **Lung Cancer**, **Multiple Sclerosis**, and **Hidradenitis Suppurativa**
- Provides a catalog of training patients with heatmap visualisation of prediction accuracy
- Allows scientists and admins to upload, share, and manage ML models

Try the app at UAT: [https://scoring-uat.pulcovamon.eu/en]

---

## Running the application

### Local development (makefile)

```bash
# First-time setup — install dependencies, start containers, seed databases
make setup

# On subsequent runs — start existing DB containers, then the app
make start-db
make app
```

The app starts three processes in parallel:

| Process | URL |
|---|---|
| FastAPI (API) | http://localhost:8080 |
| React frontend | http://localhost:5173 |
| Celery worker | — |

### Docker Compose (development)

```bash
docker-compose -f docker-compose-dev.yml up -d --build
```

### Docker Compose (production)

```bash
docker-compose up -d --build
```

The production stack adds an Nginx reverse proxy at **http://localhost:9123** that routes `/api/*` to FastAPI and everything else to the React SPA.

---

## Makefile targets

| Target | Description |
|---|---|
| `make requirements` | Install all Python and frontend dependencies |
| `make db` | Start DB containers and run init scripts |
| `make start-db` | Start existing DB containers |
| `make app` | Run API, worker, and frontend with live reload |
| `make stop-db` | Stop DB containers (keep data) |
| `make clean-db` | Remove DB containers and volumes |
| `make clean` | Full clean — containers, volumes, venvs, node_modules |
| `make reinstall` | Re-sync dependencies without removing venvs |
| `make docs-serve` | Serve documentation locally at http://localhost:8000 |
| `make docs-build` | Build static documentation site |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS v4, React Router v6 |
| API | FastAPI, SQLModel, PyMongo |
| Worker | Celery, joblib, scikit-learn |
| Auth | JWT (15-day expiry), bcrypt, role-based permissions |
| Databases | MongoDB (catalog + models), MySQL (users + auth), Redis (Celery broker + results) |
| Search | Elasticsearch 8 (ICD-10 code full-text search) |
| Proxy | Nginx (production) |
| Package manager | uv (Python), npm (Node) |
