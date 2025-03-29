import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.scoring_system.endpoints import router as scoring_sytem_router
from api.patient_catalog.endpoints import router as catalog_router

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
