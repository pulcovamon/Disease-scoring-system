import os
import re
import time
import shutil
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError

MONGO_URL = os.getenv("MONGO_URL", "mongodb://root:pass@localhost:27017")
MODEL_STORAGE_PATH = os.getenv("MODEL_STORAGE_PATH", "./local_model_storage")
CATALOG_PATH = os.getenv("CATALOG_PATH", "catalog.txt")
DEFAULT_MODEL_SOURCE = os.getenv("DEFAULT_MODEL_SOURCE", "./db/default_models")

os.makedirs(MODEL_STORAGE_PATH, exist_ok=True)

default_dir = os.path.join(MODEL_STORAGE_PATH, "default")
os.makedirs(default_dir, exist_ok=True)

def wait_for_mongo(uri, timeout=30):
    print(f"⏳ Waiting for MongoDB at {uri}...")
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            client = MongoClient(uri, serverSelectionTimeoutMS=1000)
            client.admin.command('ping')
            print("✅ MongoDB is ready.")
            return client
        except ServerSelectionTimeoutError:
            print("🔁 Still waiting...")
            time.sleep(1)
    raise TimeoutError("❌ Could not connect to MongoDB in time.")

client = wait_for_mongo(MONGO_URL)

catalog_db = client["catalog_db"]
catalog_db.lung_cancer.delete_many({})
catalog_db.lung_cancer.create_index("_id")
catalog_db.lung_cancer.create_index("codes")

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

print(f"📂 Uploading data from {CATALOG_PATH}")
parse_and_upload(CATALOG_PATH)
print("✅ Patient data uploaded.")

scoring_db = client["scoring_system"]
models_collection = scoring_db["models"]

model_definitions = [
    {
        "filename": "random_forest_model.pkl",
        "name": "Random Forest",
        "description": "Random forest classifier with default hyperparameters.",
        "image": None,
    },
]

default_user = "default"
default_user_dir = os.path.join(MODEL_STORAGE_PATH, default_user)
os.makedirs(default_user_dir, exist_ok=True)

for model in model_definitions:
    src_path = os.path.join(DEFAULT_MODEL_SOURCE, model["filename"])
    dst_path = os.path.join(default_user_dir, model["filename"])

    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)

        model_doc = {
            "user": default_user,
            "path": dst_path,
            "name": model["name"],
            "description": model["description"],
            "image": model["image"],
            "is_public": True
        }

        if not models_collection.find_one({"path": dst_path}):
            models_collection.insert_one(model_doc)
            print(f"✅ Inserted model: {model['name']}")
        else:
            print(f"ℹ️ Model already exists: {model['name']}")
    else:
        print(f"⚠️ WARNING: {model['filename']} not found in {DEFAULT_MODEL_SOURCE}")

print("✅ Default models registered in MongoDB.")
print("✅ Init complete.")
