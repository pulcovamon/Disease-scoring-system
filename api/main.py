import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.prediction.endpoints import router as scoring_sytem_router
from api.catalog.endpoints import router as catalog_router
from api.models.endpoints import router as models_router
from api.codes.endpoints import router as codes_router
from api.auth.endpoints import router as auth_router

app = FastAPI(title="scoring-system")
app.include_router(scoring_sytem_router)
app.include_router(catalog_router)
app.include_router(models_router)
app.include_router(codes_router)
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
