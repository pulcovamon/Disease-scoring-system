import os
import math
from fastapi import APIRouter, HTTPException, Query
from elasticsearch import Elasticsearch

from api.logger import Logger

router = APIRouter(prefix="/code", tags=["Codes"])

ES_HOST = os.getenv("ES_HOST", "localhost")
ES_PORT = os.getenv("ES_PORT", "9200")
ES_URL = f"http://{ES_HOST}:{ES_PORT}"
es = Elasticsearch(
    ES_URL,
    request_timeout=60,
    retry_on_timeout=True,
    max_retries=5,
)


INDEX_NAME = os.getenv("ES_INDEX", "medical_codes")

logger = Logger()


@router.get("")
async def get_all_codes(limit: int = 100, skip: int = 0):
    try:
        result = es.search(
            index=INDEX_NAME,
            query={"match_all": {}},
            size=limit,
            from_=skip,
            request_timeout=60
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
            track_total_hits=True,
            request_timeout=60
        )
        total = result["hits"]["total"]["value"]
        return {"total_codes": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/search")
async def search_codes(
    query: str = Query(default=..., min_length=1, description="Search query"),
    limit: int = Query(default=25, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
):
    term = query.strip()
    if not term:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    logger.debug(f"Searching codes for '{term}' (limit={limit}, skip={skip})")

    should_clauses = [
        {"term": {"code": {"value": term, "boost": 6}}},
        {"match_phrase_prefix": {"name": {"query": term, "boost": 4}}},
        {"match": {"name": {"query": term, "fuzziness": "AUTO", "boost": 3}}},
        {"match": {"specialty": {"query": term, "fuzziness": "AUTO", "boost": 1}}},
    ]

    if term.isalnum():
        should_clauses.insert(1, {"wildcard": {"code": {"value": f"*{term}*", "boost": 2}}})

    search_query = {
        "bool": {
            "should": should_clauses,
            "minimum_should_match": 1,
        }
    }

    try:
        result = es.search(
            index=INDEX_NAME,
            query=search_query,
            size=limit,
            from_=skip,
            request_timeout=60,
        )
        hits = result.get("hits", {}).get("hits", [])
        return [hit["_source"] for hit in hits]
    except Exception as e:
        logger.error(f"Code search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/aggregated-params")
async def get_aggregated_params():
    logger.info("Fetching aggregated statistics")
    try:
        result = es.search(
            index=INDEX_NAME,
            size=0,
            aggs={
                "tfidf0": {"extended_stats": {"field": "tfidf_label_0"}},
                "tfidf1": {"extended_stats": {"field": "tfidf_label_1"}},
                "frequency": {"extended_stats": {"field": "frequency"}}
            },
            request_timeout=60,
            allow_partial_search_results=True,
        )

        def to_payload(stats):
            avg = stats.get("avg") or 0.0
            std = stats.get("std_deviation") or 0.0
            return {
                "count": int(stats.get("count") or 0),
                "min": stats.get("min") if stats.get("min") is not None else 0.0,
                "max": stats.get("max") if stats.get("max") is not None else 0.0,
                "avg": avg,
                "sum": stats.get("sum") or 0.0,
                "std": std,
                "logMean": math.log1p(avg),
                "logStd": math.log1p(std) if std > 0 else 1e-6,
            }

        aggs = result["aggregations"]
        return {
            "tfidf0": to_payload(aggs["tfidf0"]),
            "tfidf1": to_payload(aggs["tfidf1"]),
            "frequency": to_payload(aggs["frequency"]),
        }

    except Exception as e:
        # přidej si víc detailů z ES klienta
        logger.error(f"Aggregation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{code}")
async def get_code_by_id(code: str):
    if not code or not code.strip():
        raise HTTPException(status_code=400, detail="Invalid code")

    code = code.lstrip("0")
    logger.debug(code)
    try:
        result = es.search(index=INDEX_NAME, query={"term": {"code": code}}, request_timeout=60)
        hits = result.get("hits", {}).get("hits", [])
        if not hits:
            raise HTTPException(status_code=404, detail="Code not found")
        return hits[0]["_source"]
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail=str(e))
