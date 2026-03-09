from fastapi import APIRouter, Depends, HTTPException, status, Query
from prisma import Prisma
from datetime import datetime
from typing import List
from models import LaborProfile, LaborProfileCreate, LaborProfileUpdate
from .database import get_db
from .auth.auth import get_current_user
from models import User

router = APIRouter(prefix="/labor-profiles", tags=["labor-profiles"])

@router.get("/", response_model=List[LaborProfile])
async def get_all_labor_profiles(
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all labor profiles"""
    try:
        profiles = await db.laborprofile.find_many()
        return profiles
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching labor profiles: {str(e)}"
        )

@router.get("/{profile_id}", response_model=LaborProfile)
async def get_labor_profile(
    profile_id: str,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific labor profile"""
    try:
        profile = await db.laborprofile.find_unique(
            where={"id": profile_id}
        )
        if not profile:
            raise HTTPException(
                status_code=404,
                detail=f"Labor profile '{profile_id}' not found"
            )
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching labor profile: {str(e)}"
        )

@router.post("/", response_model=LaborProfile)
async def create_labor_profile(
    profile_data: LaborProfileCreate,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new labor profile"""
    try:
        # Check if profile with same name already exists
        existing = await db.laborprofile.find_unique(
            where={"name": profile_data.name}
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"A labor profile with name '{profile_data.name}' already exists"
            )
        
        # Validate hourly rate
        if profile_data.hourlyRate < 0:
            raise HTTPException(
                status_code=400,
                detail="Hourly rate cannot be negative"
            )
        
        profile = await db.laborprofile.create(
            data={
                "name": profile_data.name,
                "hourlyRate": profile_data.hourlyRate,
                "description": profile_data.description,
            }
        )
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating labor profile: {str(e)}"
        )

@router.put("/{profile_id}", response_model=LaborProfile)
async def update_labor_profile(
    profile_id: str,
    profile_data: LaborProfileUpdate,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a labor profile"""
    try:
        # Check if profile exists
        existing_profile = await db.laborprofile.find_unique(
            where={"id": profile_id}
        )
        if not existing_profile:
            raise HTTPException(
                status_code=404,
                detail=f"Labor profile '{profile_id}' not found"
            )
        
        # If name is being updated, check for duplicates
        if profile_data.name and profile_data.name != existing_profile.name:
            name_exists = await db.laborprofile.find_unique(
                where={"name": profile_data.name}
            )
            if name_exists:
                raise HTTPException(
                    status_code=400,
                    detail=f"A labor profile with name '{profile_data.name}' already exists"
                )
        
        # Validate hourly rate if provided
        if profile_data.hourlyRate is not None and profile_data.hourlyRate < 0:
            raise HTTPException(
                status_code=400,
                detail="Hourly rate cannot be negative"
            )
        
        update_data = {}
        if profile_data.name is not None:
            update_data["name"] = profile_data.name
        if profile_data.hourlyRate is not None:
            update_data["hourlyRate"] = profile_data.hourlyRate
        if profile_data.description is not None:
            update_data["description"] = profile_data.description
        
        profile = await db.laborprofile.update(
            where={"id": profile_id},
            data=update_data
        )
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating labor profile: {str(e)}"
        )

@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_labor_profile(
    profile_id: str,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a labor profile"""
    try:
        # Check if profile exists
        existing_profile = await db.laborprofile.find_unique(
            where={"id": profile_id}
        )
        if not existing_profile:
            raise HTTPException(
                status_code=404,
                detail=f"Labor profile '{profile_id}' not found"
            )
        
        await db.laborprofile.delete(
            where={"id": profile_id}
        )
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting labor profile: {str(e)}"
        )
