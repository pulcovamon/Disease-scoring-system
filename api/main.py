import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scoring_system.endpoints import router as scoring_sytem_router
from patient_catalog.endpoints import router as catalog_router
from patient_catalog.database import CatalogDatabase

database = CatalogDatabase()
app = FastAPI(title="scoring-system")
app.include_router(scoring_sytem_router)
app.include_router(catalog_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    database.reinitialize_db()
    uvicorn.run(app, host="0.0.0.0", port=8080)
