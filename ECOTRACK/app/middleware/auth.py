import logging
from functools import wraps
from flask import request, jsonify, g, session
from app.services.supabase_client import get_supabase_client, get_supabase_service_client

logger = logging.getLogger(__name__)

def extract_bearer_token():
    """Extracts Bearer token from Authorization header or session."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None

def token_required(f):
    """
    Decorator for protected REST API routes.
    Verifies Supabase JWT access token from Authorization header.
    Falls back to session['user'] for development/backward compatibility.
    Sets g.user = {'id': ..., 'email': ..., 'role': ..., 'access_token': ...}.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = extract_bearer_token()
        user_info = None

        if token:
            try:
                client = get_supabase_client()
                user_res = client.auth.get_user(token)
                if user_res and user_res.user:
                    u = user_res.user
                    user_id = str(u.id)
                    email = u.email or ""
                    
                    # Fetch user role from profiles
                    role = "user"
                    try:
                        svc_client = get_supabase_service_client()
                        prof = svc_client.table("profiles").select("role").eq("id", user_id).execute()
                        if prof.data and len(prof.data) > 0:
                            role = prof.data[0].get("role", "user")
                    except Exception as err:
                        logger.debug(f"Could not fetch role from profiles: {err}")

                    user_info = {
                        "id": user_id,
                        "email": email,
                        "role": role,
                        "access_token": token,
                        "user_metadata": u.user_metadata or {}
                    }
            except Exception as e:
                logger.warning(f"Bearer token validation failed: {str(e)}")

        # Fallback to session user if Bearer token was not provided or failed
        if not user_info and session.get("user"):
            sess_u = session.get("user")
            user_info = {
                "id": sess_u.get("id"),
                "email": sess_u.get("email"),
                "role": sess_u.get("role", "user"),
                "access_token": sess_u.get("access_token"),
                "user_metadata": sess_u.get("user_metadata", {})
            }

        if not user_info or not user_info.get("id"):
            return jsonify({
                "success": False,
                "error": "Unauthorized: Valid authentication token required"
            }), 401

        g.user = user_info
        return f(*args, **kwargs)

    return decorated

def admin_required(f):
    """
    Decorator for admin-only REST API endpoints.
    Requires token_required and verifies role == 'admin'.
    """
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        user = getattr(g, "user", None)
        if not user or user.get("role") != "admin":
            return jsonify({
                "success": False,
                "error": "Forbidden: Administrative privileges required"
            }), 403
        return f(*args, **kwargs)

    return decorated
