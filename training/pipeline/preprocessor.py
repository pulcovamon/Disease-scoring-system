import joblib
from typing import List


class CodeVocabulary:
    """
    Maps string medical codes to integers. Built from training data only.
    Unknown codes at inference time are mapped to UNK_ID (0) instead of crashing.
    """

    UNK_ID = 0

    def __init__(self):
        self.code_to_id: dict = {}
        self.vocab_size: int = 1  # 1 reserved for UNK

    def fit(self, sequences: List[List[str]]) -> "CodeVocabulary":
        # sorted → deterministic ordering across Python runs
        codes = sorted({code for seq in sequences for code in seq})
        self.code_to_id = {code: i + 1 for i, code in enumerate(codes)}
        self.vocab_size = len(codes) + 1  # +1 for UNK slot
        return self

    def transform(self, sequence: List[str]) -> List[int]:
        return [self.code_to_id.get(code, self.UNK_ID) for code in sequence]

    def save(self, path: str) -> None:
        joblib.dump(self, path)

    @classmethod
    def load(cls, path: str) -> "CodeVocabulary":
        return joblib.load(path)
