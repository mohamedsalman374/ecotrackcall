import logging
from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

class FeedbackService:
    @staticmethod
    def create_feedback(user_id, feedback_data, access_token=None, refresh_token=None):
        try:
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            data = {
                "user_id": user_id,
                **feedback_data
            }
            
            response = client.table("feedback").insert(data).execute()
            
            return {"success": True, "data": response.data[0] if response.data else None}
            
        except Exception as e:
            logger.error(f"Error creating feedback: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_feedbacks(user_id, status_filter=None, type_filter=None, search_query=None, access_token=None, refresh_token=None):
        try:
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            query = client.table("feedback").select("*").eq("user_id", user_id).order("created_at", desc=True)
            
            if status_filter and status_filter != 'All':
                query = query.eq("status", status_filter)
                
            if type_filter and type_filter != 'All':
                query = query.eq("feedback_type", type_filter)
                
            if search_query:
                # Basic text search on subject or description using ilike
                query = query.or_(f"subject.ilike.%{search_query}%,description.ilike.%{search_query}%")
                
            response = query.execute()
            return {"success": True, "data": response.data}
            
        except Exception as e:
            logger.error(f"Error fetching feedbacks: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_feedback_by_id(user_id, feedback_id, access_token=None, refresh_token=None):
        try:
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            response = client.table("feedback").select("*").eq("id", feedback_id).eq("user_id", user_id).execute()
            
            if response.data:
                return {"success": True, "data": response.data[0]}
            return {"success": False, "error": "Feedback not found."}
            
        except Exception as e:
            logger.error(f"Error fetching feedback by id: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def update_feedback(user_id, feedback_id, update_data, access_token=None, refresh_token=None):
        try:
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            response = client.table("feedback").update(update_data).eq("id", feedback_id).eq("user_id", user_id).eq("status", "Pending").execute()
            
            if response.data:
                return {"success": True, "data": response.data[0]}
            return {"success": False, "error": "Feedback not found or not in Pending status."}
            
        except Exception as e:
            logger.error(f"Error updating feedback: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def delete_feedback(user_id, feedback_id, access_token=None, refresh_token=None):
        try:
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            response = client.table("feedback").delete().eq("id", feedback_id).eq("user_id", user_id).eq("status", "Pending").execute()
            
            if response.data:
                return {"success": True}
            return {"success": False, "error": "Feedback not found or not in Pending status."}
            
        except Exception as e:
            logger.error(f"Error deleting feedback: {str(e)}")
            return {"success": False, "error": str(e)}
