import sys
from pathlib import Path

# Add the prisma directory to Python path
prisma_path = Path(__file__).parent / "prisma"
sys.path.insert(0, str(prisma_path))

from fastapi import FastAPI, HTTPException, Depends, Query
from prisma import Client, Prisma
from prisma.enums import Measures, TypeOfComponent
from typing import List, Optional, Dict, Any
from datetime import datetime
import asyncio

# Import Pydantic models
from models import (
    Component,
    ComponentHistory, 
    Relationship,
    ComponentCreate,
    ComponentUpdate
)

app = FastAPI(title="Components Inventory API", version="1.0.0")

prisma = Client()

async def get_db():
    if not prisma.is_connected():
        await prisma.connect()
    return prisma

@app.on_event("startup")
async def startup():
    await prisma.connect()
    print("Connected to Components database")

@app.on_event("shutdown")
async def shutdown():
    await prisma.disconnect()
    print("Disconnected from database")


# Endpoints for Components:
## GET
@app.get("/printers", response_model=list[Component])
async def get_printers(db: Prisma = Depends(get_db)):
    printers = await db.components.find_many(where={"type": TypeOfComponent.printer})
    return printers

@app.get("/groups", response_model=List[Component])
async def get_groups(db: Prisma = Depends(get_db)):
    groups = await db.components.find_many(where={"type": TypeOfComponent.group})
    return groups


    
## POST

## PUT

## DELETE

# Endpoints for Relationships:
## GET

## POST


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
