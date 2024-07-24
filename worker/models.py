import time
from random import randint, random
from typing import List


class MLModel:
    def __init__(self): ...
    def __call__(self, data: List[int]) -> float:
        time.sleep(randint(10, 60))
        if randint(0, 100) < 5:
            raise RuntimeError
        return round(random(), 3)


class LungCancer(MLModel):
    model_type = "lung_cancer"


class MultipleSclerosis(MLModel):
    model_type = "multiple_sclerosis"


class HidradentisSupporativa(MLModel):
    model_type = "hidradentis_supporativa"
