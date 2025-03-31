# db/load_codes_to_es.py

import time
import os
import pandas as pd
import requests
from elasticsearch import Elasticsearch, helpers

ES_HOST = os.getenv("ES_HOST", "localhost")
ES_PORT = os.getenv("ES_PORT", "9200")
ES_URL = f"http://{ES_HOST}:{ES_PORT}"
INDEX_NAME = os.getenv("ES_INDEX", "medical_codes")
CSV_PATH = os.path.join("db", "data", "codes.csv")
TIMEOUT = 30

def wait_for_es(url: str, timeout: int = 30):
    print(f"⏳ Waiting for Elasticsearch at {url}...")
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = requests.get(url)
            if r.status_code == 200:
                print("✅ Elasticsearch is ready.")
                return
        except requests.ConnectionError:
            pass
        time.sleep(1)
    raise TimeoutError("❌ Could not connect to Elasticsearch.")

def create_index_if_not_exists(es: Elasticsearch, index_name: str):
    if not es.indices.exists(index=index_name):
        print(f"📦 Creating index '{index_name}'...")
        es.indices.create(index=index_name, body={
            "settings": {
                "analysis": {
                    "analyzer": {
                        "czech_fuzzy": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "asciifolding", "czech_stop"]
                        }
                    },
                    "filter": {
                        "czech_stop": {
                            "type": "stop",
                            "stopwords": "_czech_"
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "code": {"type": "keyword"},
                    "name": {
                        "type": "text",
                        "analyzer": "czech_fuzzy"
                    },
                    "specialty": {
                        "type": "text",
                        "analyzer": "czech_fuzzy"
                    }
                }
            }
        })
        print("✅ Index created.")
    else:
        print(f"ℹ️ Index '{index_name}' already exists.")

def index_data(es: Elasticsearch, df: pd.DataFrame):
    df["Odbornost_nazev"] = df["Odbornost_nazev"].fillna("")
    actions = [
        {
            "_index": INDEX_NAME,
            "_source": {
                "code": str(row["Kod"]),
                "name": row["Nazev_vykonu"],
                "specialty": row["Odbornost_nazev"]
            }
        }
        for _, row in df.iterrows()
    ]
    print(f"📥 Indexing {len(actions)} documents...")
    try:
        helpers.bulk(es, actions)
        print("✅ Data indexed.")
    except helpers.BulkIndexError as e:
        print(f"❌ {len(e.errors)} documents failed to index.")
        for err in e.errors[:5]:
            print(err)

if __name__ == "__main__":
    wait_for_es(ES_URL, timeout=TIMEOUT)
    es = Elasticsearch(ES_URL)

    df = pd.read_csv(CSV_PATH)
    create_index_if_not_exists(es, INDEX_NAME)
    index_data(es, df)