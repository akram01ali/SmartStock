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

router = APIRouter(prefix="/components", tags=["components"])

@router.get("/printers", response_model=List[Component])
async def get_printers(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:
        printers = await db.components.find_many(where={"type": TypeOfComponent.printer})
        return printers
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch printers")

@router.get("/groups", response_model=List[Component])
async def get_groups(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:
        groups = await db.components.find_many(where={"type": TypeOfComponent.group})
        return groups
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch groups")

@router.get("/assemblies", response_model=List[Component])
async def get_assemblies(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:
        assemblies = await db.components.find_many(where={"type": TypeOfComponent.assembly})
        return assemblies
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch assemblies")

@router.get("/printers-groups-assemblies", response_model=List[Component])
async def get_printers_groups_assemblies(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Optimized endpoint to get only printers, groups, and assemblies in a single query.
    This is much faster than getting all components or making 3 separate calls.
    """
    try:
        components = await db.components.find_many(
            where={
                "OR": [
                    {"type": TypeOfComponent.printer},
                    {"type": TypeOfComponent.group},
                    {"type": TypeOfComponent.assembly}
                ]
            },
            order=[{"componentName": "asc"}]
        )
        return components or []
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch components")

@router.get("/all", response_model=List[Component])
async def get_all_components(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:
        components = await db.components.find_many()
        return components or []
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch all components")

@router.get("/all-light-paginated", response_model=dict)
async def get_all_components_light_paginated(
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    page_size: int = Query(50, ge=1, le=100, description="Number of items per page (max 100)"),
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
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
    include_images: bool = Query(True, description="Include image field in response"),
    type_filter: Optional[str] = Query(None, description="Filter by component type"),
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Calculate offset
    offset = (page - 1) * page_size
    
    # Create search filter - case insensitive search
    filter_conditions = []
    
    # Search filter
    filter_conditions.append({
        "componentName": {
            "contains": q,
            "mode": "insensitive"
        }
    })
    
    # Type filter
    if type_filter and type_filter.lower() != 'all':
        try:
            # Convert string to enum value
            type_enum = TypeOfComponent(type_filter.lower())
            filter_conditions.append({"type": type_enum})
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid component type '{type_filter}'. Valid types: printer, group, assembly, component"
            )
    
    # Combine all conditions
    search_filter = {"AND": filter_conditions} if len(filter_conditions) > 1 else filter_conditions[0]
    
    # Get total count for search results
    total_count = await db.components.count(where=search_filter)
    
    # Get paginated search results
    components = await db.components.find_many(
        where=search_filter,
        skip=offset,
        take=page_size,
        order={"lastScanned": "desc"}
    )
    
    # Use list comprehension for better performance
    light_components = []
    for component in components:
        component_data = {
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
        }
        
        # Include image field if requested
        if include_images:
            component_data["image"] = component.image
            
        light_components.append(component_data)
    
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
        "search_query": q,
        "include_images": include_images,
        "type_filter": type_filter
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
        # Validation
        if not component.componentName or not component.componentName.strip():
            raise HTTPException(status_code=400, detail="Component name cannot be empty")
        
        if component.amount < 0:
            raise HTTPException(status_code=400, detail="Amount cannot be negative")
            
        if component.cost < 0:
            raise HTTPException(status_code=400, detail="Cost cannot be negative")
            
        if component.triggerMinAmount < 0:
            raise HTTPException(status_code=400, detail="Trigger minimum amount cannot be negative")
        
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

@router.get("/all-with-images-paginated", response_model=dict)
async def get_all_components_with_images_paginated(
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    page_size: int = Query(25, ge=1, le=50, description="Number of items per page (max 50 for images)"),
    include_empty_images: bool = Query(False, description="Include components without images"),
    image_format: str = Query("url", description="Image format: 'url', 'thumbnail'"),
    type_filter: Optional[str] = Query(None, description="Filter by component type"),
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Fast paginated endpoint for components with images.
    Smaller page sizes for better performance with images.
    """
    
    try:
        # Calculate offset
        offset = (page - 1) * page_size
        
        # Build query filter
        where_clause = {}
        filter_conditions = []
        
        # Image filter
        if not include_empty_images:
            filter_conditions.extend([
                {"image": {"not": None}},
                {"image": {"not": ""}}
            ])
        
        # Type filter
        if type_filter and type_filter.lower() != 'all':
            try:
                # Convert string to enum value
                type_enum = TypeOfComponent(type_filter.lower())
                filter_conditions.append({"type": type_enum})
            except ValueError:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid component type '{type_filter}'. Valid types: printer, group, assembly, component"
                )
        
        # Combine all conditions
        if filter_conditions:
            where_clause = {"AND": filter_conditions}
        
        # Get total count
        total_count = await db.components.count(where=where_clause)
        
        # Get paginated components
        components = await db.components.find_many(
            where=where_clause,
            skip=offset,
            take=page_size,
            order={"lastScanned": "desc"}
        )
        
        # Process components with image optimization
        optimized_components = []
        for component in components:
            component_data = {
                "componentName": component.componentName,
                "amount": component.amount,
                "measure": component.measure,
                "lastScanned": component.lastScanned,
                "type": component.type,
                "description": component.description,
                "scannedBy": component.scannedBy,
                "durationOfDevelopment": component.durationOfDevelopment,
                "triggerMinAmount": component.triggerMinAmount,
                "supplier": component.supplier,
                "cost": component.cost,
                "image": component.image if image_format == "url" else f"/thumbnails/{component.image}" if component.image else None
            }
            optimized_components.append(component_data)
        
        # Calculate pagination info
        total_pages = (total_count + page_size - 1) // page_size
        has_next = page < total_pages
        has_prev = page > 1
        
        return {
            "data": optimized_components,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_prev": has_prev
            },
            "image_format": image_format,
            "type_filter": type_filter
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching paginated components with images: {str(e)}"
        )

@router.get("/statistics", response_model=dict)
async def get_components_statistics(
    q: Optional[str] = Query(None, description="Search query for component name"),
    type_filter: Optional[str] = Query(None, description="Filter by component type"),
    include_empty_images: bool = Query(True, description="Include components without images"),
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics for components with optional filtering.
    Returns total count, low stock count, and total value.
    """
    
    try:
        # Build query filter
        filter_conditions = []
        
        # Search filter
        if q:
            filter_conditions.append({
                "componentName": {
                    "contains": q,
                    "mode": "insensitive"
                }
            })
        
        # Type filter
        if type_filter and type_filter.lower() != 'all':
            try:
                # Convert string to enum value
                type_enum = TypeOfComponent(type_filter.lower())
                filter_conditions.append({"type": type_enum})
            except ValueError:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid component type '{type_filter}'. Valid types: printer, group, assembly, component"
                )
        
        # Image filter
        if not include_empty_images:
            filter_conditions.extend([
                {"image": {"not": None}},
                {"image": {"not": ""}}
            ])
        
        # Combine all conditions
        where_clause = {}
        if filter_conditions:
            where_clause = {"AND": filter_conditions} if len(filter_conditions) > 1 else filter_conditions[0]
        
        # Get all components matching the filter
        components = await db.components.find_many(where=where_clause)
        
        # Calculate statistics
        total_count = len(components)
        low_stock_count = 0
        total_value = 0.0
        
        for component in components:
            # Check for low stock
            if component.amount < component.triggerMinAmount:
                low_stock_count += 1
            
            # Add to total value
            total_value += component.cost * component.amount
        
        return {
            "total_count": total_count,
            "low_stock_count": low_stock_count,
            "total_value": round(total_value, 2),
            "filters": {
                "search_query": q,
                "type_filter": type_filter,
                "include_empty_images": include_empty_images
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching component statistics: {str(e)}"
        )
    
@router.get("/low-stock", response_model=List[Component])
async def get_low_stock_components(
    db: Prisma = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:

        low_stock_components = await db.query_raw(
            """
            SELECT "componentName", amount, measure, "lastScanned", "scannedBy", 
                   "durationOfDevelopment", "triggerMinAmount", supplier, cost, 
                   type, description, image
            FROM "Components" 
            WHERE amount < "triggerMinAmount"
            ORDER BY "componentName" ASC
            """,
            model=Component
        )
        
        return low_stock_components
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching low stock components: {str(e)}"
        )