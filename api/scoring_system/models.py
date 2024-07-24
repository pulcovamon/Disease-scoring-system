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

    codes: list[int]
    model_type: ModelType


class Result(SQLModel, table=True):
    """
    Model for '/{id}' GET method (response body).
    """

    __tablename__ = "results"
    id: int | None = Field(default=None, primary_key=True)
    task_id: str
    disease: str = Field(foreign_key="diseases.id")
    result: float = Field()
    time: datetime = Field()


"""class DiseaseProcedureCode(SQLModel, table=True):
    __tablename__ = "disease_procedure_codes"
    id: int | None = Field(default=None, primary_key=True)
    disease_id = Field(foreign_key="diseases.id")
    procedure_id = Field(foreign_key="procedure.id")

class Result(SQLModel, table=True):
    __tablename__ = "results"
    id: int | None = Field(default=None, primary_key=True)
    disease: str = Field(foreign_key="diseases.id")
    result: float = Field()
    time: datetime = Field()

class LungCancerPatient(SQLModel, table=True):
    __tablename__ = "lung_cancer_patients"
    id: int | None = Field(default=None, primary_key=True)

class Procedure(SQLModel, table=True):
    __tablename__ = "procedures"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field()
    code: str = Field()

class LungCancerPatientProcedureCode(SQLModel, table=True):
    __tablename__ = "lung_cancer_patients_procedure_codes"
    id: int | None = Field(default=None, primary_key=True)
    patient_id = Field(foreign_key="catalog.id")
    procedure_id = Field(foreign_key="procedure.id")

class Disease(SQLModel, table=True):
    __tablename__ = "diseases"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field()
    code: str = Field()"""
