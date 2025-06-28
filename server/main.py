import sys
from pathlib import Path
from fastapi import Body
from datetime import datetime, timedelta
from copy import deepcopy

# Add the prisma directory to Python path
prisma_path = Path(__file__).parent / "prisma"
sys.path.insert(0, str(prisma_path))

from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from prisma import Client, Prisma
from prisma.enums import Measures, TypeOfComponent
from typing import List, Optional, Dict, Any
from datetime import datetime
import asyncio
from prisma.errors import RecordNotFoundError
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

# Import Pydantic models
from models import (
    Component,
    ComponentHistory, 
    Relationship,
    ComponentCreate,
    ComponentUpdate,
    ComponentTree,
    RelationshipCreate,
    TreeNode,
    UserLogin,
    UserCreate,
    User,
    Token,
    TokenData
)

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()

app = FastAPI(title="Components Inventory API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

prisma = Client()

async def get_db():
    if not prisma.is_connected():
        await prisma.connect()
    return prisma

# Authentication helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user(username: str, db: Prisma):
    try:
        user = await db.users.find_unique(where={"username": username})
        return user
    except:
        return None

async def authenticate_user(username: str, password: str, db: Prisma):
    user = await get_user(username, db)
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Prisma = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = await get_user(username=token_data.username, db=db)
    if user is None:
        raise credentials_exception
    return user

@app.on_event("startup")
async def startup():
    await prisma.connect()
    print("Connected to Components database")

@app.on_event("shutdown")
async def shutdown():
    await prisma.disconnect()
    print("Disconnected from database")

# Authentication Endpoints
@app.post("/register", response_model=User)
async def register(user: UserCreate, db: Prisma = Depends(get_db)):
    # Check if user already exists
    existing_user = await get_user(user.username, db)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user.password)
    try:
        created_user = await db.users.create(
            data={
                "username": user.username,
                "password": hashed_password
            }
        )
        return User(username=created_user.username)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not create user: {str(e)}"
        )

@app.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Prisma = Depends(get_db)):
    user = await authenticate_user(user_credentials.username, user_credentials.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Endpoints for Components:
## GET
@app.get("/printers", response_model=list[Component])
async def get_printers(db: Prisma = Depends(get_db), current_user: User = Depends(get_current_user)):
    printers = await db.components.find_many(where={"type": TypeOfComponent.printer})
    return printers

@app.get("/groups", response_model=List[Component])
async def get_groups(db: Prisma = Depends(get_db), current_user: User = Depends(get_current_user)):
    groups = await db.components.find_many(where={"type": TypeOfComponent.group})
    return groups

@app.get("/assemblies", response_model=List[Component])
async def get_assemblies(db: Prisma = Depends(get_db), current_user: User = Depends(get_current_user)):
    assemblies = await db.components.find_many(where={"type": TypeOfComponent.assembly})
    return assemblies

@app.get("/tree", response_model=ComponentTree)
async def get_tree(db: Prisma = Depends(get_db), topName: str = Query(...), current_user: User = Depends(get_current_user)):
    # Get all relationships for this root
    relationships = await db.relationships.find_many(
        where={"root": topName}
    )

    if not relationships:
        return ComponentTree(root=topName, nodes=[])

    def build_subtree(parent: str) -> List[TreeNode]:
        children = []
        for rel in relationships:
            if rel.topComponent == parent:
                child_node = TreeNode(
                    name=rel.subComponent,
                    amount=rel.amount,
                    children=build_subtree(rel.subComponent)
                )
                children.append(child_node)
        return children

    # Start with root level components (empty topComponent)
    root_nodes = []
    for rel in relationships:
        if rel.topComponent == "":
            node = TreeNode(
                name=rel.subComponent,
                amount=0,
                children=build_subtree(rel.subComponent)
            )
            root_nodes.append(node)

    return ComponentTree(root=topName, nodes=root_nodes)


@app.get("/components", response_model=Component)
async def get_component(
    componentName: str, db: Prisma = Depends(get_db), current_user: User = Depends(get_current_user)
):
    component = await db.components.find_first(where={"componentName": componentName})
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    return component

@app.get("/all_components", response_model=List[Component])
async def get_all_components(
    db: Prisma = Depends(get_db), current_user: User = Depends(get_current_user)
):
    components = await db.components.find_many()
    if not components:
        raise HTTPException(status_code=404, detail="No components found")
    return components
    
## POST

@app.post("/components", response_model=Component)
async def create_component(
    root: str,
    component: ComponentCreate = Body(...), 
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        existing = await db.components.find_unique(
            where={"componentName": component.componentName}
        )
        
        if existing:
            if root:
                existing_rel = await db.relationships.find_first(
                    where={
                        "AND": [
                            {"topComponent": ""},
                            {"subComponent": component.componentName},
                            {"root": root}
                        ]
                    }
                )
                
                if not existing_rel:
                    await db.relationships.create(
                        data={
                            "topComponent": "",
                            "subComponent": component.componentName,
                            "root": root,
                            "amount": 0
                        }
                    )
                return existing
                
        else:
            created = await db.components.create(  
                data={
                    **component.dict(),
                    "lastScanned": datetime.utcnow()
                }
            )
            
            try:
                if root:
                    await db.relationships.create(
                        data={
                            "topComponent": "",
                            "subComponent": created.componentName,
                            "root": root,
                            "amount": 0
                        }
                    )
            except Exception as rel_error:
                await db.components.delete(
                    where={"componentName": created.componentName}
                )
                raise Exception(f"Failed to create relationship: {str(rel_error)}")
                
            return created
            
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not create component: {str(e)}"
        )
    
'''
Body:
{
    "componentName": "computer",
    "amount": 36.0,
    "measure": "amount",
    "scannedBy": "",
    "durationOfDevelopment": 0,
    "triggerMinAmount": 0.0,
    "supplier": "",
    "cost": 0.0,
    "type": "component",
    "lastScanned": "2025-06-24T11:29:32.663000Z"
}
'''


## PUT
@app.put("/components/{component_name}", response_model=Component)
async def update_component(
    component_name: str,
    component: ComponentUpdate = Body(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # First check if component exists
        existing = await db.components.find_unique(
            where={"componentName": component_name}
        )
        if not existing:
            raise HTTPException(
                status_code=404,
                detail=f"Component '{component_name}' not found"
            )
        
        # Convert to dict and remove None values
        update_data = {
            k: v for k, v in component.dict().items() 
            if v is not None
        }
        
        # Add lastScanned to update data
        update_data["lastScanned"] = datetime.utcnow()

        updated = await db.components.update(
            where={"componentName": component_name},
            data=update_data
        )
        return updated

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not update component: {str(e)}"
        )
    
## DELETE  
@app.delete("/components", response_model=Optional[Component])
async def delete_component(
    componentName: str,
    deleteOutOfDatabase: bool,
    root: Optional[str] = None,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    component = await db.components.find_unique(
                where={"componentName": componentName}
            )
    
    if not component:
        raise HTTPException(
            status_code=404,
            detail=f"Component '{componentName}' not found"
        )
    
    if deleteOutOfDatabase:
        try:
            await db.relationships.delete_many(
                where={
                    "OR": [
                        {"topComponent": componentName},
                        {"subComponent": componentName}
                    ]
                }
            )

            deleted = await db.components.delete(
                where={"componentName": componentName}
            )
            return deleted
        
        except RecordNotFoundError:
            raise HTTPException(
                status_code=404,
                detail=f"Component '{componentName}' not found"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while deleting the component: {str(e)}"
            )
    else:
        try:
            # Make adjustments here:
            await db.relationships.delete_many(
                where={
                    "AND": [
                        {"root": root},  # Fixed syntax
                        {
                            "OR": [
                                {"topComponent": componentName},
                                {"subComponent": componentName}
                            ]
                        }
                    ]
                }
            )
            return component
            
        
        except RecordNotFoundError:
            raise HTTPException(
                status_code=404,
                detail=f"Component '{componentName}' not found"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while marking the component as deleted: {str(e)}"
            )

# Endpoints for Relationships:
## GET
@app.get("/relationships", response_model=Relationship)
async def get_relationship(
    topComponent: str,
    subComponent: str,
    root: str,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    relationship = await db.relationships.find_unique(
        where={
            "topComponent_subComponent_root": {
                "topComponent": topComponent,
                "subComponent": subComponent,
                "root": root
            }
        }
    )
    if not relationship:
        raise HTTPException(status_code=404, detail="Relationship not found")
    return relationship


## POST
@app.post("/relationships", response_model=Relationship)
async def create_relationship(
    relationship: RelationshipCreate = Body(...), 
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Check if the relationship already exists
        existing = await db.relationships.find_first(
            where={
                "AND": [
                    {"topComponent": relationship.topComponent},
                    {"subComponent": relationship.subComponent},
                    {"root": relationship.root}
                ]
            }
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Relationship between '{relationship.topComponent}' and '{relationship.subComponent}' already exists"
            )
        

        # Check if the subComponent is connected to the root
        connectedToRoot = await db.relationships.find_first(
            where={
                "AND": [
                    {"topComponent": ""},
                    {"subComponent": relationship.subComponent},
                    {"root": relationship.root}
                ]
            }
        )

        
        if connectedToRoot:
            updated = await db.relationships.update(
                where={
                    "topComponent_subComponent_root": {
                    "topComponent": "",
                    "subComponent": relationship.subComponent,
                    "root": relationship.root
                }
                },
                data={
                    "topComponent": relationship.topComponent,
                    "amount": int(relationship.amount)
                }
            )
            return updated

        
        # If the component isn't connected to the root, create a new relationship
        created = await db.relationships.create(  
            data={
                **relationship.dict()
            }
        )
        return created
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not create relationship: {str(e)}"
        )

## DELETE
@app.delete("/relationships", response_model=Relationship)
async def delete_relationship(
    topComponent: str,
    subComponent: str,
    root: str,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        deleted = await db.relationships.delete(
            where={
                "topComponent_subComponent_root": {
                    "topComponent": topComponent,
                    "subComponent": subComponent,
                    "root": root
                }
            }
        )
        return deleted
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Could not delete relationship: {str(e)}"
        )
    
## PUT
@app.put("/relationships", response_model=Relationship)
async def update_relationship(
    relationship: RelationshipCreate = Body(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Check if relationship exists
        existing = await db.relationships.find_unique(
            where={
                "topComponent_subComponent_root": {
                    "topComponent": relationship.topComponent,
                    "subComponent": relationship.subComponent, 
                    "root": relationship.root
                }
            }
        )
        
        if not existing:
            raise HTTPException(
                status_code=404,
                detail=f"Relationship between '{relationship.topComponent}' and '{relationship.subComponent}' not found"
            )
        
        # Update the relationship
        updated = await db.relationships.update(
            where={
                "topComponent_subComponent_root": {
                    "topComponent": relationship.topComponent,
                    "subComponent": relationship.subComponent,
                    "root": relationship.root
                }
            },
            data={
                "amount": int(relationship.amount)  # Ensure it's an integer
            }
        )
        
        return updated
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not update relationship: {str(e)}"
        )
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
