import os
import mimetypes
from typing import Optional
from google.cloud import storage
from google.oauth2 import service_account
from app.core.config import settings

class GCSService:
    def __init__(self):
        # Initialize Google Cloud Storage client with service account
        # Try multiple possible locations for the service account file
        possible_paths = [
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'service_account.json'),  # Project root
            '/app/service_account.json',  # Docker container path
            'service_account.json',  # Current directory
        ]
        
        service_account_path = None
        for path in possible_paths:
            if os.path.exists(path):
                service_account_path = path
                print(f"Found service account at: {path}")
                break
        
        if service_account_path:
            credentials = service_account.Credentials.from_service_account_file(service_account_path)
            self.client = storage.Client(credentials=credentials)
            print("Using service account credentials")
        else:
            # Fallback to default credentials (for local development)
            self.client = storage.Client()
            print("Using default credentials")
        
        # Bucket name from settings
        self.bucket_name = settings.GCP_MEDIA_BUCKET_NAME
        print(f"Using bucket: {self.bucket_name}")
        self.bucket = self.client.bucket(self.bucket_name)
    
    def upload_image(self, image_data: bytes, filename: str, content_type: Optional[str] = None) -> str:
        """
        Upload an image to Google Cloud Storage
        
        Args:
            image_data: The image data as bytes
            filename: The filename to use in the bucket
            content_type: The MIME type of the image (optional)
        
        Returns:
            The gsutil URI of the uploaded file
        """
        # Create a blob object
        blob = self.bucket.blob(filename)
        
        # Set content type if provided, otherwise try to detect it
        if content_type:
            blob.content_type = content_type
        else:
            # Try to detect content type from filename
            detected_type, _ = mimetypes.guess_type(filename)
            if detected_type:
                blob.content_type = detected_type
        
        # Upload the image data
        blob.upload_from_string(image_data, content_type=blob.content_type)
        
        # Return the gsutil URI
        return f"gs://{self.bucket_name}/{filename}"
    
    def generate_filename(self, task_id: int, variant_id: int, image_type: str, file_extension: str) -> str:
        """
        Generate a filename for the image based on task ID, variant ID, and type
        
        Args:
            task_id: The ID of the task
            variant_id: The ID of the task variant
            image_type: Either 'start' or 'end'
            file_extension: The file extension (e.g., '.jpg', '.png')
        
        Returns:
            The generated filename
        """
        return f"{task_id}_{variant_id}_{image_type}{file_extension}"

# Global instance
gcs_service = GCSService() 