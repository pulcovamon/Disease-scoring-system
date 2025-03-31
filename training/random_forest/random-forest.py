import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

SEQUENCES_FILE = "data/sequences.json"
MODEL_OUTPUT_PATH = "random_forest/random_forest_model.pkl"
TOP_N_FEATURES = 30

with open(SEQUENCES_FILE, "r") as f:
    sequences = json.load(f)

corpus = [" ".join(entry["codes"]) for entry in sequences]
labels = [entry["label"] for entry in sequences]

vectorizer = TfidfVectorizer()
X_tfidf = vectorizer.fit_transform(corpus)
feature_scores = np.asarray(X_tfidf.sum(axis=0)).flatten()
feature_names = np.array(vectorizer.get_feature_names_out())

top_indices = np.argsort(feature_scores)[::-1][:TOP_N_FEATURES]
top_features = feature_names[top_indices]
print(f"Top {TOP_N_FEATURES} codes: {top_features.tolist()}")

def encode_sequence(codes):
    return [1 if feat in codes else 0 for feat in top_features]

X_encoded = np.array([encode_sequence(entry["codes"]) for entry in sequences])
y = np.array(labels)

X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.3, random_state=42)

rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)

rf.features = top_features.tolist()

joblib.dump(rf, MODEL_OUTPUT_PATH)
print(f"✅ Model saved to {MODEL_OUTPUT_PATH}")

y_pred = rf.predict(X_test)
print("\n📊 Classification report:")
print(classification_report(y_test, y_pred))
