import os
from typing import List, Optional
from pymongo import MongoClient


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

    def get_page_of_documents(self, skip: int, limit: int) -> List[dict]:
        cursor = self.collection.find({}).skip(skip).limit(limit)
        return list(cursor)

    def get_document_count(self, filter_by: Optional[dict] = None) -> int:
        return self.collection.count_documents(filter_by or {})

    def get_document_by_id(self, document_id) -> Optional[dict]:
        return self.collection.find_one({"_id": document_id})

    def get_documents_by_field_value(
        self, field: str, value, skip: int = 0, limit: int = 10
    ) -> List[dict]:
        cursor = self.collection.find({field: {"$in": [value]}}).skip(skip).limit(limit)
        return list(cursor)
