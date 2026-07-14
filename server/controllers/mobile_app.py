from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from fastapi.responses import JSONResponse
import os
import json
import logging
from datetime import datetime, timezone
from .auth.auth import get_current_user
from models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mobile-app", tags=["mobile-app"])

UPLOAD_DIR = "uploads/mobile-app"
METADATA_FILE = os.path.join(UPLOAD_DIR, "metadata.json")
APK_FILENAME = "smartstock.apk"
APK_PATH = os.path.join(UPLOAD_DIR, APK_FILENAME)

os.makedirs(UPLOAD_DIR, exist_ok=True)


def _read_metadata() -> dict | None:
    if not os.path.exists(METADATA_FILE):
        return None
    try:
        with open(METADATA_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return None


def _write_metadata(data: dict):
    with open(METADATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


@router.get("/info")
async def get_mobile_app_info():
    """Return metadata about the current APK (no auth required so the download page is public)."""
    meta = _read_metadata()
    if meta is None or not os.path.exists(APK_PATH):
        return JSONResponse(status_code=404, content={"detail": "No APK uploaded yet"})

    size_bytes = os.path.getsize(APK_PATH)
    return {
        **meta,
        "size_bytes": size_bytes,
        "apk_path": f"/uploads/mobile-app/{APK_FILENAME}",
    }


@router.post("/upload")
async def upload_apk(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a new APK. Replaces the existing one."""
    if not file.filename or not file.filename.lower().endswith(".apk"):
        raise HTTPException(status_code=400, detail="Only .apk files are allowed")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    with open(APK_PATH, "wb") as f:
        f.write(contents)

    meta = {
        "original_filename": file.filename,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "uploaded_by": current_user.username,
    }
    _write_metadata(meta)

    logger.info(f"APK uploaded by {current_user.username}: {file.filename} ({len(contents)} bytes)")

    return {
        **meta,
        "size_bytes": len(contents),
        "apk_path": f"/uploads/mobile-app/{APK_FILENAME}",
    }


@router.delete("/")
async def delete_apk(current_user: User = Depends(get_current_user)):
    """Remove the stored APK."""
    removed = []
    for path in (APK_PATH, METADATA_FILE):
        if os.path.exists(path):
            os.remove(path)
            removed.append(path)
    if not removed:
        raise HTTPException(status_code=404, detail="No APK to delete")
    return {"message": "APK deleted successfully"}
