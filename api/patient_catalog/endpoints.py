"""
API endpoints
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from . import models
from .database import CatalogDatabase

router = APIRouter()
database = CatalogDatabase()


@router.get("/catalog/lung-cancer")
async def get_lung_cancer_catalog(skip: int = 0, limit: int = 20):
    data = database.get_page_of_patients(skip, limit)
    if not data:
        data = []
    return JSONResponse(content=jsonable_encoder(data), status_code=200)


@router.get("/catalog/lung-cancer/{id}")
async def get_patiend_by_id(id: int):
    data = database.get_patient_by_id(id)
    if not data:
        raise HTTPException(status_code=404, detail="Patient with id {id} does not exist!",)
    return JSONResponse(content=jsonable_encoder(data), status_code=200)
