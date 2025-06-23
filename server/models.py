import sys
from pathlib import Path

# Add the prisma directory to Python path for Prisma enums
prisma_path = Path(__file__).parent / "prisma"
sys.path.insert(0, str(prisma_path))

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from prisma.enums import Measures, TypeOfComponent


class Component(BaseModel):
    componentName: str
    amount: float
    measure: Measures
    lastScanned: datetime
    scannedBy: str
    durationOfDevelopment: int
    triggerMinAmount: float
    supplier: str
    cost: float
    type: TypeOfComponent

class ComponentHistory(BaseModel):
    componentName: str
    amount: float
    scanned: datetime
    scannedBy: str

class Relationship(BaseModel):
    topComponent: str
    subComponent: str
    amount: int
