import os
from fastapi import APIRouter, HTTPException, Query
from elasticsearch import Elasticsearch
from typing import List, Optional

from api.logger import Logger

router = APIRouter(prefix="/code", tags=["Codes"])

ES_HOST = os.getenv("ES_HOST", "localhost")
ES_PORT = os.getenv("ES_PORT", "9200")
ES_URL = f"http://{ES_HOST}:{ES_PORT}"
es = Elasticsearch(ES_URL)

INDEX_NAME = os.getenv("ES_INDEX", "medical_codes")

logger = Logger()


@router.get("")
async def get_all_codes(limit: int = 100):
    try:
        result = es.search(index=INDEX_NAME, query={"match_all": {}}, size=limit)
        hits = result.get("hits", {}).get("hits", [])
        return [hit["_source"] for hit in hits]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_codes(query: str = Query(default=..., description="Search query")):
    logger.debug("test logger here")
    query = {
        "multi_match": {
            "query": query,
            "fields": ["name^2", "specialty"], # name is more important
            "fuzziness": "AUTO"
        }
    }
    try:
        result = es.search(index=INDEX_NAME, query=query)
        hits = result.get("hits", {}).get("hits", [])
        return [hit["_source"] for hit in hits]
    except Exception as e:
        logger.error(f"An error occured: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{code}")
async def get_code_by_id(code: str):
    try:
        result = es.search(index=INDEX_NAME, query={"match": {"code": code}})
        hits = result.get("hits", {}).get("hits", [])
        if not hits:
            raise HTTPException(status_code=404, detail="Code not found")
        return hits[0]["_source"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

