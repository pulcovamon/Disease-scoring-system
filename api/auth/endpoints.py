from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse, Response
from fastapi.security import HTTPBasicCredentials, HTTPAuthorizationCredentials
from fastapi.encoders import jsonable_encoder
from datetime import datetime, timedelta
from typing import Annotated
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

router = APIRouter(prefix="/auth", tags=["Authentication"])

logger = Logger()

@router.post("/user", status_code=201)
async def register_user(data: models.UserCreate):
    existing_user = get_user_by_email(data.email)
    if existing_user:
        raise HTTPException(status_code=403, detail="User with this email already exists!")

    hashed_password, salt = hash_password(data.password)
    new_user = models.User(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        hashed_password=hashed_password.decode(),
        salt=salt,
        is_approved=False,
        role="user"
    )
    for session in get_session():
        session.add(new_user)
        session.commit()
        session.refresh(new_user)

    logger.info(f"Registered new user: {new_user.email}")
    return JSONResponse(status_code=201, content={"user_id": str(new_user.id)})


@router.post("/token", response_model=models.Token)
async def get_token(credentials: Annotated[HTTPBasicCredentials, Depends(http_basic)]):
    user = authenticate(credentials.username, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(user, datetime.utcnow() + timedelta(days=15))
    return models.Token(access_token=access_token)


@router.get("/user/me", response_model=models.UserRead)
def get_current_user(token: str = Depends(JWTBearer())):
    user = verify_jwt(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return models.UserRead.model_validate(user)


@router.get("/user", response_model=models.UserRead)
def admin_get_all_users(token: str = Depends(JWTBearer())):
    user = verify_jwt(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    for session in get_session():
        statement = select(models.User)
        users = session.exec(statement).all()
        users_read = []
        for user in users:
            user_read = models.UserRead.model_validate(user)
            user_read.id = str(user_read.id)
            users_read.append(user_read)
    return JSONResponse(status_code=200, content=jsonable_encoder(users_read))


@router.post("/user/approval")
def admin_approve_user(usedID: models.UserID, token: str = Depends(JWTBearer())):
    user = verify_jwt(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    for session in get_session():
        statement = select(models.User).where(models.User.id == usedID.id)
        user_to_approve = session.exec(statement).one()
        user_to_approve.is_approved = True
        session.add(user_to_approve)
        session.commit()
    return Response(status_code=204)
