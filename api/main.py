from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from api.prediction.endpoints import router as scoring_sytem_router
from api.catalog.endpoints import router as catalog_router
from api.models.endpoints import router as models_router
from api.codes.endpoints import router as codes_router
from api.auth.endpoints import router as auth_router

app = FastAPI(title="scoring-system")

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(scoring_sytem_router)
api_router.include_router(catalog_router)
api_router.include_router(models_router)
api_router.include_router(codes_router)
api_router.include_router(auth_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
