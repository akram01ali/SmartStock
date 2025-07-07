from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma

from .auth.auth import get_current_user
from .auth.models import User
from .database import get_db
from .tree import build_tree_recursive
from models import GraphData, Node, NodeData, Edge

router = APIRouter(prefix="/graph", tags=["graph"])

@router.get("/", response_model=dict)
async def get_graph(
    topName: str = Query(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        component = await db.components.find_first(where={"componentName": topName})
        if not component:
            raise HTTPException(
                status_code=404,
                detail=f"Component '{topName}' not found"
            )
        
        tree = await build_tree_recursive(topName, db)
        
        nodes = []
        edges = []
        visited_components = set()
        
        def tree_to_graph(node, path: str = ""):
            current_path = node.name if path == "" else f"{path}/{node.name}"
            
            if current_path not in visited_components:
                visited_components.add(current_path)
                
                nodes.append({
                    "id": current_path,
                    "data": {
                        "label": node.name
                    }
                })
            
            for child in node.children:
                child_path = f"{current_path}/{child.name}"
                
                edges.append({
                    "id": f"{current_path}_{child_path}",
                    "source": current_path,
                    "target": child_path,
                    "type": "smoothstep",
                    "animated": True,
                    "label": float(child.amount)
                })
                
                tree_to_graph(child, current_path)
        
        tree_to_graph(tree)
        
        # Post-processing: Remove edges from root with amount 0
        edges = [edge for edge in edges if not (edge["source"] == topName and edge["label"] == 0.0)]
        
        return {
            "nodes": nodes,
            "edges": edges
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not generate graph data: {str(e)}"
        ) 