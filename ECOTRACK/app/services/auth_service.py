import logging
from app.services.supabase_client import get_supabase_client, get_supabase_service_client
from supabase_auth.errors import AuthApiError

logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    def register_user(email, password, full_name):
        """
        Registers a new user in Supabase Auth and creates a profile in the users table.
        """
        try:
            client = get_supabase_client()
            
            # Register in Supabase Auth
            auth_response = client.auth.sign_up({
                "email": email,
                "password": password
            })
            
            user = auth_response.user
            
            if not user:
                # Some configurations return session/user as none if email confirmation is required and implicit signup is disabled
                # We'll check if it succeeded by absence of error. But if user is returned, we insert the profile.
                pass
                
            # If user is returned, create the profile
            if user:
                service_client = get_supabase_service_client()
                # Use service role client to bypass RLS for inserting the profile
                # supabase-py v2 returns an APIResponse object, not a tuple
                service_client.table('users').insert({
                    "auth_user_id": user.id,
                    "email": email,
                    "full_name": full_name
                }).execute()
                
            return {"success": True, "user": user, "message": "Registration successful. Please check your email to verify your account."}
            
        except AuthApiError as e:
            logger.error(f"Registration AuthApiError: {e.message}")
            return {"success": False, "error": e.message}
        except Exception as e:
            logger.error(f"Registration Error: {str(e)}")
            return {"success": False, "error": "An unexpected error occurred during registration."}

    @staticmethod
    def login_user(email, password):
        """
        Logs in a user with email and password.
        Returns the auth session.
        """
        try:
            client = get_supabase_client()
            auth_response = client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            return {"success": True, "session": auth_response.session, "user": auth_response.user}
            
        except AuthApiError as e:
            logger.error(f"Login AuthApiError: {e.message}")
            if "Email not confirmed" in e.message:
                return {"success": False, "error": "Please verify your email address before logging in."}
            return {"success": False, "error": "Invalid email or password."}
        except Exception as e:
            logger.error(f"Login Error: {str(e)}")
            return {"success": False, "error": "An unexpected error occurred during login."}
            
    @staticmethod
    def reset_password_request(email):
        """
        Sends a password reset email to the user.
        """
        try:
            client = get_supabase_client()
            # Redirect URL should be the frontend reset-password route
            # For this to work smoothly, the Supabase project must be configured with this redirect URL
            # Note: The actual redirect URL needs to be configured in Supabase dashboard
            res = client.auth.reset_password_email(email)
            return {"success": True, "message": "Password reset email sent."}
        except AuthApiError as e:
            logger.error(f"Reset Password Request AuthApiError: {e.message}")
            return {"success": False, "error": e.message}
        except Exception as e:
            logger.error(f"Reset Password Request Error: {str(e)}")
            return {"success": False, "error": "An unexpected error occurred."}
            
    @staticmethod
    def get_user_profile(user_id):
        """
        Retrieves the user profile from the public.users table.
        """
        try:
            service_client = get_supabase_service_client()
            response = service_client.table('users').select('*').eq('auth_user_id', user_id).execute()
            
            if response.data and len(response.data) > 0:
                return {"success": True, "profile": response.data[0]}
            return {"success": False, "error": "Profile not found."}
        except Exception as e:
            logger.error(f"Get Profile Error: {str(e)}")
            return {"success": False, "error": "Could not retrieve user profile."}

    @staticmethod
    def ensure_user_profile(user_id, email, full_name=None):
        """
        Creates the public.users profile if it doesn't exist.
        Used as a safety net for users whose profile creation failed during registration.
        """
        try:
            service_client = get_supabase_service_client()
            # Use email prefix as the name fallback if not provided
            name = full_name or email.split('@')[0]
            service_client.table('users').insert({
                "auth_user_id": user_id,
                "email": email,
                "full_name": name
            }).execute()
            logger.info(f"Auto-created missing profile for user {user_id}")
        except Exception as e:
            logger.error(f"ensure_user_profile Error: {str(e)}")

