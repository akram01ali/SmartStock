from fastapi import APIRouter, Body, Depends, HTTPException, Query
from prisma import Prisma
from prisma.enums import TypeOfComponent
from prisma.errors import RecordNotFoundError

from .auth.auth import get_current_user
from .auth.models import User
from .database import get_db
from models import Component, ComponentCreate, ComponentUpdate, ComponentTree, TreeNode, GraphData, Node, NodeData, Edge

from controllers.tree import get_tree



router = APIRouter(prefix="/analytics", tags=["analytics"])


async def _get_component_cost(component_name: str, db: Prisma) -> float:
    try:
        component = await db.components.find_first(
            where={"componentName": component_name}
        )
        if not component:
            raise RecordNotFoundError(f"Component '{component_name}' not found")
        
        return component.cost

    except RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/total-cost", response_model=dict)
async def get_component_total_cost(
    topName: str = Query(...),
    hourly_rate: float= Query(18.5, description="Hourly rate for cost calculation in EUR"),
    amount: float = Query(1.0, description="Amount of the component"),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        tree = await get_tree(topName=topName, db=db, current_user=current_user)
        
        async def dfs_post_order_cost(node):
            # Depth-first
            children_cost = 0.
            for child in node["children"]:
                child_cost = await dfs_post_order_cost(child)  # Recursive DFS
                children_cost += child_cost * child["amount"]
            
            # Process current node after children
            material_cost = await _get_component_cost(node["name"], db)
            labor_cost = await _get_component_duration(node["name"], db) * hourly_rate

            return children_cost + material_cost + labor_cost

        total_calculated_cost = await dfs_post_order_cost(tree["tree"])
        return {"total_cost": total_calculated_cost * amount}

    except RecordNotFoundError as e: # Catch RecordNotFoundError from _get_component_cost/_get_component_duration
        raise HTTPException(status_code=404, detail=str(e))
    except OSError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not retrieve component tree: {str(e)}"
        )

async def _get_component_delivery_duration(component_name: str, db: Prisma) -> float:
    try:
        component = await db.components.find_first(
            where={"componentName": component_name}
        )
        if not component:
            raise RecordNotFoundError(f"Component '{component_name}' not found")
        
        return component.delivery_time or 0.0
    
    except RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

async def _get_component_duration(component_name: str, db: Prisma) -> float:
    try:
        component = await db.components.find_first(
            where={"componentName": component_name}
        )
        if not component:
            raise RecordNotFoundError(f"Component '{component_name}' not found")
        
        return component.durationOfDevelopment
    
    except RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

        
@router.get("/total-duration", response_model=dict)
async def get_component_total_duration(
    topName: str = Query(...),
    amount: float = Query(1.0, description="Amount of the component"),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        tree = await get_tree(topName=topName, db=db, current_user=current_user)
        
        async def dfs_post_order_duration(node):

            # Depth-first
            if not node["children"]:
                delivery_duration = await _get_component_delivery_duration(node["name"], db)
                print(f"Leaf node {node['name']}: delivery={delivery_duration}")
                return 0.0, delivery_duration

            children_manufacturing_duration = 0.0
            max_delivery_duration = 0.0

            for child in node["children"]:
                print(f"Visiting child: {child['name']}")
                child_manufacturing, child_delivery = await dfs_post_order_duration(child)
                
                # Sum manufacturing durations
                children_manufacturing_duration += child_manufacturing * child["amount"]
                
                # Take maximum delivery duration from all descendants
                max_delivery_duration = max(max_delivery_duration, child_delivery)
            
            print(f"Children manufacturing duration for {node['name']}: {children_manufacturing_duration}")
            print(f"Max delivery duration from descendants for {node['name']}: {max_delivery_duration}")
            
            # Add own manufacturing duration
            own_manufacturing_duration = await _get_component_duration(node["name"], db)
            total_manufacturing = children_manufacturing_duration + own_manufacturing_duration
            
            print(f"Parent node {node['name']}: Own manufacturing={own_manufacturing_duration}, Total manufacturing={total_manufacturing}")
            
            return total_manufacturing, max_delivery_duration

        total_manufacturing_duration, max_delivery_duration = await dfs_post_order_duration(tree["tree"])
        return {
            "total_manufacturing_duration": total_manufacturing_duration * amount,
            "max_delivery_duration": max_delivery_duration,
        }
    except RecordNotFoundError as e: # Catch RecordNotFoundError from _get_component_cost/_get_component_duration
        raise HTTPException(status_code=404, detail=str(e))
    except OSError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not retrieve component tree: {str(e)}"
        )


# Compatibility function for main.py direct endpoint
async def get_component_total_cost_detailed(
    topName: str,
    hourly_rate: float,
    db: Prisma,
    current_user
):
    """
    Get detailed cost analytics for a component including material and labor breakdown
    """
    try:
        tree = await get_tree(topName=topName, db=db, current_user=current_user)
        
        total_material_cost = 0.0
        total_labor_cost = 0.0
        total_development_time = 0.0
        
        async def dfs_post_order_cost(node):
            nonlocal total_material_cost, total_labor_cost, total_development_time
            
            # Depth-first traversal
            children_cost = 0.0
            for child in node["children"]:
                child_cost = await dfs_post_order_cost(child)
                children_cost += child_cost * child["amount"]
            
            # Process current node after children
            material_cost = await _get_component_cost(node["name"], db)
            development_time = await _get_component_duration(node["name"], db)
            labor_cost = development_time * hourly_rate
            
            # Add to totals
            total_material_cost += material_cost
            total_labor_cost += labor_cost
            total_development_time += development_time

            return children_cost + material_cost + labor_cost

        total_calculated_cost = await dfs_post_order_cost(tree["tree"])
        
        return {
            "total_cost": total_calculated_cost,
            "material_cost": total_material_cost,
            "labor_cost": total_labor_cost,
            "total_development_time": total_development_time,
            "hourly_rate": hourly_rate,
            "component_name": topName
        }

    except RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not calculate component cost: {str(e)}"
        )

