from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException, status
from prisma import Prisma
from datetime import datetime
import os
import uuid
import logging
from typing import List, Optional
from models import ComponentManual, ComponentManualCreate
from .database import get_db
from .auth.auth import get_current_user
from models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/manuals", tags=["manuals"])

# Configure upload directory
UPLOAD_DIR = "uploads/manuals"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_extension(filename: str) -> str:
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

@router.post("/{component_name}/upload", response_model=ComponentManual)
async def upload_manual(
    component_name: str,
    file: UploadFile = File(...),
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a manual for a component"""
    try:
        # Verify component exists
        component = await db.components.find_unique(
            where={"componentName": component_name}
        )
        if not component:
            raise HTTPException(
                status_code=404,
                detail=f"Component '{component_name}' not found"
            )
        
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="File name is required"
            )
        
        if not allowed_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Generate unique filename
        file_ext = get_file_extension(file.filename)
        unique_id = str(uuid.uuid4())[:8]
        new_filename = f"{component_name}_{unique_id}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, new_filename)
        
        # Save file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Store in database
        manual = await db.componentmanual.create(
            data={
                "componentName": component_name,
                "fileName": file.filename,
                "fileUrl": f"/uploads/manuals/{new_filename}",
                "fileType": file_ext,
                "uploadedBy": current_user.username,
            }
        )
        
        # Convert to response model
        return ComponentManual(
            id=manual.id,
            componentName=manual.componentName,
            fileName=manual.fileName,
            fileUrl=manual.fileUrl,
            fileType=manual.fileType,
            uploadedAt=manual.uploadedAt,
            uploadedBy=manual.uploadedBy,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading manual: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading manual: {str(e)}"
        )

@router.get("/{component_name}", response_model=List[ComponentManual])
async def get_component_manuals(
    component_name: str,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all manuals for a component"""
    try:
        # Verify component exists
        component = await db.components.find_unique(
            where={"componentName": component_name}
        )
        if not component:
            raise HTTPException(
                status_code=404,
                detail=f"Component '{component_name}' not found"
            )
        
        manuals = await db.componentmanual.find_many(
            where={"componentName": component_name},
            order=[{"uploadedAt": "desc"}]
        )
        
        # Convert to response models
        result = [
            ComponentManual(
                id=m.id,
                componentName=m.componentName,
                fileName=m.fileName,
                fileUrl=m.fileUrl,
                fileType=m.fileType,
                uploadedAt=m.uploadedAt,
                uploadedBy=m.uploadedBy,
            )
            for m in (manuals or [])
        ]
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching manuals: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching manuals: {str(e)}"
        )

@router.delete("/{manual_id}")
async def delete_manual(
    manual_id: str,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a manual"""
    try:
        # Find manual
        manual = await db.componentmanual.find_unique(
            where={"id": manual_id}
        )
        if not manual:
            raise HTTPException(
                status_code=404,
                detail="Manual not found"
            )
        
        # Delete file
        if manual.fileUrl:
            file_path = manual.fileUrl.replace("/", os.sep)
            if file_path.startswith(os.sep):
                file_path = file_path[1:]
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError:
                    pass  # Continue even if file deletion fails
        
        # Delete from database
        deleted = await db.componentmanual.delete(
            where={"id": manual_id}
        )
        
        return {"message": "Manual deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting manual: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting manual: {str(e)}"
        )
