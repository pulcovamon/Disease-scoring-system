import os
import uuid
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse, Response, RedirectResponse
from fastapi.security import HTTPBasicCredentials
from fastapi.encoders import jsonable_encoder
from datetime import datetime, timedelta
from typing import Annotated, List, Optional
from sqlmodel import select

from api.logger import Logger
from api.auth import models
from api.auth.sql_database import get_session
from api.auth.security import (
    hash_password,
    authenticate,
    create_access_token,
    create_oauth_state,
    verify_oauth_state,
    http_basic,
    get_user_by_email,
    JWTBearer,
    verify_jwt
)
from api.auth.roles import Role, DEFAULT_ROLE
from api.auth.permissions import can_list_users
from api.auth.dependencies import require_admin, require_authenticated_user, get_current_user_optional
from api.auth.oauth_config import OAUTH_PROVIDERS

router = APIRouter(prefix="/auth", tags=["Authentication"])

logger = Logger()

@router.post("/user", status_code=201)
async def register_user(data: models.UserCreate):
    existing_user = get_user_by_email(data.email)
    if existing_user:
        raise HTTPException(status_code=403, detail="User with this email already exists!")
    if data.username:
        with get_session() as session:
            existing_username = session.exec(select(models.User).where(models.User.username == data.username)).first()
            if existing_username:
                raise HTTPException(status_code=403, detail="User with this username already exists!")

    hashed_password, salt = hash_password(data.password)
    with get_session() as session:
        session.expire_on_commit = False
        new_user = models.User(
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            username=data.username,
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
    if not credentials.username or not credentials.password or not user:
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


@router.get("/users/count")
def get_users_count():
    with get_session() as session:
        count = len(session.exec(select(models.User)).all())
    return JSONResponse(status_code=200, content={"count": count})


@router.get("/user")
def list_users(current_user=Depends(require_authenticated_user)):
    if not can_list_users(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")

    with get_session() as session:
        statement = select(models.User)
        users = session.exec(statement).all()

    if str(current_user.role).lower() == Role.ADMIN.value.lower():
        sanitized = users
    else:
        sanitized = [
            {
                "id": str(u.id),
                "first_name": u.first_name,
                "last_name": u.last_name,
                "email": u.email,
                "username": u.username,
            }
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


@router.patch("/user/{user_id}/role")
def admin_change_user_role(user_id: uuid.UUID, data: models.UserRoleUpdate, current_user=Depends(require_admin)):
    with get_session() as session:
        statement = select(models.User).where(models.User.id == user_id)
        user = session.exec(statement).one()
        user.role = data.role
        session.add(user)
        session.commit()
    return Response(status_code=204)


@router.get("/oauth/providers")
async def list_oauth_providers():
    return [{"id": k, "name": v.name} for k, v in OAUTH_PROVIDERS.items()]


@router.get("/oauth/{provider}/login")
async def oauth_login(provider: str, lang: str = "en"):
    if provider not in OAUTH_PROVIDERS:
        raise HTTPException(status_code=404, detail="Unknown OAuth provider")
    config = OAUTH_PROVIDERS[provider]
    state = create_oauth_state(provider, lang)
    api_base = os.getenv("API_BASE_URL", "http://localhost:8000")
    redirect_uri = f"{api_base}/api/v1/auth/oauth/{provider}/callback"
    params = urlencode({
        "client_id": config.client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": config.scope,
        "state": state,
    })
    return RedirectResponse(f"{config.authorize_url}?{params}")


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    def fail(lang: str, reason: str):
        return RedirectResponse(f"{frontend_url}/{lang}/oauth/callback?error={reason}")

    if error or not code or not state:
        return fail("en", error or "access_denied")

    if provider not in OAUTH_PROVIDERS:
        return fail("en", "unknown_provider")

    state_payload = verify_oauth_state(state, provider)
    if not state_payload:
        return fail("en", "invalid_state")

    lang = state_payload.get("lang", "en")
    config = OAUTH_PROVIDERS[provider]
    api_base = os.getenv("API_BASE_URL", "http://localhost:8000")
    redirect_uri = f"{api_base}/api/v1/auth/oauth/{provider}/callback"

    async with httpx.AsyncClient() as client:
        token_res = await client.post(config.token_url, data={
            "client_id": config.client_id,
            "client_secret": config.client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }, headers={"Accept": "application/json"})

        if token_res.status_code != 200:
            logger.error(f"OAuth token exchange failed: {token_res.text}")
            return fail(lang, "token_exchange_failed")

        access_token = token_res.json().get("access_token")

        userinfo_res = await client.get(config.userinfo_url, headers={
            "Authorization": f"Bearer {access_token}",
        })

        if userinfo_res.status_code != 200:
            logger.error(f"OAuth userinfo fetch failed: {userinfo_res.text}")
            return fail(lang, "userinfo_failed")

        userinfo = userinfo_res.json()

    provider_user_id = str(
        userinfo.get("sub") or userinfo.get("oid") or userinfo.get("id") or ""
    )
    email = (
        userinfo.get(config.email_field)
        or userinfo.get("email")
        or userinfo.get("preferred_username")
        or ""
    )
    first_name = userinfo.get(config.first_name_field, "")
    last_name = userinfo.get(config.last_name_field, "")
    picture_url = userinfo.get("picture") or userinfo.get("picture_url") or None

    if not email or not provider_user_id:
        return fail(lang, "missing_user_info")

    user = get_user_by_email(email)
    if not user:
        with get_session() as session:
            session.expire_on_commit = False
            user = models.User(
                first_name=first_name,
                last_name=last_name,
                email=email,
                picture_url=picture_url,
                is_approved=False,
                role=DEFAULT_ROLE,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        logger.info(f"Created new user via OAuth ({provider}): {email}")
    elif picture_url and user.picture_url != picture_url:
        with get_session() as session:
            session.expire_on_commit = False
            db_user = session.exec(select(models.User).where(models.User.id == user.id)).one()
            db_user.picture_url = picture_url
            session.add(db_user)
            session.commit()
            session.refresh(db_user)
            user = db_user

    with get_session() as session:
        existing_link = session.exec(
            select(models.OAuthAccount)
            .where(models.OAuthAccount.provider == provider)
            .where(models.OAuthAccount.provider_user_id == provider_user_id)
        ).first()
        if not existing_link:
            session.add(models.OAuthAccount(
                user_id=user.id,
                provider=provider,
                provider_user_id=provider_user_id,
            ))
            session.commit()

    jwt_token = create_access_token(user, datetime.utcnow() + timedelta(days=15))
    return RedirectResponse(f"{frontend_url}/{lang}/oauth/callback?token={jwt_token}")


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
