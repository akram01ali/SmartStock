from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from prisma import Prisma
from prisma.enums import TypeOfComponent
from prisma.errors import RecordNotFoundError

from .auth.auth import get_current_user
from .auth.models import User
from .database import get_db
from models import Component, ComponentCreate, ComponentUpdate, ComponentTree, TreeNode, GraphData, Node, NodeData, Edge

# Simple in-memory cache for components
_components_cache = {
    "data": None,
    "timestamp": None,
    "ttl_seconds": 300  # 5 minutes cache
}

def _invalidate_components_cache():
    """Invalidate the components cache"""
    _components_cache["data"] = None
    _components_cache["timestamp"] = None

def _is_cache_valid():
    """Check if the cache is still valid"""
    if _components_cache["data"] is None or _components_cache["timestamp"] is None:
        return False
    
    elapsed = datetime.utcnow() - _components_cache["timestamp"]
    return elapsed.total_seconds() < _components_cache["ttl_seconds"]

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

@router.get("/all-light", response_model=List[dict])
async def get_all_components_light(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Get all components without heavy image data for better performance in list views"""
    # Check cache first
    if _is_cache_valid():
        return _components_cache["data"]
    
    components = await db.components.find_many()
    
    # Use list comprehension for better performance
    light_components = [
        {
            "componentName": component.componentName,
            "amount": component.amount,
            "measure": component.measure,
            "lastScanned": component.lastScanned,
            "scannedBy": component.scannedBy,
            "durationOfDevelopment": component.durationOfDevelopment,
            "triggerMinAmount": component.triggerMinAmount,
            "supplier": component.supplier,
            "cost": component.cost,
            "type": component.type,
            "description": component.description,
            # Explicitly exclude the 'image' field
        }
        for component in components
    ]
    
    # Update cache
    _components_cache["data"] = light_components
    _components_cache["timestamp"] = datetime.utcnow()
    
    return light_components

@router.get("/all-light-paginated", response_model=dict)
async def get_all_components_light_paginated(
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    page_size: int = Query(50, ge=1, le=100, description="Number of items per page (max 100)"),
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Get components without heavy image data with pagination for better performance"""
    # Calculate offset
    offset = (page - 1) * page_size
    
    # Get total count
    total_count = await db.components.count()
    
    # Get paginated components
    components = await db.components.find_many(
        skip=offset,
        take=page_size
    )
    
    # Use list comprehension for better performance
    light_components = [
        {
            "componentName": component.componentName,
            "amount": component.amount,
            "measure": component.measure,
            "lastScanned": component.lastScanned,
            "scannedBy": component.scannedBy,
            "durationOfDevelopment": component.durationOfDevelopment,
            "triggerMinAmount": component.triggerMinAmount,
            "supplier": component.supplier,
            "cost": component.cost,
            "type": component.type,
            "description": component.description,
            # Explicitly exclude the 'image' field
        }
        for component in components
    ]
    
    # Calculate pagination info
    total_pages = (total_count + page_size - 1) // page_size
    has_next = page < total_pages
    has_prev = page > 1
    
    return {
        "data": light_components,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev
        }
    }

@router.get("/search", response_model=dict)
async def search_components_light_paginated(
    q: str = Query(..., description="Search query for component name"),
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    page_size: int = Query(50, ge=1, le=100, description="Number of items per page (max 100)"),
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Search components by name without heavy image data with pagination"""
    # Calculate offset
    offset = (page - 1) * page_size
    
    # Create search filter - case insensitive search
    search_filter = {
        "componentName": {
            "contains": q,
            "mode": "insensitive"
        }
    }
    
    # Get total count for search results
    total_count = await db.components.count(where=search_filter)
    
    # Get paginated search results
    components = await db.components.find_many(
        where=search_filter,
        skip=offset,
        take=page_size
    )
    
    # Use list comprehension for better performance
    light_components = [
        {
            "componentName": component.componentName,
            "amount": component.amount,
            "measure": component.measure,
            "lastScanned": component.lastScanned,
            "scannedBy": component.scannedBy,
            "durationOfDevelopment": component.durationOfDevelopment,
            "triggerMinAmount": component.triggerMinAmount,
            "supplier": component.supplier,
            "cost": component.cost,
            "type": component.type,
            "description": component.description,
            # Explicitly exclude the 'image' field
        }
        for component in components
    ]
    
    # Calculate pagination info
    total_pages = (total_count + page_size - 1) // page_size
    has_next = page < total_pages
    has_prev = page > 1
    
    return {
        "data": light_components,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev
        },
        "search_query": q
    }

@router.get("/component/{component_name}", response_model=Component)
async def get_component(
    component_name: str,
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:
        component = await db.components.find_unique(where={"componentName": component_name})
        if not component:
            raise HTTPException(status_code=404, detail=f"Component '{component_name}' not found")
        return component
    except RecordNotFoundError:
        raise HTTPException(status_code=404, detail=f"Component '{component_name}' not found")

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
            
            # Invalidate cache when component is created
            _invalidate_components_cache()
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
        
        # Invalidate cache when component is updated
        _invalidate_components_cache()
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
            
            # Invalidate cache when component is deleted
            _invalidate_components_cache()
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