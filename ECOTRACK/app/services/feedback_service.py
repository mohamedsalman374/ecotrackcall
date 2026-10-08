import logging
from app.services.supabase_client import get_supabase_client, get_supabase_service_client

logger = logging.getLogger(__name__)

class FeedbackService:
    @staticmethod
    def create_feedback(user_id, feedback_data, access_token=None, refresh_token=None):
        try:
            data = {
                "user_id": user_id,
                **feedback_data
            }
            
            try:
                client = get_supabase_client()
                if access_token and refresh_token:
                    client.auth.set_session(access_token, refresh_token)
                response = client.table("feedback").insert(data).execute()
            except Exception:
                service_client = get_supabase_service_client()
                response = service_client.table("feedback").insert(data).execute()
            
            return {"success": True, "data": response.data[0] if response.data else None}
            
        except Exception as e:
            logger.error(f"Error creating feedback: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_feedbacks(user_id, status_filter=None, type_filter=None, search_query=None, access_token=None, refresh_token=None):
        try:
            def _build_query(cli):
                q = cli.table("feedback").select("*").eq("user_id", user_id).order("created_at", desc=True)
                if status_filter and status_filter != 'All':
                    q = q.eq("status", status_filter)
                if type_filter and type_filter != 'All':
                    q = q.eq("feedback_type", type_filter)
                if search_query:
                    q = q.or_(f"subject.ilike.%{search_query}%,description.ilike.%{search_query}%")
                return q

            try:
                client = get_supabase_client()
                if access_token and refresh_token:
                    client.auth.set_session(access_token, refresh_token)
                response = _build_query(client).execute()
            except Exception:
                service_client = get_supabase_service_client()
                response = _build_query(service_client).execute()
                
            return {"success": True, "data": response.data or []}
            
        except Exception as e:
            logger.error(f"Error fetching feedbacks: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_feedback_by_id(user_id, feedback_id, access_token=None, refresh_token=None):
        try:
            try:
                client = get_supabase_client()
                if access_token and refresh_token:
                    client.auth.set_session(access_token, refresh_token)
                response = client.table("feedback").select("*").eq("id", feedback_id).eq("user_id", user_id).execute()
            except Exception:
                service_client = get_supabase_service_client()
                response = service_client.table("feedback").select("*").eq("id", feedback_id).eq("user_id", user_id).execute()
            
            if response.data:
                return {"success": True, "data": response.data[0]}
            return {"success": False, "error": "Feedback not found."}
            
        except Exception as e:
            logger.error(f"Error fetching feedback by id: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def update_feedback(user_id, feedback_id, update_data, access_token=None, refresh_token=None):
        try:
            try:
                client = get_supabase_client()
                if access_token and refresh_token:
                    client.auth.set_session(access_token, refresh_token)
                response = client.table("feedback").update(update_data).eq("id", feedback_id).eq("user_id", user_id).eq("status", "Pending").execute()
            except Exception:
                service_client = get_supabase_service_client()
                response = service_client.table("feedback").update(update_data).eq("id", feedback_id).eq("user_id", user_id).eq("status", "Pending").execute()
            
            if response.data:
                return {"success": True, "data": response.data[0]}
            return {"success": False, "error": "Feedback not found or not in Pending status."}
            
        except Exception as e:
            logger.error(f"Error updating feedback: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def delete_feedback(user_id, feedback_id, access_token=None, refresh_token=None):
        try:
            try:
                client = get_supabase_client()
                if access_token and refresh_token:
                    client.auth.set_session(access_token, refresh_token)
                response = client.table("feedback").delete().eq("id", feedback_id).eq("user_id", user_id).eq("status", "Pending").execute()
            except Exception:
                service_client = get_supabase_service_client()
                response = service_client.table("feedback").delete().eq("id", feedback_id).eq("user_id", user_id).eq("status", "Pending").execute()
            
            return {"success": True}
            
        except Exception as e:
            logger.error(f"Error deleting feedback: {str(e)}")
            return {"success": False, "error": str(e)}
