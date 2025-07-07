from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from prisma import Prisma
from prisma.enums import TypeOfComponent
from prisma.errors import RecordNotFoundError

from .auth.auth import get_current_user
from .auth.models import User
from .database import get_db
from models import Component, ComponentCreate, ComponentUpdate, ComponentTree, TreeNode, GraphData, Node, NodeData, Edge

router = APIRouter(prefix="/components", tags=["components"])

@router.get("/printers", response_model=List[Component])
async def get_printers(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    printers = await db.components.find_many(where={"type": TypeOfComponent.printer})
    return printers

@router.get("/groups", response_model=List[Component])
async def get_groups(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    groups = await db.components.find_many(where={"type": TypeOfComponent.group})
    return groups

@router.get("/assemblies", response_model=List[Component])
async def get_assemblies(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    assemblies = await db.components.find_many(where={"type": TypeOfComponent.assembly})
    return assemblies

@router.get("/all", response_model=List[Component])
async def get_all_components(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    components = await db.components.find_many()
    return components or []

@router.get("/component/{component_name}", response_model=Component)
async def get_component(
    component_name: str,
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    print(component_name)
    component = await db.components.find_first(where={"componentName": component_name})
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    return component

@router.post("/", response_model=Component)
async def create_component(
    root: str = Query(...),
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
                            {"topComponent": root},
                            {"subComponent": component.componentName}
                        ]
                    }
                )
                
                if not existing_rel:
                    await db.relationships.create(
                        data={
                            "topComponent": root,
                            "subComponent": component.componentName,
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
                if root and root != component.componentName:
                    await db.relationships.create(
                        data={
                            "topComponent": root,
                            "subComponent": created.componentName,
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

@router.put("/{component_name}", response_model=Component)
async def update_component(
    component_name: str,
    component: ComponentUpdate = Body(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        existing = await db.components.find_unique(
            where={"componentName": component_name}
        )
        if not existing:
            raise HTTPException(
                status_code=404,
                detail=f"Component '{component_name}' not found"
            )
        
        update_data = {
            k: v for k, v in component.dict().items() 
            if v is not None
        }
        
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

@router.delete("/", response_model=Optional[Component])
async def delete_component(
    componentName: str,
    deleteOutOfDatabase: bool,
    parent: Optional[str] = None,
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
            await db.relationships.delete(
                where={
                    "topComponent_subComponent": {
                        "topComponent": parent,
                        "subComponent": componentName
                    }
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