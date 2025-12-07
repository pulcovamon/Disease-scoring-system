"""
API endpoints
"""
import json
import os
import io
import pandas as pd
from typing import List

from celery.result import AsyncResult
from fastapi import APIRouter, HTTPException, UploadFile, Query, Depends
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from api.worker import celery_app
from api.prediction.utils import format_task_result, get_all_task_ids, models_db
from api.auth.models import Patient
from api.auth.dependencies import ensure_can_run_prediction, require_admin

class PredictionRequest(BaseModel):
    codes: List[str]
    patient: Patient|int|None

router = APIRouter(prefix="/prediction", tags=["Prediction"])

MODEL_DIR = "/app/models"
TEMPLATE_DIR = os.path.join("api", "templates")
ALLOWED_FORMATS = {"csv", "json"}

@router.get("/result/{id}")
async def get_task_by_id(id: str):
    result = format_task_result(id)
    return JSONResponse(status_code=200, content=result)

@router.get("/result")
async def get_all_results(_: None = Depends(require_admin)):
    results = [format_task_result(tid) for tid in get_all_task_ids()]
    return JSONResponse(status_code=200, content=results)

@router.post("/patient")
async def predict(
    model_id: str,
    data: PredictionRequest,
    context=Depends(ensure_can_run_prediction),
):
    """
    Request a model prediction based on model ID and input code sequence.
    """
    model_doc = context["model"]
    model_path = model_doc.get("path")
    if not model_path or not os.path.isfile(model_path):
        raise HTTPException(status_code=500, detail="Model file is missing on server")

    encoder_path = model_doc.get("encoder")
    if encoder_path and not os.path.isfile(encoder_path):
        encoder_path = None
    
    task = celery_app.send_task("run_model_prediction", args=[model_id, model_path, data.codes, encoder_path])
    return JSONResponse(status_code=202, content={"task_id": task.id})

@router.post("/dataset")
async def predict_dataset(
    model_id: str,
    dataset: UploadFile,
    context=Depends(ensure_can_run_prediction),
):
    """
    Request a model prediction based on model ID and input code sequence.
    """
    model_doc = context["model"]
    model_path = model_doc.get("path")
    if not model_path or not os.path.isfile(model_path):
        raise HTTPException(status_code=500, detail="Model file is missing on server")

    encoder_path = model_doc.get("encoder")
    if encoder_path and not os.path.isfile(encoder_path):
        encoder_path = None
    
    if dataset.content_type == "text/csv":
        content = await dataset.read()
        df = pd.read_csv(io.BytesIO(content))

        if "id" not in df.columns or "codes" not in df.columns:
            raise HTTPException(
                status_code=400,
                detail="CSV must contain 'id' and 'codes' columns!"
            )
        
        data = [
            {"id": row["id"], "codes": row["codes"].split(",")}
            for _, row in df.iterrows()
        ]

    elif dataset.content_type == "application/json":
        content = await dataset.read()
        data = json.loads(content.decode("utf-8"))

        if not all("id" in entry and "codes" in entry for entry in data):
            raise HTTPException(
                status_code=400,
                detail="JSON entries must contain 'id' and 'codes' keys!"
            )

    else:
        raise HTTPException(status_code=400, detail="File must be CSV or JSON!")
    
    task = celery_app.send_task("run_model_prediction", args=[model_id, model_path, data, encoder_path])
    return JSONResponse(status_code=202, content={"task_id": task.id})


@router.get("/template")
def get_template(file_format: str = Query(default="csv", description="Format of the template: csv or json")):
    file_format = file_format.lower()
    if file_format not in ALLOWED_FORMATS:
        raise HTTPException(status_code=400, detail="Only 'csv' and 'json' formats are supported.")

    file_path = os.path.join(TEMPLATE_DIR, f"template.{file_format}")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Template file not found.")

    return FileResponse(file_path, filename=f"template.{file_format}", media_type="application/octet-stream")

    
