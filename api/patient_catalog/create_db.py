import re
import os
from pymongo import MongoClient

client = MongoClient("mongodb://root:pass@0.0.0.0:27017")

catalog_db = client["catalog_db"]
catalog_db.lung_cancer.delete_many({})
catalog_db.lung_cancer.create_index("_id")
catalog_db.lung_cancer.create_index("codes")

scoring_db = client["scoring_system"]
models_collection = scoring_db["models"]

default_models = {
    "_id": "default",
    "path": "/models/default/",
    "user": None,
    "children": [
        {"filename": "model_1.pkl", "name": "Logistic Regression", "description": "Basic logistic regression model for testing."},
        {"filename": "model_2.pkl", "name": "Random Forest", "description": "Random forest classifier with default hyperparameters."}
    ]
}

models_collection.replace_one({"_id": "default"}, default_models, upsert=True)

print("Default models inserted.")


def parse_and_upload(file_path):
    with open(file_path, "r") as file:
        content = file.read()

    patients_data = content.split("PATIENT ID: ")

    for patient_data in patients_data:
        if not patient_data.strip():
            continue
        
        patient_id_match = re.search(r"(\d+)\n", patient_data)
        if not patient_id_match:
            continue
        patient_id = int(patient_id_match.group(1))

        active_phase_gt_match = re.search(r"ACTIVE PHASE Ground truth: \[(.*?)\]", patient_data)
        active_phase_pred_match = re.search(r"ACTIVE PHASE Prediction: \[(.*?)\]", patient_data)
        active_phase_gt = list(map(int, active_phase_gt_match.group(1).split())) if active_phase_gt_match else []
        active_phase_pred = list(map(int, active_phase_pred_match.group(1).split())) if active_phase_pred_match else []

        icd10_multiclass_gt_match = re.search(r"ICD10 MULTICLASS Ground truth: \[(.*?)\]", patient_data)
        icd10_multiclass_pred_match = re.search(r"ICD10 MULTICLASS Prediction: \[(.*?)\]", patient_data)
        icd10_multiclass_gt = icd10_multiclass_gt_match.group(1).split() if icd10_multiclass_gt_match else []
        icd10_multiclass_pred = list(map(int, icd10_multiclass_pred_match.group(1).split())) if icd10_multiclass_pred_match else []

        icd10_binary_gt_match = re.search(r"ICD10 BINARY Ground truth: \[(.*?)\]", patient_data)
        icd10_binary_pred_match = re.search(r"ICD10 cBINARY Prediction: \[(.*?)\]", patient_data)
        icd10_binary_gt = icd10_binary_gt_match.group(1).split() if icd10_binary_gt_match else []
        icd10_binary_pred = list(map(int, icd10_binary_pred_match.group(1).split())) if icd10_binary_pred_match else []

        codes_match = re.search(r"Codes: \[([^\]]+)\]", patient_data)
        codes = codes_match.group(1).split() if codes_match else []

        patient_data = {
            "_id": patient_id,
            "active_phase": {
                "ground_truth": active_phase_gt,
                "prediction": active_phase_pred
            },
            "icd10_multiclass": {
                "ground_truth": icd10_multiclass_gt,
                "prediction": icd10_multiclass_pred
            },
            "icd10_binary": {
                "ground_truth": icd10_binary_gt,
                "prediction": icd10_binary_pred
            },
            "codes": codes
        }
        
        catalog_db.lung_cancer.insert_one(patient_data)

file_path = "catalog.txt"
parse_and_upload(file_path)

print("Done")
