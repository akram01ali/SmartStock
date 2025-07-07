import sys
from pathlib import Path
from prisma import Client

# Add the prisma directory to Python path
prisma_path = Path(__file__).parent / "prisma"
sys.path.insert(0, str(prisma_path))

# Global prisma client instance
prisma = Client()

async def get_db():
    """Database dependency for FastAPI"""
    if not prisma.is_connected():
        await prisma.connect()
    return prisma

async def connect_db():
    """Connect to database on startup"""
    await prisma.connect()
    print("Connected to Components database")

async def disconnect_db():
    """Disconnect from database on shutdown"""
    await prisma.disconnect()
    print("Disconnected from database")