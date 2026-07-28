import logging
from app.services.supabase_client import get_supabase_client, get_supabase_service_client
from supabase_auth.errors import AuthApiError
import re

logger = logging.getLogger(__name__)

class ProfileService:
    @staticmethod
    def update_profile(user_id, profile_data, access_token=None, refresh_token=None):
        """
        Updates the user profile in the database.
        """
        try:
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            # Filter out email since that is handled separately via Auth API if it changes
            # But we update it here just to keep the public.users table in sync if auth succeeded
            
            response = client.table('users').update(profile_data).eq('id', user_id).execute()
            
            return {"success": True, "data": response.data}
            
        except Exception as e:
            logger.error(f"Error updating profile: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def update_email(user_id, new_email, access_token=None, refresh_token=None):
        """
        Updates the user's email via Supabase Auth API.
        This usually requires email confirmation on both old and new emails depending on Supabase settings.
        """
        try:
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            # Call Supabase Auth to update the email
            response = client.auth.update_user({"email": new_email})
            
            return {"success": True, "message": "Email update initiated. Please check your inbox for confirmation."}
            
        except AuthApiError as e:
            logger.error(f"Error updating email: {e.message}")
            return {"success": False, "error": e.message}
        except Exception as e:
            logger.error(f"Error updating email: {str(e)}")
            return {"success": False, "error": "An unexpected error occurred while updating email."}

    @staticmethod
    def validate_password_complexity(password):
        """
        Validates password against complexity requirements.
        - Minimum 8 characters
        - Uppercase
        - Lowercase
        - Number
        - Special Character
        """
        if len(password) < 8:
            return False, "Password must be at least 8 characters long."
        if not re.search(r"[A-Z]", password):
            return False, "Password must contain at least one uppercase letter."
        if not re.search(r"[a-z]", password):
            return False, "Password must contain at least one lowercase letter."
        if not re.search(r"\d", password):
            return False, "Password must contain at least one number."
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            return False, "Password must contain at least one special character."
            
        return True, ""

    @staticmethod
    def change_password(new_password, access_token=None, refresh_token=None):
        """
        Changes the user's password using the auth token.
        (Note: checking the 'current password' isn't natively supported in a single call with Supabase 
         update_user if they are already logged in via token, unless we re-authenticate them first.
         We will assume the route handles re-authentication if necessary).
        """
        is_valid, msg = ProfileService.validate_password_complexity(new_password)
        if not is_valid:
            return {"success": False, "error": msg}
            
        try:
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            response = client.auth.update_user({"password": new_password})
            
            return {"success": True, "message": "Password updated successfully."}
            
        except AuthApiError as e:
            logger.error(f"Error changing password: {e.message}")
            return {"success": False, "error": e.message}
        except Exception as e:
            logger.error(f"Error changing password: {str(e)}")
            return {"success": False, "error": "An unexpected error occurred while changing password."}
