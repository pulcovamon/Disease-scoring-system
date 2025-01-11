import os
from typing import List
from pymongo import MongoClient
from pymongo.cursor import Cursor


class CatalogDatabase:
    def __init__(self):
        client = MongoClient(
            os.getenv("MONGO_URL", "mongodb://root:pass@catalog_db:27017")
        )
        self.db = client.catalog_db
        self.collection = self.db.lung_cancer

    def get_page_of_patients(self, skip: int, limit: int) -> List[dict]:
        cursor = self.collection.find({}).skip(skip).limit(limit)
        return list(cursor) 

    def get_number_of_patients(self) -> int:
        return self.collection.count_documents({})

    def get_patient_by_id(self, patient_id: int) -> dict:
        return self.collection.find_one({"_id": patient_id})

    def get_patients_with_code(self, code: str) -> List[dict]:
        return list(self.collection.find({"codes": {"$in": [code]}}))