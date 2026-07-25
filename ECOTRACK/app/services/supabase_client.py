from supabase import create_client, Client
from app.config import Config
import logging

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """
    Creates and returns a Supabase client using the URL and Anon Key.
    Use this for operations that represent an anonymous user or where RLS handles permissions based on the current user session.
    However, since we are doing server-side auth, we often need to manage the session explicitly or use the service role key for administrative tasks (like creating public.users record).
    """
    url = Config.SUPABASE_URL
    key = Config.SUPABASE_ANON_KEY or Config.SUPABASE_KEY # Fallback if only SUPABASE_KEY is provided
    
    if not url or not key:
        logger.error("Supabase URL or Key is missing. Check your environment variables.")
        raise ValueError("Missing Supabase configuration.")
        
    return create_client(url, key)

def get_supabase_service_client() -> Client:
    """
    Creates and returns a Supabase client using the Service Role Key.
    WARNING: This bypasses Row Level Security (RLS). Use only for server-side trusted operations
    (e.g., creating a record in public.users when a user registers).
    """
    url = Config.SUPABASE_URL
    key = Config.SUPABASE_SERVICE_ROLE_KEY
    
    if not url or not key:
        logger.error("Supabase Service Role Key is missing. Falling back to Anon key if available, but admin operations may fail.")
        # Fallback to anon key but warn
        return get_supabase_client()
        
    return create_client(url, key)
