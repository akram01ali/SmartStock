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
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Implement the logic to calculate the total cost for the component
    try:
        tree = await get_tree(topName=topName, db=db, current_user=current_user)
        
        async def dfs_post_order_cost(node):
            # Visit children first (depth-first)
            children_cost = 0
            for child in node["children"]:
                print(f"Visiting child: {child['name']}")
                child_cost = await dfs_post_order_cost(child)  # Recursive DFS
                children_cost += child_cost * child["amount"]
            print(f"Children cost for {node['name']}: {children_cost}")
            
            # Process current node after children (post-order)
            material_cost = await _get_component_cost(node["name"], db)
            labor_cost = await _get_component_duration(node["name"], db) * hourly_rate
            print(f"Node: {node['name']}, Material Cost: {material_cost}, Labor Cost: {labor_cost}, Children Cost: {children_cost}")
            return children_cost + material_cost + labor_cost

        total_calculated_cost = await dfs_post_order_cost(tree["tree"])
        return {"total_cost": total_calculated_cost}

    except RecordNotFoundError as e: # Catch RecordNotFoundError from _get_component_cost/_get_component_duration
        raise HTTPException(status_code=404, detail=str(e))
    except OSError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not retrieve component tree: {str(e)}"
        )
        



