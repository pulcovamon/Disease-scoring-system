from typing import Optional, List, Dict, TypedDict

from sqlmodel import Field, SQLModel


class PatientBase(SQLModel):
    catalog_id: int = Field(index=True)


class PatientDatabase(PatientBase, table=True):
    __tablename__ = "patients"
    id: Optional[int] = Field(default=None, primary_key=True)


class PatientCode(SQLModel, table=True):
    __tablename__ = "codes"
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patients.catalog_id")
    value: str
    index: int


class PatientActivePhase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patients.catalog_id")
    value: bool
    index: int
    prediction: bool


class PatientIcd10Multiclass(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patients.catalog_id")
    value: str
    index: int
    prediction: bool


class PatientIcd10Binary(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patients.catalog_id")
    value: str
    index: int
    prediction: bool


class ActivePhasePublic(TypedDict):
    ground_truth: List[bool]
    prediction: List[bool]


class Icd10MulticlassPublic(TypedDict):
    ground_truth: List[str]
    prediction: List[str]


class Icd10BinaryPublic(TypedDict):
    ground_truth: List[str]
    prediction: List[str]


class PatientPublic(PatientBase):
    codes: List[str]
    active_phase: ActivePhasePublic
    icd10_multiclass: Icd10MulticlassPublic
    icd10_binary: Icd10BinaryPublic