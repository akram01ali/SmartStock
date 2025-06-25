import sys
from pathlib import Path
from fastapi import Body
from datetime import datetime
from copy import deepcopy

# Add the prisma directory to Python path
prisma_path = Path(__file__).parent / "prisma"
sys.path.insert(0, str(prisma_path))

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
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
    ComponentUpdate,
    ComponentTree,
    RelationshipCreate
)

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

@app.get("/tree", response_model=ComponentTree)  # Changed to Relationship model
async def get_tree(db: Prisma = Depends(get_db), topName: str = Query(...)):  # Renamed function
    tree = await db.relationships.find_many(
        where={"topComponent": topName},

    )

    result = dict()
    toLookUp = list()

    toLookUp = [element.subComponent for element in tree]
    result[topName] = [[element.subComponent, element.amount] for element in tree]

    while toLookUp:
        current = toLookUp.pop(0)
        if current not in result:
            result[current] = []
            tree = await db.relationships.find_many(
                where={"topComponent": current},
            )
            toLookUp.extend([element.subComponent for element in tree])
            result[current] = [[element.subComponent, element.amount] for element in tree]
    return ComponentTree(tree=result)

@app.get("/components", response_model=Component)
async def get_component(
    componentName: str, db: Prisma = Depends(get_db)
):
    component = await db.components.find_first(where={"componentName": componentName})
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    return component

## POST

@app.post("/components", response_model=Component)
async def create_component(
    component: ComponentCreate = Body(...), 
    db: Prisma = Depends(get_db)
):
    try:
        created = await db.components.create(  
            data={
                **component.dict(),
                "lastScanned": datetime.utcnow()
            }
        )
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
    db: Prisma = Depends(get_db)
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
from prisma.errors import RecordNotFoundError  # Add this import at the top

@app.delete("/components", response_model=Component)
async def delete_component(
    componentName: str,
    db: Prisma = Depends(get_db) 
):
    try:
        component = await db.components.find_unique(
            where={"componentName": componentName}
        )
        if not component:
            raise HTTPException(
                status_code=404,
                detail=f"Component '{componentName}' not found"
            )

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

# Endpoints for Relationships:
## GET
@app.get("/relationships", response_model=Relationship)
async def get_relationship(
    topComponent: str,
    subComponent: str,
    db: Prisma = Depends(get_db)
):
    relationship = await db.relationships.find_unique(
        where={
            "topComponent_subComponent": {
                "topComponent": topComponent,
                "subComponent": subComponent
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
    db: Prisma = Depends(get_db)  
):
    try:
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
    db: Prisma = Depends(get_db)
):
    try:
        deleted = await db.relationships.delete(
            where={
                "topComponent_subComponent": {
                    "topComponent": topComponent,
                    "subComponent": subComponent
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
    db: Prisma = Depends(get_db)
):
    try:
        # Check if relationship exists
        existing = await db.relationships.find_unique(
            where={
                "topComponent_subComponent": {
                    "topComponent": relationship.topComponent,
                    "subComponent": relationship.subComponent
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
                "topComponent_subComponent": {
                    "topComponent": relationship.topComponent,
                    "subComponent": relationship.subComponent
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
