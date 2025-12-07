import uuid
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from pydantic import EmailStr
from api.auth.roles import Role, DEFAULT_ROLE


class UserBase(SQLModel):
    first_name: str
    last_name: str
    email: EmailStr
    
class UserCreate(UserBase):
    password: str
    
class User(UserBase ,table=True):
    __tablename__ = "users"
    id: uuid.UUID = Field(default_factory=lambda: uuid.uuid4(), primary_key=True, index=True)
    is_approved: bool
    role: str = Field(default=DEFAULT_ROLE.value)
    
class Auth(SQLModel, table=True):
    __tablename__ = "auth"
    user_id: uuid.UUID = Field(default=None, foreign_key="users.id", primary_key=True)
    hashed_password: str
    salt: bytes
    
class UserID(SQLModel):
    id: uuid.UUID 

class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"

class Patient(SQLModel, table=True):
    __tablename__ = "patients"
    id: int|None = Field(default=None, primary_key=True)
    name: str
    surname: str|None
    user_id: uuid.UUID = Field(default=None, foreign_key="users.id", primary_key=False)
