import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from typing import List


class TfidfPipeline:
    """
    Wraps TfidfVectorizer so fit() and transform() are always called separately.
    Prevents the vectorizer from seeing test documents during IDF computation.
    """

    def __init__(self):
        self.vectorizer = TfidfVectorizer()

    def _to_docs(self, sequences: List[List[str]]) -> List[str]:
        return [" ".join(seq) for seq in sequences]

    def fit(self, sequences: List[List[str]]) -> "TfidfPipeline":
        self.vectorizer.fit(self._to_docs(sequences))
        return self

    def transform(self, sequences: List[List[str]]):
        return self.vectorizer.transform(self._to_docs(sequences))

    def fit_transform(self, sequences: List[List[str]]):
        return self.fit(sequences).transform(sequences)

    def save(self, path: str) -> None:
        joblib.dump(self, path)

    @classmethod
    def load(cls, path: str) -> "TfidfPipeline":
        return joblib.load(path)
