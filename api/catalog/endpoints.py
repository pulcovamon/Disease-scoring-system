from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import Optional

from api.database import MongoDatabase, SortBy, SortOrder

router = APIRouter(prefix="/catalog", tags=["Catalog"])

catalog_db = MongoDatabase(db_name="catalog_db", collection_name="lung_cancer")

@router.get("/lung-cancer")
async def get_lung_cancer_catalog(
    skip: int = 0,
    limit: int = 20,
    code: Optional[str] = Query(None),
    sort_by: SortBy = Query("id"),
    sort_order: SortOrder = Query("asc"),
):
    filter_query = {"codes": {"$in": [code]}} if code else {}
    data = catalog_db.get_page_of_documents(skip, limit, filter_query, sort_by, sort_order)
    return JSONResponse(content=jsonable_encoder(data), status_code=200)

@router.get("/lung-cancer/{id}")
async def get_patient_by_id(id: int):
    data = catalog_db.get_document_by_id(id)
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"Patient with id {id} does not exist!",
        )
    return JSONResponse(content=jsonable_encoder(data), status_code=200)

@router.get("/size")
async def get_size_of_catalog(code: Optional[str] = Query(None)):
    filter_query = {"codes": {"$in": [code]}} if code else None
    count = catalog_db.get_document_count(filter_query)
    return JSONResponse(
        content=jsonable_encoder(count),
        status_code=200,
    )
