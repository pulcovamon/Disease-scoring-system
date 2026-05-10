import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


class LRClassifier:
    """
    Logistic Regression classifier using a sklearn Pipeline.

    TfidfVectorizer is fitted inside the Pipeline so it never sees test data.
    The saved artifact is a single Pipeline object (vectorizer + model).
    """

    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.pipeline = Pipeline(
            [
                ("tfidf", TfidfVectorizer()),
                ("lr", LogisticRegression(max_iter=1000, random_state=42)),
            ]
        )

    def _to_docs(self, sequences: list) -> list:
        return [" ".join(seq) for seq in sequences]

    def fit(self, sequences: list, labels: list) -> "LRClassifier":
        self.pipeline.fit(self._to_docs(sequences), labels)
        return self

    def predict(self, sequences: list) -> np.ndarray:
        return self.pipeline.predict(self._to_docs(sequences))

    def predict_proba(self, sequences: list) -> np.ndarray:
        return self.pipeline.predict_proba(self._to_docs(sequences))

    def save(self, path: str) -> None:
        joblib.dump(self.pipeline, path)

    @classmethod
    def load(cls, path: str) -> "LRClassifier":
        obj = cls.__new__(cls)
        obj.pipeline = joblib.load(path)
        return obj
