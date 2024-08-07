import os
import re
from typing import List, Callable
from functools import wraps

from sqlmodel import Session, create_engine, select, SQLModel

from . import models
from .logger import Logger


logger = Logger.get_instance()


def session_wrapper(function: Callable):
    """
    Wrap method into database session.
    """

    @wraps(function)
    def wrapper(self, *args, **kwargs):
        with Session(self.engine) as session:
            return function(self, session, *args, **kwargs)

    return wrapper


class CatalogDatabase:
    def __init__(self):
        db_url = os.getenv("DB_URL", "mysql+mysqlconnector://root:pass@catalog_db:3306/ScoringSystem")
        if not db_url:
            raise ValueError("DB_URL variable not set")
        self.engine = create_engine(db_url)


    @session_wrapper
    def get_patient_ids(self, session):
        statement = select(models.PatientDatabase)
        return [patient.catalog_id for patient in session.exec(statement)]


    @session_wrapper
    def get_page_of_patients(
        self, session, page_index: int, limit: int
    ) -> List[models.PatientDatabase]:
        statement = (
            select(models.PatientDatabase).offset(page_index * limit).limit(limit)
        )
        return session.exec(statement).all()


    @session_wrapper
    def get_patient_by_id(
        self, session, patient_id: int
    ) -> models.PatientPublic | None:
        statements = select(models.PatientDatabase).where(models.PatientDatabase.catalog_id == patient_id)
        if not session.exec(statements).first():
            return None
        logger.debug(patient_id)
        statement = select(models.PatientCode).where(
            models.PatientCode.patient_id == patient_id
        )
        codes = session.exec(statement).all()
        codes = [code.value for code in codes]

        statement = select(models.PatientActivePhase).where(
            models.PatientActivePhase.patient_id == patient_id
        )
        active_phase = (
            session.exec(statement).all()
        )
        active_phase.sort(key=lambda i: i.index)
        active_phase: models.ActivePhasePublic = {
            "ground_truth": [i.value for i in active_phase if not i.prediction],
            "prediction": [i.value for i in active_phase if i.prediction],
        }

        statement = select(models.PatientIcd10Multiclass).where(
            models.PatientIcd10Multiclass.patient_id == patient_id
        )
        icd10_multiclass = (
            session.exec(statement).all()
        )
        icd10_multiclass.sort(key=lambda i: i.index)
        logger.debug(icd10_multiclass)
        logger.debug([i for i in icd10_multiclass if i.prediction])
        icd10_multiclass: models.Icd10MulticlassPublic = {
            "ground_truth": [i.value for i in icd10_multiclass if not i.prediction],
            "prediction": [i.value for i in icd10_multiclass if i.prediction],
        }

        statement = select(models.PatientIcd10Binary).where(
            models.PatientIcd10Binary.patient_id == patient_id
        )
        icd10_binary = (
            session.exec(statement).all()
        )
        icd10_binary.sort(key=lambda i: i.index)
        icd10_binary: models.Icd10BinaryPublic = {
            "ground_truth": [i.value for i in icd10_binary if not i.prediction],
            "prediction": [i.value for i in icd10_binary if i.prediction],
        }

        return models.PatientPublic(
            catalog_id=patient_id,
            codes=codes,
            active_phase=active_phase,
            icd10_multiclass=icd10_multiclass,
            icd10_binary=icd10_binary,
        )


    @session_wrapper
    def save_into_db(self, session, instance: SQLModel):
        """
        Save instance into database or raise IOError.

        Args:
            instance (SQLModel): instance of child class of SQLModel,
                            which contains data for saving into database

        Raises:
            IOError: if cannot save data into database
        """
        try:
            session.add(instance)
            session.commit()
        except Exception as e:
            session.rollback()
            raise IOError(f"Database operation failed! {e}")
        session.refresh(instance)


    @session_wrapper
    def _parse_line(
        self, session, line: str, current_id: int | None, patient
    ) -> int | None:
        match line:
            case _ if "ID" in line:
                current_id = int("".join([i for i in line if i.isdigit()]))
                self.save_into_db(models.PatientDatabase(catalog_id=current_id))
                patient.append(current_id)

            case _ if "ACTIVE PHASE" in line:
                if current_id:
                    active_phase = [int(i) for i in line if i.isdigit()]
                    patient.append(active_phase)
                    ground_truth = "Ground truth" in line
                    for index, value in enumerate(active_phase):
                        self.save_into_db(
                            models.PatientActivePhase(
                                patient_id=current_id,
                                value=value,
                                index=index,
                                prediction=not ground_truth,
                            ),
                        )

            case _ if "ICD10 MULTICLASS" in line:
                if current_id:
                    multiclass_codes = {"0": 'C340', "1": 'C341', "2": 'C342', "3": 'C343', "4": 'C348', "5": 'C349', "6": 'other'}
                    icd10_values = [
                        re.sub("'|]|\n", "", i)
                        for i in line.split("[")[1].split(" ")
                    ]
                    patient.append(icd10_values)
                    ground_truth = "Ground truth" in line
                    if not ground_truth:
                        icd10_values = [multiclass_codes[i] for i in icd10_values]
                    for index, value in enumerate(icd10_values):
                        self.save_into_db(
                            models.PatientIcd10Multiclass(
                                patient_id=current_id,
                                value=value,
                                index=index,
                                prediction=not ground_truth,
                            ),
                        )

            case _ if "ICD10 BINARY" in line:
                if current_id:
                    binary_codes = {"0": 'other', "1": 'C34'}
                    icd10_values = [
                        re.sub("'|]|\n", "", i)
                        for i in line.split("[")[1].split(" ")
                    ]
                    patient.append(icd10_values)
                    ground_truth = "Ground truth" in line
                    if not ground_truth:
                        icd10_values = [binary_codes[i] for i in icd10_values]
                    for index, value in enumerate(icd10_values):
                        self.save_into_db(
                            models.PatientIcd10Binary(
                                patient_id=current_id,
                                value=value,
                                index=index,
                                prediction=not ground_truth,
                            ),
                        )

            case _ if "Codes" in line:
                if current_id:
                    codes = re.sub("]|'", "", line.split("[")[1]).replace("\n", "").split(" ")
                    patient.append(codes)
                    for index, code in enumerate(codes):
                        self.save_into_db(
                            models.PatientCode(
                                patient_id=current_id,
                                value=code,
                                index=index,
                            ),
                        )

            case _ if line.strip() == "":
                current_id = None
                #logger.debug(patient)
                patient = []
        return current_id, patient

    @session_wrapper
    def fill_database(self, session, file_path: str = os.path.join(os.getcwd(), "patient_catalog", "catalog.txt")):
        current_id = None
        index = 0
        patient = []
        with open(file_path, "r") as catalog:
            for line in catalog:
                current_id, patient = self._parse_line(line, current_id, patient)
                if not current_id and line.strip() != "":
                    logger.debug(line)
                index += 1
                if index > 1000:
                    break


    @session_wrapper
    def reinitialize_db(self, session):
        SQLModel.metadata.drop_all(self.engine)
        SQLModel.metadata.create_all(self.engine)
        self.fill_database()
