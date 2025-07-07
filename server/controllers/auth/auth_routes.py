from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from prisma import Prisma

from config import ACCESS_TOKEN_EXPIRE_MINUTES
from ..database import get_db
from models import UserLogin, UserCreate, Token, User as UserModel, CreateAppUser, ReturnUser
from .auth import (
    authenticate_user, 
    authenticate_app_user,
    create_access_token, 
    get_password_hash,
    get_current_user
)
from .models import User

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Prisma = Depends(get_db)):
    """Authenticate user and return access token"""
    user = await authenticate_user(user_data.username, user_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "type": "web_user"}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/app-login", response_model=Token)
async def app_login(name: str, surname: str, password: str, db: Prisma = Depends(get_db)):
    """Authenticate mobile app user and return access token"""
    user = await authenticate_app_user(name, surname, password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.name, "type": "app_user"}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserModel)
async def register(user_data: UserCreate, db: Prisma = Depends(get_db)):
    """Register a new web user"""
    # Check if user already exists
    existing_user = await db.users.find_unique(where={"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    new_user = await db.users.create(
        data={
            "username": user_data.username,
            "password": hashed_password
        }
    )
    
    return UserModel(username=new_user.username)

@router.post("/app-register", response_model=ReturnUser)
async def app_register(user_data: CreateAppUser, db: Prisma = Depends(get_db)):
    """Register a new mobile app user"""
    # Check if user already exists
    existing_user = await db.appuser.find_first(
        where={"name": user_data.name, "surname": user_data.surname}
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already registered"
        )
    
    # Generate initials
    initials = f"{user_data.name[0].upper()}{user_data.surname[0].upper()}"
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    new_user = await db.appuser.create(
        data={
            "name": user_data.name,
            "surname": user_data.surname,
            "initials": initials,
            "password": hashed_password
        }
    )
    
    return ReturnUser(
        name=new_user.name,
        surname=new_user.surname,
        initials=new_user.initials
    )

@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.post("/logout")
async def logout():
    """Logout endpoint (client should discard token)"""
    return {"message": "Successfully logged out"} 