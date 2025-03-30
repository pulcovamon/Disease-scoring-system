"""
Models for ORM and definition of request/response body
"""

from enum import Enum, auto
from typing import Optional

from sqlmodel import Field, SQLModel


class ModelType(Enum):
    """
    ML model can use ordered or unordered data.
    """

    ordered = auto()
    unordered = auto()


class Data(SQLModel):
    """
    Model for '/{disease}' POST method (request body).
    """

    codes: list[str]
    model_type: str

