"""
API endpoints
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
#from fastapi_pagination import Page, add_pagination, paginate

from . import models
from .database import CatalogDatabase

router = APIRouter()
#add_pagination(router)
database = CatalogDatabase()


'''@router.get("/catalog/lung-cancer")
def get_lung_cancer_catalog() -> Page[models.Patient]:
    return paginate(models.Patient)'''

@router.get("/catalog/lung-cancer")
async def get_lung_cancer_catalog():
    data = database.get_patient_ids()
    if not data:
        raise HTTPException(status_code=404, detail="IDs not found!",)
    return JSONResponse(content=jsonable_encoder(data), status_code=200)


@router.get("/catalog/lung-cancer/{id}")
async def get_patiend_by_id(id: int):
    data = database.get_patient_by_id(id)
    if not data:
        raise HTTPException(status_code=404, detail="Patient with id {id} does not exist!",)
    return JSONResponse(content=jsonable_encoder(data), status_code=200)
