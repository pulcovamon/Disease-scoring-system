import os
import math
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
async def get_all_codes(limit: int = 100, skip: int = 0):
    try:
        result = es.search(
            index=INDEX_NAME,
            query={"match_all": {}},
            size=limit,
            from_=skip
        )
        hits = result.get("hits", {}).get("hits", [])
        return [hit["_source"] for hit in hits]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.get("/count")
async def get_total_codes():
    try:
        result = es.search(
            index=INDEX_NAME,
            query={"match_all": {}},
            size=0,
            track_total_hits=True
        )
        total = result["hits"]["total"]["value"]
        return {"total_codes": total}
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


@router.get("/aggregated-params")
async def get_aggregated_params():
    logger.info("Fetching aggregated statistics")
    try:
        aggs_query = {
            "size": 10000,
            "_source": ["tfidf_label_0", "tfidf_label_1", "frequency"],
            "query": {"match_all": {}}
        }

        result = es.search(index=INDEX_NAME, body=aggs_query)
        hits = result["hits"]["hits"]

        tfidf0_values = [hit["_source"].get("tfidf_label_0", 0) or 0 for hit in hits]
        tfidf1_values = [hit["_source"].get("tfidf_label_1", 0) or 0 for hit in hits]
        frequency_values = [hit["_source"].get("frequency", 0) or 0 for hit in hits]

        def compute_stats(values):
            import math
            count = len(values)
            mean = sum(values) / count if count else 0
            std = (sum((x - mean) ** 2 for x in values) / count) ** 0.5 if count else 0
            return {
                "count": count,
                "min": min(values) if values else 0,
                "max": max(values) if values else 0,
                "avg": mean,
                "sum": sum(values),
                "std": std,
                "logMean": math.log1p(mean),
                "logStd": math.log1p(std) if std > 0 else 1e-6
            }

        return {
            "tfidf0": compute_stats(tfidf0_values),
            "tfidf1": compute_stats(tfidf1_values),
            "frequency": compute_stats(frequency_values)
        }

    except Exception as e:
        logger.error(f"Aggregation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{code}")
async def get_code_by_id(code: str):
    if not code or not code.strip():
        raise HTTPException(status_code=400, detail="Invalid code")

    code = code.lstrip("0")
    logger.debug(code)
    try:
        result = es.search(index=INDEX_NAME, query={"match": {"code": code}})
        hits = result.get("hits", {}).get("hits", [])
        if not hits:
            raise HTTPException(status_code=404, detail="Code not found")
        return hits[0]["_source"]
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail=str(e))

