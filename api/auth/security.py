import os
import secrets
from datetime import datetime
from typing import Tuple

import bcrypt
import jwt
from fastapi import HTTPException, Request
from fastapi.security import HTTPBasic, HTTPBearer

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import models
from api.auth.sql_database import get_session
from api.logger import Logger

logger = Logger()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

http_basic = HTTPBasic()


class JWTBearer(HTTPBearer):
    """
    JWT token checker.
    Override '__call__' method to make the class callable in endpoints.
    """

    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request):
        token = await super(JWTBearer, self).__call__(request)
        if token:
            if token.scheme != "Bearer":
                raise HTTPException(
                    status_code=401, detail="Invalid authentication scheme!"
                )
            user = verify_jwt(token.credentials)
            if not user:
                raise HTTPException(
                    status_code=401, detail="Invalid or expired token!"
                )
            logger.debug(token.credentials)
            return token.credentials
        else:
            raise HTTPException(
                status_code=401, detail="Invalid authorization code!"
            )


def hash_password(password: str, salt: bytes | None = None) -> Tuple[bytes, bytes]:
    if not salt:
        salt = bcrypt.gensalt()
    return bcrypt.hashpw(str.encode(password), salt), salt


def create_access_token(user: models.User, expiration: datetime) -> str | None:
    to_encode = user.model_dump()
    to_encode.update({"exp": expiration})
    to_encode["id"] = str(to_encode["id"])
    logger.debug(to_encode["id"])
    if "salt" in to_encode:
        to_encode.pop("salt")
    logger.debug(to_encode)
    if not SECRET_KEY:
        logger.error("Cannot obtain secret key!")
        return
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_user_by_email(email: str) -> models.User | None:
    for session in get_session():
        result = session.exec(select(models.User).where(models.User.email == email))
        return result.first()


def authenticate(email: str, password: str):
    user = get_user_by_email(email)
    if not user:
        logger.debug(f"{email} not in db")
        return
    hashed_password, _ = hash_password(password, user.salt)
    if not secrets.compare_digest(
        hashed_password, str.encode(user.hashed_password)
    ):
        logger.debug(f"{hashed_password} is not same as {user.hashed_password}")
        return
    return user


def verify_jwt(token: str):
    if not SECRET_KEY:
        logger.error("Cannot obtain secret key!")
        return
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.debug(payload)
        email = payload.get("email")
        if not email:
            return
        user = get_user_by_email(email)
        logger.debug(user)
        if not user:
            return
    except Exception as e:
        logger.info(e)
        return
    return user

