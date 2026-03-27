from typing import Any, Optional

from api.auth.roles import Role


def is_admin(user: Optional[Any]) -> bool:
    return bool(user and str(getattr(user, "role", "")).lower() == Role.ADMIN.value.lower())


def can_create_model(user: Optional[Any]) -> bool:
    if not user:
        return False
    if is_admin(user):
        return True
    role = str(getattr(user, "role", "")).lower()
    approved = bool(getattr(user, "is_approved", False))
    if role == Role.SCIENTIST.value.lower() and approved:
        return True
    return False


def can_view_model(user: Optional[Any], model: dict) -> bool:
    if is_admin(user):
        return True

    owner_id = str(model.get("user")) if model else None
    if owner_id == "default":
        return True
    if model.get("is_public"):
        return True

    if user and owner_id == str(getattr(user, "id", "")):
        return True

    shared_with = model.get("shared_with") or []
    if user and str(getattr(user, "id", "")) in [str(u) for u in shared_with]:
        return True

    return False


def can_modify_model(user: Optional[Any], model: dict) -> bool:
    if not user:
        return False
    if is_admin(user):
        return True
    owner_id = str(model.get("user")) if model else None
    if owner_id == "default":
        return False
    return owner_id == str(getattr(user, "id", ""))


def can_list_users(requesting_user: Optional[Any]) -> bool:
    return is_admin(requesting_user) or str(getattr(requesting_user, "role", "")).lower() in {
        Role.USER.value.lower(),
        Role.SCIENTIST.value.lower(),
    }


def can_view_prediction_history(requesting_user: Optional[Any], owner_id: Optional[str]) -> bool:
    if is_admin(requesting_user):
        return True
    if not requesting_user:
        return False
    return str(getattr(requesting_user, "id", "")) == str(owner_id)


def can_run_prediction(requesting_user: Optional[Any], model: dict) -> bool:
    if not model:
        return False
    if not requesting_user and model.get("user") != "default":
        return False
    if model.get("user") == "default":
        return True
    if is_admin(requesting_user):
        return True
    if requesting_user and str(model.get("user")) == str(getattr(requesting_user, "id", "")):
        return True
    if model.get("is_public") and requesting_user:
        return True
    shared_with = model.get("shared_with") or []
    if requesting_user and str(getattr(requesting_user, "id", "")) in [str(u) for u in shared_with]:
        return True
    return False
