import logging
from typing import Dict, Any, Optional
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)


class AuthService:
    """
    Service layer for handling authentication flows, session verification,
    and profile interactions via Supabase Auth and PostgreSQL Row Level Security.
    """

    @staticmethod
    def register_user(email: str, password: str, full_name: str) -> Dict[str, Any]:
        """
        Registers a new user in Supabase Auth.
        Passes full_name so that the database trigger automatically populates public.profiles.
        """
        return SupabaseService.sign_up(email=email, password=password, full_name=full_name)

    @staticmethod
    def login_user(email: str, password: str) -> Dict[str, Any]:
        """
        Logs in a user using Supabase Auth and updates last_login timestamp.
        """
        return SupabaseService.sign_in(email=email, password=password)

    @staticmethod
    def logout_user(access_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Terminates the user session in Supabase Auth.
        """
        return SupabaseService.sign_out(access_token=access_token)

    @staticmethod
    def reset_password_request(email: str, redirect_to: Optional[str] = None) -> Dict[str, Any]:
        """
        Initiates a password reset request via Supabase Auth email service.
        """
        return SupabaseService.send_password_reset(email=email, redirect_to=redirect_to)

    @staticmethod
    def update_password(access_token: str, new_password: str) -> Dict[str, Any]:
        """
        Updates the user's password using the access token from password recovery.
        """
        return SupabaseService.update_password(access_token=access_token, new_password=new_password)

    @staticmethod
    def get_user_profile(user_id: str, access_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves the user profile record from the public.profiles table.
        """
        return SupabaseService.get_profile(user_id=user_id, access_token=access_token)

    @staticmethod
    def ensure_user_profile(user_id: str, email: str, full_name: Optional[str] = None) -> None:
        """
        Safety net to ensure profile exists in public.profiles.
        """
        SupabaseService.ensure_profile_exists(user_id=user_id, full_name=full_name or "", email=email)

    @staticmethod
    def verify_user_token(access_token: str) -> Optional[Any]:
        """
        Verifies that an access token is authentic by fetching user from Supabase.
        """
        return SupabaseService.get_user(access_token=access_token)
