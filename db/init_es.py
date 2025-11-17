import time
import os
import pandas as pd
import requests
from elasticsearch import Elasticsearch, helpers

ES_HOST = os.getenv("ES_HOST", "localhost")
ES_PORT = os.getenv("ES_PORT", "9200")
ES_URL = f"http://{ES_HOST}:{ES_PORT}"
INDEX_NAME = os.getenv("ES_INDEX", "medical_codes")
ES_COMPAT_VERSION = os.getenv("ES_COMPAT_VERSION", "8")

CODES_CSV = os.path.join("data", "codes.csv")
TFIDF_CSV = os.path.join("data", "code_tfidf_by_label.csv")
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

def index_exists_http(index_name: str) -> bool:
    url = f"{ES_URL}/{index_name}"
    try:
        response = requests.head(url, timeout=5)
    except requests.RequestException as exc:
        raise RuntimeError(f"❌ Failed to check index '{index_name}' existence: {exc}") from exc

    if response.status_code == 200:
        return True
    if response.status_code == 404:
        return False
    raise RuntimeError(f"❌ Unexpected status code {response.status_code} when checking index '{index_name}'")

def create_index_if_not_exists(es: Elasticsearch, index_name: str):
    if not index_exists_http(index_name):
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
                    "name": {"type": "text", "analyzer": "czech_fuzzy"},
                    "specialty": {"type": "text", "analyzer": "czech_fuzzy"},
                    "tfidf_label_0": {"type": "float"},
                    "tfidf_label_1": {"type": "float"},
                    "frequency": {"type": "integer"}
                }
            }
        })
        print("✅ Index created.")
    else:
        print(f"ℹ️ Index '{index_name}' already exists.")

def index_data(es: Elasticsearch, df: pd.DataFrame):
    df["Odbornost_nazev"] = df["Odbornost_nazev"].fillna("")
    df["Nazev_vykonu"] = df["Nazev_vykonu"].fillna("")
    df["tfidf_label_0"] = df["tfidf_label_0"].fillna(0.0)
    df["tfidf_label_1"] = df["tfidf_label_1"].fillna(0.0)
    df["frequency"] = df["frequency"].fillna(0).astype(int)

    actions = [
        {
            "_index": INDEX_NAME,
            "_source": {
                "code": str(row["Kod"]),
                "name": row["Nazev_vykonu"],
                "specialty": row["Odbornost_nazev"],
                "tfidf_label_0": float(row["tfidf_label_0"]),
                "tfidf_label_1": float(row["tfidf_label_1"]),
                "frequency": int(row["frequency"])
            }
        }
        for _, row in df.iterrows()
    ]
    print(f"📥 Indexing {len(actions)} documents...")
    try:
        helpers.bulk(
            es,
            actions,
            chunk_size=200,
            request_timeout=120,
            refresh=False
        )
        print("✅ Data indexed.")
    except helpers.BulkIndexError as e:
        print(f"❌ {len(e.errors)} documents failed to index.")
        for err in e.errors[:5]:
            print(err)

if __name__ == "__main__":
    wait_for_es(ES_URL, timeout=TIMEOUT)
    compat_headers = {
        "Accept": f"application/vnd.elasticsearch+json; compatible-with={ES_COMPAT_VERSION}",
        "Content-Type": f"application/vnd.elasticsearch+json; compatible-with={ES_COMPAT_VERSION}",
    }
    es = Elasticsearch(
        ES_URL,
        request_timeout=60,
        retry_on_timeout=True,
        max_retries=5,
        headers=compat_headers,
    )

    df_codes = pd.read_csv(CODES_CSV)
    df_tfidf = pd.read_csv(TFIDF_CSV)

    df_codes["Kod"] = df_codes["Kod"].astype(str)
    df_tfidf["code"] = df_tfidf["code"].astype(str)

    df_merged = pd.merge(df_codes, df_tfidf, left_on="Kod", right_on="code", how="left").drop(columns=["code"])
    
    create_index_if_not_exists(es, INDEX_NAME)
    index_data(es, df_merged)
