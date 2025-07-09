import os
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.core.gcs_service import gcs_service

router = APIRouter()

@router.post("/images")
async def upload_task_images(
    task_name: str = Form(...),
    task_id: int = Form(...),
    variant_id: int = Form(...),
    start_image: UploadFile = File(None),
    end_image: UploadFile = File(None)
):
    """
    Upload start and end configuration images for a task
    """
    uploaded_uris = []
    
    # Validate task name
    if not task_name or not task_name.strip():
        raise HTTPException(status_code=400, detail="Task name is required")
    
    # Sanitize task name for logging
    task_name = task_name.strip()
    print(f"Uploading images for task: {task_name} (ID: {task_id}, Variant ID: {variant_id})")
    
    # Validate that at least one image is provided
    if not start_image and not end_image:
        raise HTTPException(status_code=400, detail="At least one image must be provided")
    
    # Validate file types
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    
    if start_image:
        if start_image.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Start image must be one of: {', '.join(allowed_types)}"
            )
    
    if end_image:
        if end_image.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"End image must be one of: {', '.join(allowed_types)}"
            )
    
    try:
        # Upload start image if provided
        if start_image:
            image_data = await start_image.read()
            file_extension = os.path.splitext(start_image.filename)[1] if start_image.filename else '.jpg'
            filename = gcs_service.generate_filename(task_id, variant_id, 'start', file_extension)
            start_uri = gcs_service.upload_image(image_data, filename, start_image.content_type)
            uploaded_uris.append(start_uri)
        
        # Upload end image if provided
        if end_image:
            image_data = await end_image.read()
            file_extension = os.path.splitext(end_image.filename)[1] if end_image.filename else '.jpg'
            filename = gcs_service.generate_filename(task_id, variant_id, 'end', file_extension)
            end_uri = gcs_service.upload_image(image_data, filename, end_image.content_type)
            uploaded_uris.append(end_uri)
        
        return {
            "message": "Images uploaded successfully",
            "uris": uploaded_uris
        }
        
    except Exception as e:
        print(f"Error uploading images: {str(e)}")  # Log the error for debugging
        raise HTTPException(status_code=500, detail=f"Failed to upload images: {str(e)}")

@router.post("/images/base64")
async def get_images_as_base64(gsutil_uris: List[str]):
    """
    Download images from Google Cloud Storage and return them as base64-encoded data
    """
    try:
        base64_images = []
        for uri in gsutil_uris:
            base64_data = gcs_service.get_image_as_base64(uri)
            base64_images.append(base64_data)
        
        return {
            "images": base64_images
        }
        
    except Exception as e:
        print(f"Error downloading images: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download images: {str(e)}") 