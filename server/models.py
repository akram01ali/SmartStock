from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class Measures(str, Enum):
    centimeters = "centimeters"
    meters = "meters"
    amount = "amount"

class TypeOfComponent(str, Enum):
    printer = "printer"
    group = "group"
    component = "component"

class ComponentCreate(BaseModel):
    componentName: str
    amount: float
    measure: Measures
    scannedBy: str
    durationOfDevelopment: int
    triggerMinAmount: float
    supplier: str
    cost: float
    type: TypeOfComponent

class ComponentUpdate(BaseModel):
    amount: float | None = None
    measure: Measures | None = None
    scannedBy: str | None = None
    durationOfDevelopment: int | None = None
    triggerMinAmount: float | None = None
    supplier: str | None = None
    cost: float | None = None
    type: TypeOfComponent | None = None

class Component(ComponentCreate):
    lastScanned: datetime

    class Config:
        from_attributes = True

class ComponentHistory(BaseModel):
    componentName: str
    amount: float
    scanned: datetime
    scannedBy: str

    class Config:
        from_attributes = True

class RelationshipCreate(BaseModel):
    topComponent: str
    subComponent: str
    amount: int

class Relationship(RelationshipCreate):
    class Config:
        from_attributes = True