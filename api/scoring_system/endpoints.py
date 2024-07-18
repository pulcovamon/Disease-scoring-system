from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from enum import Enum, auto


class ModelType(Enum):
    ordered = auto()
    unordered = auto()


class Data(BaseModel):
    codes: list[int]
    model_type: ModelType


router = APIRouter()


@router.get("/{disease}/{id}")
def get_result(disease: str, id: int):
    match disease:
        case "lung-cancer":
            result = 0.5
        case "multiple-sclerosis":
            result = 0.1
        case "hidradentis-supporativa":
            result = 0.9
        case _:
            return HTTPException(status_code=404, detail=f"Disease {disease} not found.")

    response = {
        "id": result
    }
    return JSONResponse(status_code=200, content=response)


@router.post("/{disease}/")
def predict(
    disease: str, data: Data):
    match disease:
        case "lung-cancer":
            task_id = 3
        case "multiple-sclerosis":
            task_id = 10
        case "hidradentis-supporativa":
            task_id = 15
        case _:
            return HTTPException(status_code=404, detail=f"Disease {disease} not found.")

    response = {
        "id": task_id
    }
    return JSONResponse(status_code=202, content=response)
