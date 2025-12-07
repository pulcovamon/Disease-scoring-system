from typing import Optional
from fastapi import Depends, HTTPException
from bson import ObjectId

from api.auth.security import JWTBearer, verify_jwt
from api.auth.roles import Role
from api.auth.permissions import (
    can_create_model,
    can_run_prediction,
    can_view_model,
)
from api.prediction.utils import models_db as prediction_models_db
from api.auth import models as auth_models


async def get_current_user_optional(token: Optional[str] = Depends(JWTBearer(auto_error=False))) -> Optional[auth_models.User]:
    if not token:
        return None
    return verify_jwt(token)


async def require_authenticated_user(user: auth_models.User = Depends(get_current_user_optional)) -> auth_models.User:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def require_role(required: Role):
    async def dependency(user: auth_models.User = Depends(require_authenticated_user)) -> auth_models.User:
        if str(user.role).lower() != required.value:
            raise HTTPException(status_code=403, detail="Permission denied")
        return user

    return dependency


async def require_admin(user: auth_models.User = Depends(require_authenticated_user)) -> auth_models.User:
    if str(user.role).lower() != Role.ADMIN.value.lower():
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user


async def ensure_can_upload_model(user: auth_models.User = Depends(require_authenticated_user)) -> auth_models.User:
    if not can_create_model(user):
        raise HTTPException(status_code=403, detail="You are not allowed to upload models")
    return user


async def get_model_for_read(model_id: str, user: Optional[auth_models.User] = Depends(get_current_user_optional)):
    try:
        object_id = ObjectId(model_id)
    except Exception:
        object_id = model_id

    model_doc = prediction_models_db.collection.find_one({"$or": [{"_id": object_id}, {"_id": model_id}]})
    if not model_doc:
        raise HTTPException(status_code=404, detail="Model not found")
    if not can_view_model(user, model_doc):
        raise HTTPException(status_code=403, detail="Permission denied to read model")
    return model_doc


async def ensure_can_run_prediction(
    model: dict = Depends(get_model_for_read),
    user: Optional[auth_models.User] = Depends(get_current_user_optional),
):
    if not can_run_prediction(user, model):
        raise HTTPException(status_code=403, detail="Permission denied to run prediction on this model")
    return {"model": model, "user": user}
