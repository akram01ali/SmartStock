from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from prisma import Prisma

from config import SECRET_KEY, ALGORITHM
from ..database import get_db
from .models import User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=168)  # 24 hours fallback
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user(username: str, db: Prisma) -> Optional[dict]:
    """Get user by username"""
    try:
        user = await db.users.find_unique(where={"username": username})
        return user
    except:
        return None

async def authenticate_user(username: str, password: str, db: Prisma):
    """Authenticate user credentials"""
    user = await get_user(username, db)
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user

async def authenticate_app_user(name: str, surname: str, password: str, db: Prisma):
    """Authenticate app user credentials"""
    try:
        user = await db.appuser.find_first(where={"name": name, "surname": surname})
        if not user or not verify_password(password, user.password):
            return False
        return user
    except:
        return False

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Prisma = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_type: str = payload.get("type", "web_user")
        
        if username is None:
            raise credentials_exception
            
        # Handle different user types
        if user_type == "app_user":
            user = await db.appuser.find_first(where={"name": username})
            if user:
                return User(username=user.name, initials=user.initials)
        else:
            user = await db.users.find_unique(where={"username": username})
            if user:
                return User(username=user.username)
                
        raise credentials_exception
            
    except JWTError:
        raise credentials_exception