import os
import secrets
from datetime import datetime
from typing import Tuple

import bcrypt
import jwt
from fastapi import HTTPException, Request
from fastapi.security import HTTPBasic, HTTPBearer
from sqlmodel import SQLModel, Session, select, create_engine

from api.logger import Logger
from . import models

logger = Logger()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

MYSQL_URL = os.getenv("MYSQL_URL", "mysql+pymysql://root:pass@localhost:3306/scoring_system")
engine = create_engine(MYSQL_URL, echo=True)

http_basic = HTTPBasic()

def get_session():
    return Session(engine, )