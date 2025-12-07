from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse, Response
from fastapi.security import HTTPBasicCredentials
from fastapi.encoders import jsonable_encoder
from datetime import datetime, timedelta
from typing import Annotated, List
from sqlmodel import select

from api.logger import Logger
from api.auth import models
from api.auth.sql_database import get_session
from api.auth.security import (
    hash_password,
    authenticate,
    create_access_token,
    http_basic,
    get_user_by_email,
    JWTBearer,
    verify_jwt
)
from api.auth.roles import Role, DEFAULT_ROLE
from api.auth.permissions import can_list_users
from api.auth.dependencies import require_admin, require_authenticated_user, get_current_user_optional

router = APIRouter(prefix="/auth", tags=["Authentication"])

logger = Logger()

@router.post("/user", status_code=201)
async def register_user(data: models.UserCreate):
    existing_user = get_user_by_email(data.email)
    if existing_user:
        raise HTTPException(status_code=403, detail="User with this email already exists!")

    hashed_password, salt = hash_password(data.password)
    with get_session() as session:
        session.expire_on_commit = False
        new_user = models.User(
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            is_approved=False,
            role=DEFAULT_ROLE
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        login = models.Auth(
            user_id=new_user.id,
            hashed_password=hashed_password.decode(),
            salt=salt
        )
        session.add(login)
        session.commit()
    logger.info(f"Registered new user: {new_user.email}")
    return JSONResponse(status_code=201, content=jsonable_encoder(new_user))


@router.post("/token", response_model=models.Token)
async def get_token(credentials: Annotated[HTTPBasicCredentials, Depends(http_basic)]):
    user = authenticate(credentials.username, credentials.password)
    logger.info(credentials.username)
    if not credentials.username or not credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(user, datetime.utcnow() + timedelta(days=15))
    return models.Token(access_token=access_token)


@router.get("/user/me", response_model=models.User)
def get_current_user(token: str = Depends(JWTBearer())):
    logger.info(token)
    user = verify_jwt(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return models.User.model_validate(user)


@router.get("/user")
def list_users(current_user=Depends(require_authenticated_user)):
    if not can_list_users(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")

    with get_session() as session:
        statement = select(models.User)
        users = session.exec(statement).all()

    if str(current_user.role).lower() == Role.ADMIN.value:
        sanitized = users
    else:
        sanitized = [
            {"first_name": u.first_name, "last_name": u.last_name, "email": u.email}
            for u in users
        ]
    return JSONResponse(status_code=200, content=jsonable_encoder(sanitized))


@router.post("/user/approval")
def admin_approve_user(usedID: models.UserID, current_user=Depends(require_admin)):
    with get_session() as session:
        statement = select(models.User).where(models.User.id == usedID.id)
        user_to_approve = session.exec(statement).one()
        user_to_approve.is_approved = True
        session.add(user_to_approve)
        session.commit()
    return Response(status_code=204)


@router.post("/patient")
def create_patient(patient: models.Patient, current_user=Depends(require_authenticated_user)):
    with get_session() as session:
        session.add(patient)
        session.commit()
        session.refresh(patient)
    return JSONResponse(status_code=201, content=jsonable_encoder(patient))


@router.get("/patient")
def get_all_patients(current_user=Depends(require_authenticated_user)):
    with get_session() as session:
        statement = select(models.Patient).where(models.Patient.user_id == current_user.id)
        patients = session.exec(statement).all()
    return JSONResponse(status_code=201, content=jsonable_encoder(patients))


@router.get("/patient/{id}")
def get_patient_by_id(patient_id: int, current_user=Depends(require_authenticated_user)):
    with get_session() as session:
        statement = select(models.Patient).where(models.Patient.id == patient_id)
        patient = session.exec(statement).one()
        if patient.user_id != current_user.id:
            raise HTTPException(status_code=403, detail=f"Patient with ID {patient_id} does not belog to this user. ")
    return JSONResponse(status_code=201, content=jsonable_encoder(patient))
