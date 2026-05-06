"""
Anonymize the lung_cancer catalog collection in MongoDB.

What it does:
  - Replaces each patient's _id with a new random integer (no two patients share the same ID)
  - Collects all values for every field (codes, active_phase gt/pred, icd10_multiclass gt/pred,
    icd10_binary gt/pred) across all patients into per-field pools, then randomly re-draws
    a new list of the same length for each patient from the matching pool
  - All pools are drawn independently, so no real combination of fields can be reconstructed
  - Runs in-place against the running MongoDB container; safe to re-run (each run
    produces a different shuffled result)

Usage:
    MONGO_URL=mongodb://root:pass@localhost:27017 uv run --directory db anonymize_catalog.py

Or simply:
    make anonymize-catalog
"""

import os
import random
from pymongo import MongoClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://root:pass@localhost:27017")
COLLECTION = "lung_cancer"

client = MongoClient(MONGO_URL)
db = client["catalog_db"]
collection = db[COLLECTION]

patients = list(collection.find({}))
if not patients:
    print("⚠️  Collection is empty — nothing to anonymize.")
    raise SystemExit(0)

print(f"📋 Found {len(patients)} patients.")


def build_pool(patients, *key_path):
    """Flatten all values at key_path (e.g. ["active_phase", "ground_truth"]) into one list."""
    pool = []
    for p in patients:
        node = p
        for k in key_path:
            node = node.get(k, {}) if isinstance(node, dict) else {}
        if isinstance(node, list):
            pool.extend(node)
    return pool


def redraw(pool, k):
    """Draw k items at random from pool (with replacement)."""
    if not pool or k == 0:
        return []
    return random.choices(pool, k=k)


# ── 1. Build per-field pools ───────────────────────────────────────────────────
pools = {
    "codes":             build_pool(patients, "codes"),
    "ap_gt":             build_pool(patients, "active_phase",    "ground_truth"),
    "ap_pred":           build_pool(patients, "active_phase",    "prediction"),
    "mc_gt":             build_pool(patients, "icd10_multiclass", "ground_truth"),
    "mc_pred":           build_pool(patients, "icd10_multiclass", "prediction"),
    "bin_gt":            build_pool(patients, "icd10_binary",    "ground_truth"),
    "bin_pred":          build_pool(patients, "icd10_binary",    "prediction"),
}

for name, pool in pools.items():
    print(f"🧩 Pool '{name}': {len(pool)} values ({len(set(map(str, pool)))} unique).")

# ── 2. Generate new unique patient IDs ────────────────────────────────────────
new_ids: list[int] = []
used: set[int] = set()
while len(new_ids) < len(patients):
    candidate = random.randint(100_000, 999_999)
    if candidate not in used:
        used.add(candidate)
        new_ids.append(candidate)

random.shuffle(new_ids)

# ── 3. Rebuild documents with shuffled data ────────────────────────────────────
bulk_docs = []
for patient, new_id in zip(patients, new_ids):
    def n(field, *path):
        node = patient
        for k in path:
            node = node.get(k, {}) if isinstance(node, dict) else {}
        return len(node) if isinstance(node, list) else 0

    new_doc = {
        "_id": new_id,
        "active_phase": {
            "ground_truth": redraw(pools["ap_gt"],   n(None, "active_phase", "ground_truth")),
            "prediction":   redraw(pools["ap_pred"],  n(None, "active_phase", "prediction")),
        },
        "icd10_multiclass": {
            "ground_truth": redraw(pools["mc_gt"],   n(None, "icd10_multiclass", "ground_truth")),
            "prediction":   redraw(pools["mc_pred"],  n(None, "icd10_multiclass", "prediction")),
        },
        "icd10_binary": {
            "ground_truth": redraw(pools["bin_gt"],  n(None, "icd10_binary", "ground_truth")),
            "prediction":   redraw(pools["bin_pred"], n(None, "icd10_binary", "prediction")),
        },
        "codes": redraw(pools["codes"], n(None, "codes")),
    }
    bulk_docs.append(new_doc)

collection.delete_many({})
if bulk_docs:
    collection.insert_many(bulk_docs)

print(f"✅ Anonymized {len(bulk_docs)} patients — IDs, codes, and all gt/pred arrays shuffled.")
