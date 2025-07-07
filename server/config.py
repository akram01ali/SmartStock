import os
from datetime import timedelta

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# CORS Configuration
CORS_ORIGINS = ["*"]  # Change this in production!
CORS_CREDENTIALS = True
CORS_METHODS = ["*"]
CORS_HEADERS = ["*"]

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "")

# App Configuration
APP_TITLE = "Components Inventory API"
APP_VERSION = "1.0.0"
HOST = "0.0.0.0"
PORT = 8000