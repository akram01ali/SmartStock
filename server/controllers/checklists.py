from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import List, Optional
from models import (
    ControlChecklistTemplate,
    ControlChecklistTemplateCreate,
    ControlChecklistTemplateUpdate,
    ControlChecklist,
    ControlChecklistCreate,
    ControlChecklistUpdate,
    ControlChecklistEntry,
    ControlChecklistEntryUpdate,
)
from prisma import Prisma
from utils.pdf_generator import generate_checklist_pdf

router = APIRouter(prefix="/checklists", tags=["checklists"])

# ==================== TEMPLATES ====================

@router.post("/templates", response_model=ControlChecklistTemplate, status_code=201)
async def create_template(
    template_data: ControlChecklistTemplateCreate,
    db: Prisma = Depends(lambda: Prisma()),
):
    """Create a new control checklist template"""
    try:
        await db.connect()
        
        # Create template
        template = await db.controlchecklisttemplate.create(
            data={
                "name": template_data.name,
                "description": template_data.description,
            }
        )
        
        # Create items for this template
        for item_data in template_data.items:
            await db.controlchecklistitem.create(
                data={
                    "templateId": template.id,
                    "label": item_data.label,
                    "type": item_data.type,
                    "order": item_data.order,
                }
            )
        
        # Fetch complete template with items
        result = await db.controlchecklisttemplate.find_unique(
            where={"id": template.id},
            include={"items": {"order_by": {"order": "asc"}}}
        )
        
        return result
    finally:
        await db.disconnect()


@router.get("/templates", response_model=List[ControlChecklistTemplate])
async def get_templates(db: Prisma = Depends(lambda: Prisma())):
    """Get all control checklist templates"""
    try:
        await db.connect()
        
        templates = await db.controlchecklisttemplate.find_many(
            order=[{"createdAt": "desc"}],
            include={"items": {"order_by": {"order": "asc"}}}
        )
        
        return templates
    finally:
        await db.disconnect()


@router.get("/templates/{template_id}", response_model=ControlChecklistTemplate)
async def get_template(template_id: str, db: Prisma = Depends(lambda: Prisma())):
    """Get a specific template by ID"""
    try:
        await db.connect()
        
        template = await db.controlchecklisttemplate.find_unique(
            where={"id": template_id},
            include={"items": {"order_by": {"order": "asc"}}}
        )
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return template
    finally:
        await db.disconnect()


@router.put("/templates/{template_id}", response_model=ControlChecklistTemplate)
async def update_template(
    template_id: str,
    template_data: ControlChecklistTemplateUpdate,
    db: Prisma = Depends(lambda: Prisma()),
):
    """Update a template"""
    try:
        await db.connect()
        
        # Check if template exists
        existing = await db.controlchecklisttemplate.find_unique(
            where={"id": template_id}
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Update template fields
        update_data = {}
        if template_data.name is not None:
            update_data["name"] = template_data.name
        if template_data.description is not None:
            update_data["description"] = template_data.description
        
        if update_data:
            await db.controlchecklisttemplate.update(
                where={"id": template_id},
                data=update_data
            )
        
        # Update items if provided
        if template_data.items is not None:
            # Delete existing items
            await db.controlchecklistitem.delete_many(
                where={"templateId": template_id}
            )
            
            # Create new items
            for item_data in template_data.items:
                await db.controlchecklistitem.create(
                    data={
                        "templateId": template_id,
                        "label": item_data.label,
                        "type": item_data.type,
                        "order": item_data.order,
                    }
                )
        
        # Fetch updated template
        result = await db.controlchecklisttemplate.find_unique(
            where={"id": template_id},
            include={"items": {"order_by": {"order": "asc"}}}
        )
        
        return result
    finally:
        await db.disconnect()


@router.delete("/templates/{template_id}", status_code=204)
async def delete_template(template_id: str, db: Prisma = Depends(lambda: Prisma())):
    """Delete a template (cascades to items and checklists)"""
    try:
        await db.connect()
        
        # Check if template exists
        existing = await db.controlchecklisttemplate.find_unique(
            where={"id": template_id}
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Template not found")
        
        await db.controlchecklisttemplate.delete(where={"id": template_id})
    finally:
        await db.disconnect()


# ==================== CHECKLISTS ====================

@router.post("", response_model=ControlChecklist, status_code=201)
async def create_checklist(
    checklist_data: ControlChecklistCreate,
    db: Prisma = Depends(lambda: Prisma()),
):
    """Create a new control checklist instance"""
    try:
        await db.connect()
        
        # Verify template exists
        template = await db.controlchecklisttemplate.find_unique(
            where={"id": checklist_data.templateId},
            include={"items": {"order_by": {"order": "asc"}}}
        )
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Create checklist
        checklist = await db.controlchecklist.create(
            data={
                "printerSerialNumber": checklist_data.printerSerialNumber,
                "templateId": checklist_data.templateId,
                "status": "draft",
            }
        )
        
        # Create entries for all template items
        for item in template.items:
            await db.controlchecklistentry.create(
                data={
                    "checklistId": checklist.id,
                    "itemId": item.id,
                    "isChecked": False,
                }
            )
        
        # Fetch complete checklist with entries
        result = await db.controlchecklist.find_unique(
            where={"id": checklist.id},
            include={"entries": True}
        )
        
        return result
    finally:
        await db.disconnect()


@router.get("", response_model=List[ControlChecklist])
async def get_all_checklists(db: Prisma = Depends(lambda: Prisma())):
    """Get all control checklists"""
    try:
        await db.connect()
        
        result = await db.controlchecklist.find_many(
            include={"entries": True, "template": {"include": {"items": {"order_by": {"order": "asc"}}}}},
            order=[{"createdAt": "desc"}]
        )
        
        return result
    finally:
        await db.disconnect()


@router.get("/printer/{serial_number}", response_model=List[ControlChecklist])
async def get_checklists_for_printer(
    serial_number: str,
    db: Prisma = Depends(lambda: Prisma()),
):
    """Get all checklists for a specific printer"""
    try:
        await db.connect()
        
        checklists = await db.controlchecklist.find_many(
            where={"printerSerialNumber": serial_number},
            include={"entries": True, "template": {"include": {"items": {"order_by": {"order": "asc"}}}}},
            order=[{"createdAt": "desc"}]
        )
        
        return checklists
    finally:
        await db.disconnect()


@router.get("/{checklist_id}/pdf")
async def generate_pdf(checklist_id: str, db: Prisma = Depends(lambda: Prisma())):
    """Generate PDF for a specific checklist"""
    try:
        await db.connect()
        
        # Fetch checklist with all relations
        checklist = await db.controlchecklist.find_unique(
            where={"id": checklist_id},
            include={
                "template": {
                    "include": {
                        "items": {"order_by": {"order": "asc"}}
                    }
                },
                "entries": True
            }
        )
        
        if not checklist:
            raise HTTPException(status_code=404, detail="Checklist not found")
        
        # Prepare data for PDF
        checklist_data = {
            "printerSerialNumber": checklist.printerSerialNumber,
            "template": {
                "name": checklist.template.name,
                "description": checklist.template.description,
                "items": [
                    {
                        "id": item.id,
                        "label": item.label,
                        "type": item.type,
                        "order": item.order
                    }
                    for item in checklist.template.items
                ]
            },
            "entries": [
                {
                    "itemId": entry.itemId,
                    "isChecked": entry.isChecked,
                    "value": entry.value,
                    "comment": entry.comment
                }
                for entry in checklist.entries
            ],
            "status": checklist.status,
            "createdAt": checklist.createdAt.isoformat() if checklist.createdAt else None,
            "completedAt": checklist.completedAt.isoformat() if checklist.completedAt else None,
            "shippedAt": checklist.shippedAt.isoformat() if checklist.shippedAt else None,
        }
        
        # Generate PDF
        pdf_buffer = generate_checklist_pdf(checklist_data)
        
        # Return as streaming response
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=checklist_{checklist.printerSerialNumber}.pdf"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.disconnect()


@router.get("/{checklist_id}", response_model=ControlChecklist)
async def get_checklist(checklist_id: str, db: Prisma = Depends(lambda: Prisma())):
    """Get a specific checklist by ID"""
    try:
        await db.connect()
        
        checklist = await db.controlchecklist.find_unique(
            where={"id": checklist_id},
            include={"entries": True, "template": {"include": {"items": {"order_by": {"order": "asc"}}}}}
        )
        
        if not checklist:
            raise HTTPException(status_code=404, detail="Checklist not found")
        
        return checklist
    finally:
        await db.disconnect()


@router.patch("/{checklist_id}/status", response_model=ControlChecklist)
async def update_checklist_status(
    checklist_id: str,
    status_update: dict,
    db: Prisma = Depends(lambda: Prisma()),
):
    """Update checklist status (draft, completed, shipped)"""
    try:
        await db.connect()
        
        # Check if checklist exists
        existing = await db.controlchecklist.find_unique(
            where={"id": checklist_id}
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Checklist not found")
        
        # Update status
        update_data = {"status": status_update.get("status")}
        if status_update.get("status") == "shipped":
            update_data["shippedAt"] = datetime.now(timezone.utc)
        elif status_update.get("status") == "completed":
            update_data["completedAt"] = datetime.now(timezone.utc)
        
        result = await db.controlchecklist.update(
            where={"id": checklist_id},
            data=update_data,
            include={"entries": True, "template": {"include": {"items": {"order_by": {"order": "asc"}}}}}
        )
        
        return result
    finally:
        await db.disconnect()


@router.put("/{checklist_id}", response_model=ControlChecklist)
async def update_checklist(
    checklist_id: str,
    checklist_data: ControlChecklistUpdate,
    db: Prisma = Depends(lambda: Prisma()),
):
    """Update a checklist"""
    try:
        await db.connect()
        
        # Check if checklist exists
        existing = await db.controlchecklist.find_unique(
            where={"id": checklist_id},
            include={"entries": True}
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Checklist not found")
        
        # Update checklist status/timestamps
        update_data = {}
        if checklist_data.status is not None:
            update_data["status"] = checklist_data.status
            if checklist_data.status == "completed" and not existing.completedAt:
                update_data["completedAt"] = datetime.utcnow()
            if checklist_data.status == "shipped":
                update_data["shippedAt"] = checklist_data.shippedAt or datetime.utcnow()
        
        if update_data:
            await db.controlchecklist.update(
                where={"id": checklist_id},
                data=update_data
            )
        
        # Update entries if provided
        if checklist_data.entries is not None:
            for entry_update in checklist_data.entries:
                # Find the entry (we need to match by checklist and item)
                # The entries list should have the itemId
                if hasattr(entry_update, 'itemId'):
                    entry = await db.controlchecklistentry.find_first(
                        where={
                            "checklistId": checklist_id,
                            "itemId": entry_update.itemId
                        }
                    )
                    if entry:
                        update_entry_data = {}
                        if entry_update.isChecked is not None:
                            update_entry_data["isChecked"] = entry_update.isChecked
                        if entry_update.value is not None:
                            update_entry_data["value"] = entry_update.value
                        if entry_update.comment is not None:
                            update_entry_data["comment"] = entry_update.comment
                        
                        if update_entry_data:
                            await db.controlchecklistentry.update(
                                where={"id": entry.id},
                                data=update_entry_data
                            )
        
        # Fetch updated checklist
        result = await db.controlchecklist.find_unique(
            where={"id": checklist_id},
            include={"entries": True, "template": {"include": {"items": {"order_by": {"order": "asc"}}}}}
        )
        
        return result
    finally:
        await db.disconnect()


@router.put("/{checklist_id}/entries/{entry_id}", response_model=ControlChecklistEntry)
async def update_entry(
    checklist_id: str,
    entry_id: str,
    entry_data: ControlChecklistEntryUpdate,
    db: Prisma = Depends(lambda: Prisma()),
):
    """Update a specific entry in a checklist"""
    try:
        await db.connect()
        
        # Verify entry exists and belongs to this checklist
        entry = await db.controlchecklistentry.find_unique(
            where={"id": entry_id}
        )
        if not entry or entry.checklistId != checklist_id:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        # Update entry
        update_data = {}
        if entry_data.isChecked is not None:
            update_data["isChecked"] = entry_data.isChecked
        if entry_data.value is not None:
            update_data["value"] = entry_data.value
        if entry_data.comment is not None:
            update_data["comment"] = entry_data.comment
        
        result = await db.controlchecklistentry.update(
            where={"id": entry_id},
            data=update_data
        )
        
        return result
    finally:
        await db.disconnect()


@router.delete("/{checklist_id}", status_code=204)
async def delete_checklist(checklist_id: str, db: Prisma = Depends(lambda: Prisma())):
    """Delete a checklist"""
    try:
        await db.connect()
        
        # Check if checklist exists
        existing = await db.controlchecklist.find_unique(
            where={"id": checklist_id}
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Checklist not found")
        
        await db.controlchecklist.delete(where={"id": checklist_id})
    finally:
        await db.disconnect()
