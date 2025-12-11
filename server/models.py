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

class ComponentName(BaseModel):
    componentName: str
    type: TypeOfComponent

class ComponentNameOnly(BaseModel):
    componentName: str

class ComponentCreate(BaseModel):
    componentName: str
    amount: float
    measure: Measures
    scannedBy: str
    durationOfDevelopment: float
    triggerMinAmount: float
    supplier: str
    cost: float
    type: TypeOfComponent
    description: Optional[str] = None
    image: Optional[str] = None
    location: Optional[float] = None

class ComponentUpdate(BaseModel):
    newComponentName: Optional[str] = None
    amount: float | None = None
    measure: Measures | None = None
    scannedBy: str | None = None
    durationOfDevelopment: float | None = None
    triggerMinAmount: float | None = None
    supplier: str | None = None
    cost: float | None = None
    type: TypeOfComponent | None = None
    description: Optional[str] = None
    image: Optional[str] = None
    location: Optional[float] = None

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

class ComponentManual(BaseModel):
    id: str
    componentName: str
    fileName: str
    fileUrl: str
    fileType: str
    uploadedAt: datetime
    uploadedBy: str

    class Config:
        from_attributes = True

class ComponentManualCreate(BaseModel):
    fileName: str
    fileUrl: str
    fileType: str
    uploadedBy: str

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

    class Config:
        from_attributes = True

# Control Checklist Models
class ControlChecklistItemCreate(BaseModel):
    label: str
    type: str  # 'test' or 'control'
    order: int

class ControlChecklistItemUpdate(BaseModel):
    label: Optional[str] = None
    type: Optional[str] = None
    order: Optional[int] = None

class ControlChecklistItem(BaseModel):
    id: str
    templateId: str
    label: str
    type: str
    order: int
    createdAt: datetime

    class Config:
        from_attributes = True

class ControlChecklistTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    items: List[ControlChecklistItemCreate] = []

class ControlChecklistTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    items: Optional[List[ControlChecklistItemCreate]] = None

class ControlChecklistTemplate(BaseModel):
    id: str
    name: str
    description: Optional[str]
    createdAt: datetime
    updatedAt: datetime
    items: List[ControlChecklistItem] = []

    class Config:
        from_attributes = True

class ControlChecklistEntryCreate(BaseModel):
    itemId: str
    isChecked: bool = False
    value: Optional[str] = None
    comment: Optional[str] = None

class ControlChecklistEntryUpdate(BaseModel):
    isChecked: Optional[bool] = None
    value: Optional[str] = None
    comment: Optional[str] = None

class ControlChecklistEntry(BaseModel):
    id: str
    checklistId: str
    itemId: str
    isChecked: bool
    value: Optional[str]
    comment: Optional[str]

    class Config:
        from_attributes = True

class ControlChecklistCreate(BaseModel):
    printerSerialNumber: str
    templateId: str
    entries: Optional[List[ControlChecklistEntryCreate]] = []

class ControlChecklistUpdate(BaseModel):
    status: Optional[str] = None
    shippedAt: Optional[datetime] = None
    entries: Optional[List[ControlChecklistEntryUpdate]] = None

class ControlChecklist(BaseModel):
    id: str
    printerSerialNumber: str
    templateId: str
    status: str
    shippedAt: Optional[datetime]
    createdAt: datetime
    completedAt: Optional[datetime]
    entries: List[ControlChecklistEntry] = []

    class Config:
        from_attributes = True
    