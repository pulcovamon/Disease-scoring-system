import os
from typing import List, Literal, Optional
from pymongo import MongoClient

SortBy = Literal["id", "codes", "predictions", "accuracy"]
SortOrder = Literal["asc", "desc"]

# Maps sort_by key → aggregation stage that adds a "_sort_key" field
_SORT_STAGES: dict[str, list[dict]] = {
    "id": [],  # _id is native, handled directly
    "codes": [
        {"$addFields": {"_sort_key": {"$size": {"$ifNull": ["$codes", []]}}}}
    ],
    "predictions": [
        {"$addFields": {"_sort_key": {"$size": {"$ifNull": ["$active_phase.prediction", []]}}}}
    ],
    "accuracy": [
        {"$addFields": {
            "_ap_gt":  {"$ifNull": ["$active_phase.ground_truth", []]},
            "_ap_pred": {"$ifNull": ["$active_phase.prediction", []]},
        }},
        {"$addFields": {
            "_ap_len": {"$size": "$_ap_gt"},
            "_ap_hits": {"$reduce": {
                "input": {"$range": [0, {"$size": "$_ap_gt"}]},
                "initialValue": 0,
                "in": {"$add": ["$$value", {"$cond": {
                    "if": {"$eq": [
                        {"$arrayElemAt": ["$_ap_gt",   "$$this"]},
                        {"$arrayElemAt": ["$_ap_pred", "$$this"]},
                    ]},
                    "then": 1, "else": 0,
                }}]},
            }},
        }},
        {"$addFields": {"_sort_key": {"$cond": {
            "if":   {"$gt": ["$_ap_len", 0]},
            "then": {"$divide": ["$_ap_hits", "$_ap_len"]},
            "else": 0,
        }}}},
    ],
}

_CLEANUP = {"$project": {
    "_sort_key": 0, "_ap_gt": 0, "_ap_pred": 0, "_ap_len": 0, "_ap_hits": 0,
}}


class MongoDatabase:
    def __init__(
        self,
        db_name: str = "catalog_db",
        collection_name: str = "lung_cancer"
    ):
        mongo_url = os.getenv("MONGO_URL", "mongodb://root:pass@localhost:27017")
        client = MongoClient(mongo_url)
        self.db = client[db_name]
        self.collection = self.db[collection_name]

    def get_page_of_documents(
        self,
        skip: int,
        limit: int,
        filter_query: Optional[dict] = None,
        sort_by: SortBy = "id",
        sort_order: SortOrder = "asc",
    ) -> List[dict]:
        direction = 1 if sort_order == "asc" else -1
        match_stage = filter_query or {}

        if sort_by == "id":
            cursor = (
                self.collection.find(match_stage)
                .sort("_id", direction)
                .skip(skip)
                .limit(limit)
            )
            return list(cursor)

        pipeline = (
            [{"$match": match_stage}]
            + _SORT_STAGES[sort_by]
            + [{"$sort": {"_sort_key": direction}}, {"$skip": skip}, {"$limit": limit}, _CLEANUP]
        )
        return list(self.collection.aggregate(pipeline))

    def get_document_count(self, filter_by: Optional[dict] = None) -> int:
        return self.collection.count_documents(filter_by or {})

    def get_document_by_id(self, document_id) -> Optional[dict]:
        return self.collection.find_one({"_id": document_id})

    def get_documents_by_field_value(
        self, field: str, value, skip: int = 0, limit: int = 10
    ) -> List[dict]:
        cursor = self.collection.find({field: {"$in": [value]}}).skip(skip).limit(limit)
        return list(cursor)
