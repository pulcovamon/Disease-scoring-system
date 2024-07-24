from sqlmodel import Field, SQLModel
from typing import Optional
from enum import Enum, auto

class ModelType(Enum):
    ordered = auto()
    unordered = auto()

class Data(SQLModel):
    codes: list[int]
    model_type: ModelType

'''class DiseaseProcedureCode(SQLModel, table=True):
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
    code: str = Field()'''