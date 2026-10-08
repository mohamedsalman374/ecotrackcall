from supabase import Client
from app.services.supabase_service import SupabaseService

def get_supabase_client() -> Client:
    """
    Creates and returns a Supabase client using the URL and Anon Key.
    Use this for operations that represent an anonymous user or where RLS handles permissions based on the current user session.
    """
    return SupabaseService.get_client()

def get_supabase_service_client() -> Client:
    """
    Creates and returns a Supabase client using the Service Role Key.
    WARNING: This bypasses Row Level Security (RLS). Use only for server-side trusted operations.
    Never expose the service role key to frontend JavaScript.
    """
    return SupabaseService.get_service_client()
