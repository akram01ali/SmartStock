from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Dict, List, Tuple, Optional


class NodeData(BaseModel):
    label: str

class Node(BaseModel):
    id: str
    data: NodeData


class Edge(BaseModel):
    id: str
    source: str
    target: str
    type: str = "smoothstep"
    animated: bool = True
    label: Optional[float] = None

class GraphData(BaseModel):
    nodes: list[Node]
    edges: list[Edge]


class Measures(str, Enum):
    centimeters = "centimeters"
    meters = "meters"
    amount = "amount"

class TypeOfComponent(str, Enum):
    printer = "printer"
    group = "group"
    component = "component"
    assembly = "assembly"

# Authentication Models
class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str

class User(BaseModel):
    username: str
    initials: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

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
    description: Optional[str] = None
    image: Optional[str] = None

class ComponentUpdate(BaseModel):
    amount: float | None = None
    measure: Measures | None = None
    scannedBy: str | None = None
    durationOfDevelopment: int | None = None
    triggerMinAmount: float | None = None
    supplier: str | None = None
    cost: float | None = None
    type: TypeOfComponent | None = None
    description: Optional[str] = None
    image: Optional[str] = None

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
    root: str
    amount: float

class RelationshipRequest(BaseModel):
    topComponent: str
    subComponent: str
    amount: float

class Relationship(RelationshipCreate):
    class Config:
        from_attributes = True
        
class TreeNode(BaseModel):
    name: str
    amount: float
    children: List['TreeNode'] = []

class ComponentTree(BaseModel):
    root: str
    nodes: List[TreeNode]

class AppUser(BaseModel):
    name: str
    surname: str
    initials: str
    password: str

class ReturnUser(BaseModel):
    name: str
    surname: str
    initials: str

class CreateAppUser(BaseModel):
    name: str
    surname: str
    password: str

    class Config:
        from_attributes = True

class ReservationRequest(BaseModel):
    topName: str
    amount: float = 1.0
    priority: Optional[int] = None
