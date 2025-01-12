from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import List

from .database import CatalogDatabase

router = APIRouter()
database = CatalogDatabase()

@router.get("/catalog/lung-cancer")
async def get_lung_cancer_catalog(skip: int = 0, limit: int = 20, code: str = None):
    if code:
        data = database.get_patients_with_code(code, skip, limit)
    else:
        data = database.get_page_of_patients(skip, limit)

    if not data:
        data = []

    return JSONResponse(content=jsonable_encoder(data), status_code=200)

@router.get("/catalog/lung-cancer/{id}")
async def get_patient_by_id(id: int):
    data = database.get_patient_by_id(id)
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"Patient with id {id} does not exist!",
        )
    return JSONResponse(content=jsonable_encoder(data), status_code=200)

@router.get("/catalog/size")
async def get_size_of_catalog(code: str = None):
    count = database.get_number_of_patients(code)
    return JSONResponse(
        content=jsonable_encoder(count),
        status_code=200,
    )
