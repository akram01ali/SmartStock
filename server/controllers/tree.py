from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma

from .auth.auth import get_current_user
from .auth.models import User
from .database import get_db
from models import ComponentTree, TreeNode

router = APIRouter(prefix="/tree", tags=["tree"])

async def build_tree_recursive(component_name: str, db: Prisma, visited: set = None, path: list = None) -> TreeNode:
    """
    Build tree recursively, handling duplicate components correctly.
    
    Args:
        component_name: The component to build tree for
        db: Database connection
        visited: Set of components in current path (for circular reference detection)
        path: Current path from root (for debugging/logging)
    """
    if visited is None:
        visited = set()
    if path is None:
        path = []
    
    # Check for circular references in the current path only
    if component_name in visited:
        # Prevent infinite loops in case of circular relationships
        print(f"Circular reference detected: {' -> '.join(path)} -> {component_name}")
        return TreeNode(name=component_name, amount=0, children=[])
    
    # Add to current path for circular reference detection
    visited.add(component_name)
    path.append(component_name)
    
    # Get all relationships where this component is the top component
    relationships = await db.relationships.find_many(
        where={"topComponent": component_name}
    )
    
    children = []
    for rel in relationships:
        # For each child, create a new visited set that includes current path
        # This allows the same component to appear in different branches
        child_visited = visited.copy()
        child_path = path.copy()
        
        child_node = await build_tree_recursive(rel.subComponent, db, child_visited, child_path)
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
