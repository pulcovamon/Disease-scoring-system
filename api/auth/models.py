import uuid
from sqlmodel import SQLModel, Field
from typing import Optional
from pydantic import EmailStr


class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=lambda: uuid.uuid4(), primary_key=True, index=True)
    first_name: str
    last_name: str
    email: EmailStr = Field(unique=True, index=True)
    hashed_password: str
    is_approved: bool = Field(default=False)
    role: str = Field(default="user")
    salt: bytes


class UserCreate(SQLModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str


class UserRead(SQLModel):
    id: uuid.UUID 
    first_name: str
    last_name: str
    email: EmailStr
    is_approved: bool
    role: str
    
    
class UserID(SQLModel):
    id: uuid.UUID 


class UserLogin(SQLModel):
    email: EmailStr
    password: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(SQLModel):
    email: Optional[str] = None
