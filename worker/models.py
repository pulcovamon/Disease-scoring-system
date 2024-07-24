"""
Simulation of machine learning models.
(proxy for existing models, which I will get in future)
"""
import time
from random import randint, random
from typing import List


class MLModel:
    """
    Base model for all ML models.
    """
    def __init__(self): ...
    def __call__(self, data: List[int]) -> float:
        """
        Simulate computing time and potential failure.
        Generate random result.

        Args:
            data (List[int]): list of examination codes

        Returns:

        """
        time.sleep(randint(10, 60))
        if randint(0, 100) < 5:
            raise RuntimeError
        return round(random(), 3)


class LungCancer(MLModel):
    """
    Proxy for lung cancer model.
    """
    model_type = "lung_cancer"


class MultipleSclerosis(MLModel):
    """
    Proxy for multiple sclerosis model.
    """
    model_type = "multiple_sclerosis"


class HidradentisSupporativa(MLModel):
    """
    Proxy for hidradentis supporativa model.
    """
    model_type = "hidradentis_supporativa"
