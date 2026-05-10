import json
import logging
import os
import random
from typing import Tuple

logger = logging.getLogger(__name__)


def load_patients(path: str) -> list:
    with open(path, "r") as f:
        data = json.load(f)
    return data["patients"]


def patient_split(
    patients: list,
    train: float = 0.70,
    val: float = 0.15,
    test: float = 0.15,
    seed: int = 42,
) -> Tuple[list, list, list]:
    assert abs(train + val + test - 1.0) < 1e-6, "Ratios must sum to 1.0"
    patients = patients[:]
    random.Random(seed).shuffle(patients)
    n = len(patients)
    train_end = int(n * train)
    val_end = train_end + int(n * val)
    return patients[:train_end], patients[train_end:val_end], patients[val_end:]


def load_from_mongo(
    mongo_url: str = None,
    db_name: str = "catalog_db",
    collection_name: str = "lung_cancer",
) -> list:
    """
    Load patients directly from MongoDB and parse the '-delimited code sequences.
    Returns full, unfiltered sequences — no vocabulary reduction is applied here.

    Feature selection is the responsibility of each model:
    - RF and LR: TF-IDF + chi2 selection inside their sklearn Pipeline
    - HMM: CodeVocabulary built from training sequences only

    Filtering codes here would corrupt HMM training by removing codes that
    appear between two kept codes, making the learned transitions meaningless.

    The document structure expected in MongoDB:
      {
        "_id": <patient_id>,
        "codes": ["code1", "'code2", ...],   # "'" prefix marks a new sequence
        "active_phase": {
          "ground_truth": [0, 1, ...],       # one label per sequence
        }
      }
    """
    try:
        from pymongo import MongoClient
    except ImportError:
        raise ImportError(
            "pymongo is required for --from-mongo. "
            "Install it with: pip install pymongo"
        )

    url = mongo_url or os.getenv("MONGO_URL", "mongodb://root:pass@localhost:27017")
    client = MongoClient(url)
    raw_docs = list(client[db_name][collection_name].find().sort("_id", 1))

    if not raw_docs:
        raise ValueError(
            f"No documents found in {db_name}.{collection_name}. "
            "Is the database running and populated?"
        )

    patients = []
    for doc in raw_docs:
        sequences = _parse_sequences(doc)
        if sequences:
            patients.append({"id": str(doc["_id"]), "sequences": sequences})

    logger.info(f"Loaded {len(patients)} patients from MongoDB ({db_name}.{collection_name})")
    return patients


def _parse_sequences(doc: dict) -> list:
    """Parse a single MongoDB document into a list of labeled sequences."""
    ground_truth = doc.get("active_phase", {}).get("ground_truth", [])
    codes = doc.get("codes", [])

    sequences = []
    current: list[str] = []
    seq_idx = 0

    for raw_code in codes:
        is_boundary = raw_code.startswith("'")
        code = raw_code.lstrip("'")

        if is_boundary and current:
            if seq_idx < len(ground_truth):
                sequences.append({"label": ground_truth[seq_idx], "codes": current})
            current = []
            seq_idx += 1

        if code:
            current.append(code)

    if current and seq_idx < len(ground_truth):
        sequences.append({"label": ground_truth[seq_idx], "codes": current})

    return sequences


def flatten_sequences(patients: list) -> Tuple[list, list, list]:
    """Return (sequences, labels, patient_ids). patient_ids needed for GroupKFold."""
    sequences, labels, patient_ids = [], [], []
    for patient in patients:
        pid = patient["id"]
        for seq in patient["sequences"]:
            sequences.append(seq["codes"])
            labels.append(seq["label"])
            patient_ids.append(pid)
    return sequences, labels, patient_ids
