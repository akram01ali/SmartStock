from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma

from .auth.auth import get_current_user
from .auth.models import User
from .database import get_db
from models import Relationship, RelationshipCreate, RelationshipRequest

router = APIRouter(prefix="/relationships", tags=["relationships"])

@router.get("/", response_model=Relationship)
async def get_relationship(
    topComponent: str = Query(...),
    subComponent: str = Query(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    relationship = await db.relationships.find_first(
        where={
            "topComponent": topComponent,
            "subComponent": subComponent,
        }
    )
    
    if not relationship:
        raise HTTPException(
            status_code=404,
            detail=f"Relationship between '{topComponent}' and '{subComponent}' not found"
        )
    
    return relationship

@router.post("/", response_model=RelationshipRequest)
async def create_relationship(
    relationship_data: RelationshipCreate,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        source_component = relationship_data.topComponent.split('/')[-1]
        target_component = relationship_data.subComponent.split('/')[-1]

        # First check if the relationship already exists
        existing = await db.relationships.find_first(
            where={
                "topComponent": source_component,
                "subComponent": target_component
            }
        )

        if existing:
            updated = await db.relationships.update(
                where={
                    "topComponent_subComponent": {
                        "topComponent": source_component,
                        "subComponent": target_component
                    }
                },
                data={"amount": relationship_data.amount}
            )

            return updated

        # First check if there is a relationship to the root:
        relation_to_root = await db.relationships.find_first(
            where={
                "topComponent": relationship_data.root,
                "subComponent": target_component,
                "amount": 0
            }
        )

        # If there is a relationship to the root, then severe it
        if relation_to_root:
            await db.relationships.delete(
                where={
                    "topComponent_subComponent": {
                        "topComponent": relationship_data.root,
                        "subComponent": target_component
                    }
                }
            )
        
        # Now, create the relationship
        created = await db.relationships.create(
            data={
                "topComponent": source_component,
                "subComponent": target_component,
                "amount": relationship_data.amount
            }
        )

        return created

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not create relationship: {str(e)}"
        )
    

@router.put("/", response_model=Relationship)
async def update_relationship(
    relationship_data: RelationshipCreate,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        existing = await db.relationships.find_first(
            where={
                "topComponent": relationship_data.topComponent,
                "subComponent": relationship_data.subComponent
            }
        )
        
        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Relationship not found"
            )
        
        updated = await db.relationships.update(
            where={
                "topComponent_subComponent": {
                    "topComponent": relationship_data.topComponent,
                    "subComponent": relationship_data.subComponent
                }
            },
            data={"amount": relationship_data.amount}
        )
        
        return updated
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not update relationship: {str(e)}"
        )

@router.delete("/", response_model=dict)
async def delete_relationship(
    topComponent: str = Query(...),
    subComponent: str = Query(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        root = topComponent.split('/')[0]
        topComponent = topComponent.split('/')[-1]
        subComponent = subComponent.split('/')[-1]

        existing = await db.relationships.find_first(
            where={
                "topComponent": topComponent,
                "subComponent": subComponent
            }
        )
        
        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Relationship not found"
            )
        
        await db.relationships.delete(where={
            "topComponent_subComponent": {
                "topComponent": topComponent,
                "subComponent": subComponent
            }
        })

        await db.relationships.create(
            data={
                "topComponent": root,
                "subComponent": subComponent,
                "amount": 0
            }
        )
        
        return {"message": "Relationship deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not delete relationship: {str(e)}"
        )
