from pydantic import BaseModel
from typing import Optional

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str

class User(BaseModel):
    username: str
    initials: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class AppUser(BaseModel):
    name: str
    surname: str
    password: str

class ReturnUser(BaseModel):
    name: str
    surname: str
    initials: str

class CreateAppUser(BaseModel):
    name: str
    surname: str
    password: str

    