import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.pipeline import Pipeline


class RFClassifier:
    """
    Random Forest classifier using a sklearn Pipeline.

    Fixes over the old script:
    - TfidfVectorizer is inside the Pipeline, so fit() only touches training
      data. No IDF leakage from test sequences.
    - Feature selection uses chi2 test (class-discriminative, sparse-compatible)
      instead of total TF-IDF mass (which picks frequent-but-uninformative codes).
    - TF-IDF values flow directly into the RF (no lossy binary encoding).
    - The entire Pipeline (vectorizer + selector + model) is saved as one
      artifact, so inference is self-contained.
    """

    def __init__(self, n_features: int = 30, n_estimators: int = 100, verbose: bool = False):
        self.verbose = verbose
        self.pipeline = Pipeline(
            [
                ("tfidf", TfidfVectorizer()),
                ("select", SelectKBest(chi2, k=n_features)),
                ("rf", RandomForestClassifier(n_estimators=n_estimators, random_state=42)),
            ]
        )

    def _to_docs(self, sequences: list) -> list:
        return [" ".join(seq) for seq in sequences]

    def fit(self, sequences: list, labels: list) -> "RFClassifier":
        self.pipeline.fit(self._to_docs(sequences), labels)
        return self

    def predict(self, sequences: list) -> np.ndarray:
        return self.pipeline.predict(self._to_docs(sequences))

    def predict_proba(self, sequences: list) -> np.ndarray:
        return self.pipeline.predict_proba(self._to_docs(sequences))

    def save(self, path: str) -> None:
        joblib.dump(self.pipeline, path)

    @classmethod
    def load(cls, path: str) -> "RFClassifier":
        obj = cls.__new__(cls)
        obj.pipeline = joblib.load(path)
        return obj
