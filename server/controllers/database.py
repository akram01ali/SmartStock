import sys
from pathlib import Path
from prisma import Client
from fastapi import HTTPException

# Add the prisma directory to Python path
prisma_path = Path(__file__).parent / "prisma"
sys.path.insert(0, str(prisma_path))

# Global prisma client instance
prisma = Client()

async def get_db():
    try:
        if not prisma.is_connected():
            await prisma.connect()
        return prisma
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database connection failed")

async def connect_db():
    try:
        await prisma.connect()
        print("✅ Database connected successfully")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        raise

async def disconnect_db():
    try:
        await prisma.disconnect()
        print("✅ Database disconnected successfully")
    except Exception as e:
        print(f"❌ Database disconnection failed: {e}")