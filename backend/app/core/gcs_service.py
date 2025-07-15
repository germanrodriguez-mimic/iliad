import os
import mimetypes
from typing import Optional
from google.cloud import storage
from google.oauth2 import service_account
from app.core.config import settings

class GCSService:
    def __init__(self):
        # Initialize Google Cloud Storage client with service account
        service_account_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        
        credentials = service_account.Credentials.from_service_account_file(service_account_path)
        self.client = storage.Client(credentials=credentials)
        print("Using service account credentials")

        
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
    
    def get_image_as_base64(self, gsutil_uri: str) -> str:
        """
        Download an image from Google Cloud Storage and return it as base64-encoded data
        
        Args:
            gsutil_uri: The gsutil URI (e.g., 'gs://bucket-name/filename')
        
        Returns:
            Base64-encoded image data with data URL prefix
        """
        import base64
        
        # Extract filename from gsutil URI
        if gsutil_uri.startswith('gs://'):
            filename = gsutil_uri[5:]  # Remove 'gs://'
            if '/' in filename:
                bucket_name, file_path = filename.split('/', 1)
                
                try:
                    # Get the blob
                    blob = self.bucket.blob(file_path)
                    
                    # Download the image data
                    image_data = blob.download_as_bytes()
                    
                    # Get the content type
                    content_type = blob.content_type or 'image/jpeg'
                    
                    # Encode to base64
                    base64_data = base64.b64encode(image_data).decode('utf-8')
                    
                    # Return as data URL
                    return f"data:{content_type};base64,{base64_data}"
                    
                except Exception as e:
                    print(f"Error downloading image {gsutil_uri}: {str(e)}")
                    return ""
        
        return gsutil_uri  # Return as-is if not a gsutil URI

    def delete_image(self, gsutil_uri: str) -> bool:
        """
        Delete an image from Google Cloud Storage
        
        Args:
            gsutil_uri: The gsutil URI (e.g., 'gs://bucket-name/filename')
        
        Returns:
            True if the image was deleted successfully, False otherwise
        """
        # Extract filename from gsutil URI
        if gsutil_uri.startswith('gs://'):
            filename = gsutil_uri[5:]  # Remove 'gs://'
            if '/' in filename:
                bucket_name, file_path = filename.split('/', 1)
                
                try:
                    # Get the blob
                    blob = self.bucket.blob(file_path)
                    
                    # Delete the blob
                    blob.delete()
                    
                    print(f"Successfully deleted image: {gsutil_uri}")
                    return True
                    
                except Exception as e:
                    print(f"Error deleting image {gsutil_uri}: {str(e)}")
                    return False
        
        return False

# Global instance
gcs_service = GCSService() 