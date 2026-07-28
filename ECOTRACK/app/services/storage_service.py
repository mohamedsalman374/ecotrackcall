import logging
import uuid
import mimetypes
from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

class StorageService:
    BUCKET_NAME = 'profile-images'
    
    @staticmethod
    def upload_image(file_stream, filename, content_type, bucket_name='profile-images', access_token=None, refresh_token=None):
        """
        Uploads a profile image to Supabase Storage and returns the public URL.
        """
        try:
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            # Generate unique filename
            ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            unique_filename = f"{uuid.uuid4()}.{ext}"
            
            # Read file bytes
            file_bytes = file_stream.read()
            
            # Upload to Supabase Storage
            # In a real app we'd pass auth tokens correctly to storage, 
            # supabase-py currently has limited support for RLS with storage uploads via REST without passing the JWT in headers manually.
            # We will rely on the service role key or the client's auth state.
            res = client.storage.from_(bucket_name).upload(
                file=file_bytes,
                path=unique_filename,
                file_options={"content-type": content_type}
            )
            
            # Get public URL
            url = client.storage.from_(bucket_name).get_public_url(unique_filename)
            
            return {"success": True, "url": url, "path": unique_filename}
            
        except Exception as e:
            logger.error(f"Error uploading image to storage: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def remove_image(image_url, bucket_name='profile-images', access_token=None, refresh_token=None):
        """
        Removes an image from Supabase Storage based on its public URL.
        """
        if not image_url:
            return {"success": True}
            
        try:
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            # Extract path from URL (last part after /)
            path = image_url.split('/')[-1]
            
            client.storage.from_(bucket_name).remove([path])
            
            return {"success": True}
            
        except Exception as e:
            logger.error(f"Error removing image from storage: {str(e)}")
            return {"success": False, "error": str(e)}
