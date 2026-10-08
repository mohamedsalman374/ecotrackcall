import logging
from typing import Optional, Dict, Any
from supabase import create_client, Client
from app.config import Config

logger = logging.getLogger(__name__)

# Safe import for AuthApiError across various versions of supabase-py/gotrue
try:
    from gotrue.errors import AuthApiError
except ImportError:
    try:
        from supabase_auth.errors import AuthApiError
    except ImportError:
        AuthApiError = Exception


class SupabaseService:
    """
    Centralized service for managing Supabase connections, authentication,
    and database operations with strict separation between public (anon)
    and privileged (service-role) operations.
    """

    # -------------------------------------------------------------------------
    # Client Factory Methods
    # -------------------------------------------------------------------------
    @staticmethod
    def get_client() -> Client:
        """
        Creates and returns a Supabase client configured with the Anon Key.
        Used for public and user-scoped operations respecting Row Level Security (RLS).
        """
        url = Config.SUPABASE_URL
        key = Config.SUPABASE_ANON_KEY or Config.SUPABASE_KEY

        if not url or not key:
            logger.error("Supabase URL or Anon Key is missing. Check your .env file.")
            raise ValueError("Missing Supabase configuration (SUPABASE_URL or SUPABASE_ANON_KEY).")

        return create_client(url, key)

    @staticmethod
    def get_service_client() -> Client:
        """
        Creates and returns a Supabase client with the Service Role Key.
        WARNING: Bypasses Row Level Security (RLS). Used strictly on the Flask server
        for trusted operations (e.g. administrative tasks, trigger fallback creation).
        NEVER expose this client or its credentials to frontend JavaScript.
        """
        url = Config.SUPABASE_URL
        key = Config.SUPABASE_SERVICE_ROLE_KEY

        if not url or not key:
            logger.warning(
                "SUPABASE_SERVICE_ROLE_KEY is not configured. Falling back to anon key. "
                "Privileged admin operations may be restricted by RLS."
            )
            return SupabaseService.get_client()

        return create_client(url, key)

    @staticmethod
    def get_authenticated_client(access_token: str, refresh_token: str = "") -> Client:
        """
        Creates an anon client and attaches the authenticated user's JWT session tokens.
        All database queries made with this client run under the user's RLS context.
        """
        client = SupabaseService.get_client()
        if access_token:
            try:
                client.auth.set_session(access_token, refresh_token or "")
            except Exception as e:
                logger.warning(f"Failed to attach session to Supabase client: {str(e)}")
        return client

    # -------------------------------------------------------------------------
    # Authentication Operations
    # -------------------------------------------------------------------------
    @staticmethod
    def sign_up(email: str, password: str, full_name: str) -> Dict[str, Any]:
        """
        Registers a new user in Supabase Auth.
        Passes full_name in user metadata so the database trigger automatically creates
        the corresponding public.profiles record.
        """
        try:
            client = SupabaseService.get_client()

            # Sign up with Supabase Auth, embedding full_name into user metadata
            auth_response = client.auth.sign_up({
                "email": email.strip().lower(),
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name.strip()
                    }
                }
            })

            user = auth_response.user
            session = auth_response.session

            if not user:
                return {
                    "success": False,
                    "error": "Failed to create user account. Please try again."
                }

            # Server-side safety net: ensure profile exists in public.profiles table
            # in case database trigger has not been set up in Supabase SQL editor yet
            SupabaseService.ensure_profile_exists(
                user_id=user.id,
                full_name=full_name.strip(),
                email=email.strip().lower()
            )

            # Check if email confirmation is required by Supabase project settings
            requires_confirmation = session is None

            message = (
                "Registration successful! Please check your email to verify your account."
                if requires_confirmation
                else "Registration successful! You may now log in."
            )

            return {
                "success": True,
                "user": user,
                "session": session,
                "requires_confirmation": requires_confirmation,
                "message": message
            }

        except AuthApiError as e:
            msg = getattr(e, "message", str(e))
            logger.error(f"Supabase AuthApiError during signup: {msg}")
            if "already registered" in msg.lower() or "user already exists" in msg.lower():
                return {"success": False, "error": "An account with this email address already exists."}
            elif "password" in msg.lower():
                return {"success": False, "error": f"Password requirement error: {msg}"}
            return {"success": False, "error": msg}
        except Exception as e:
            logger.error(f"Unexpected error during signup: {str(e)}")
            return {"success": False, "error": "An unexpected error occurred during registration. Please try again."}

    @staticmethod
    def sign_in(email: str, password: str) -> Dict[str, Any]:
        """
        Authenticates a user with email and password via Supabase Auth.
        """
        try:
            client = SupabaseService.get_client()
            auth_response = client.auth.sign_in_with_password({
                "email": email.strip().lower(),
                "password": password
            })

            user = auth_response.user
            session = auth_response.session

            if not user or not session:
                return {"success": False, "error": "Invalid email or password."}

            # Update last_login timestamp in public.profiles
            SupabaseService.update_last_login(user.id)

            return {
                "success": True,
                "user": user,
                "session": session
            }

        except AuthApiError as e:
            msg = getattr(e, "message", str(e))
            logger.error(f"Supabase AuthApiError during login: {msg}")
            if "email not confirmed" in msg.lower():
                return {
                    "success": False,
                    "error": "Please verify your email address before logging in. Check your inbox for the verification link."
                }
            elif "invalid login credentials" in msg.lower() or "invalid credentials" in msg.lower():
                return {"success": False, "error": "Invalid email or password."}
            return {"success": False, "error": msg}
        except Exception as e:
            logger.error(f"Unexpected error during login: {str(e)}")
            return {"success": False, "error": "An unexpected error occurred during login. Please try again."}

    @staticmethod
    def sign_out(access_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Signs out the user session from Supabase Auth.
        """
        try:
            client = SupabaseService.get_client()
            if access_token:
                try:
                    client.auth.set_session(access_token, "")
                except Exception:
                    pass
            client.auth.sign_out()
            return {"success": True}
        except Exception as e:
            logger.warning(f"Error during sign_out: {str(e)}")
            return {"success": True}  # Always allow local logout even if remote call fails

    @staticmethod
    def send_password_reset(email: str, redirect_to: Optional[str] = None) -> Dict[str, Any]:
        """
        Sends a password reset email using Supabase Auth.
        """
        try:
            client = SupabaseService.get_client()
            options = {"redirect_to": redirect_to} if redirect_to else {}
            client.auth.reset_password_email(email.strip().lower(), options=options)
            return {
                "success": True,
                "message": "Password reset instructions have been sent to your email if an account exists."
            }
        except AuthApiError as e:
            msg = getattr(e, "message", str(e))
            logger.error(f"Supabase AuthApiError during password reset: {msg}")
            return {"success": False, "error": msg}
        except Exception as e:
            logger.error(f"Unexpected error during password reset: {str(e)}")
            return {"success": False, "error": "An error occurred while requesting password reset."}

    @staticmethod
    def update_password(access_token: str, new_password: str) -> Dict[str, Any]:
        """
        Updates the authenticated user's password using the access token from password recovery.
        """
        try:
            client = SupabaseService.get_client()
            client.auth.set_session(access_token, "")
            auth_response = client.auth.update_user({"password": new_password})

            if auth_response and auth_response.user:
                return {"success": True, "message": "Password updated successfully."}
            return {"success": False, "error": "Could not update password. Please try again."}

        except AuthApiError as e:
            msg = getattr(e, "message", str(e))
            logger.error(f"Supabase AuthApiError during update_password: {msg}")
            return {"success": False, "error": msg}
        except Exception as e:
            logger.error(f"Unexpected error during update_password: {str(e)}")
            return {"success": False, "error": "An unexpected error occurred during password update."}

    @staticmethod
    def get_user(access_token: str) -> Optional[Any]:
        """
        Validates the JWT access token and retrieves the current user from Supabase Auth.
        """
        try:
            client = SupabaseService.get_client()
            client.auth.set_session(access_token, "")
            user_response = client.auth.get_user(access_token)
            return user_response.user if user_response else None
        except Exception as e:
            logger.debug(f"Failed to fetch user by access_token: {str(e)}")
            return None

    # -------------------------------------------------------------------------
    # Profile & Database Operations (Row Level Security Compliant)
    # -------------------------------------------------------------------------
    @staticmethod
    def get_profile(user_id: str, access_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves the profile record from public.profiles table.
        Uses authenticated client when access_token is supplied (RLS compliant).
        Falls back to privileged client if token is not available.
        """
        try:
            client = (
                SupabaseService.get_authenticated_client(access_token)
                if access_token
                else SupabaseService.get_service_client()
            )

            # Query the profiles table
            response = client.table("profiles").select("*").eq("id", user_id).execute()

            if response.data and len(response.data) > 0:
                return {"success": True, "profile": response.data[0]}

            # Fallback to check public.users view/table if profiles didn't return data
            fallback_response = client.table("users").select("*").eq("id", user_id).execute()
            if fallback_response.data and len(fallback_response.data) > 0:
                return {"success": True, "profile": fallback_response.data[0]}

            return {"success": False, "error": "Profile not found."}

        except Exception as e:
            logger.error(f"Error fetching profile for user {user_id}: {str(e)}")
            return {"success": False, "error": "Could not retrieve user profile."}

    @staticmethod
    def update_profile(user_id: str, update_data: Dict[str, Any], access_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Updates the user's profile record in public.profiles.
        Strips 'role' from update_data to prevent non-admins from self-escalating roles.
        """
        try:
            # Prevent regular user from altering role
            safe_data = {k: v for k, v in update_data.items() if k not in ["role", "id", "created_at"]}

            client = (
                SupabaseService.get_authenticated_client(access_token)
                if access_token
                else SupabaseService.get_service_client()
            )

            response = client.table("profiles").update(safe_data).eq("id", user_id).execute()

            if response.data:
                return {"success": True, "data": response.data[0]}
            return {"success": True, "message": "Profile updated."}

        except Exception as e:
            logger.error(f"Error updating profile for user {user_id}: {str(e)}")
            return {"success": False, "error": "Could not update user profile."}

    @staticmethod
    def ensure_profile_exists(user_id: str, full_name: str, email: Optional[str] = None) -> None:
        """
        Safety net method using the privileged service-role client.
        Ensures a record exists in public.profiles if the database trigger did not run.
        """
        try:
            service_client = SupabaseService.get_service_client()

            # Check if profile already exists
            existing = service_client.table("profiles").select("id").eq("id", user_id).execute()
            if existing.data and len(existing.data) > 0:
                return

            # Insert missing profile safely
            name = full_name or (email.split("@")[0] if email else "EcoTrack User")
            service_client.table("profiles").insert({
                "id": user_id,
                "full_name": name,
                "role": "user",
                "theme": "light",
                "language": "en",
                "email_notifications": True,
                "weekly_reminder": True,
                "monthly_reminder": True
            }).execute()
            logger.info(f"Auto-created missing profile for user {user_id}")

        except Exception as e:
            logger.warning(f"ensure_profile_exists warning (may already exist or trigger handled it): {str(e)}")

    @staticmethod
    def update_last_login(user_id: str) -> None:
        """
        Updates the last_login timestamp in public.profiles table.
        """
        try:
            from datetime import datetime, timezone
            service_client = SupabaseService.get_service_client()
            now_iso = datetime.now(timezone.utc).isoformat()
            service_client.table("profiles").update({"last_login": now_iso}).eq("id", user_id).execute()
        except Exception as e:
            logger.debug(f"Could not update last_login: {str(e)}")
