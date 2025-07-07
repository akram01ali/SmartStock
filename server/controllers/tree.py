from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma

from .auth.auth import get_current_user
from .auth.models import User
from .database import get_db
from models import ComponentTree, TreeNode

router = APIRouter(prefix="/tree", tags=["tree"])

async def build_tree_recursive(component_name: str, db: Prisma, visited: set = None) -> TreeNode:
    if visited is None:
        visited = set()
    
    if component_name in visited:
        # Prevent infinite loops in case of circular relationships
        return TreeNode(name=component_name, amount=0, children=[])
    
    visited.add(component_name)
    
    # Get all relationships where this component is the top component
    relationships = await db.relationships.find_many(
        where={"topComponent": component_name}
    )
    
    children = []
    for rel in relationships:
        child_node = await build_tree_recursive(rel.subComponent, db, visited.copy())
        child_node.amount = rel.amount
        children.append(child_node)
    
    return TreeNode(name=component_name, amount=1, children=children)

@router.get("/", response_model=dict)
async def get_tree(
    topName: str = Query(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Check if the component exists
        component = await db.components.find_first(where={"componentName": topName})
        if not component:
            raise HTTPException(
                status_code=404,
                detail=f"Component '{topName}' not found"
            )
        
        # Build the tree structure
        tree = await build_tree_recursive(topName, db)
        
        return {"tree": tree.dict()}
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not build tree: {str(e)}"
        ) 
