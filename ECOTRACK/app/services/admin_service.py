import logging
from app.services.supabase_client import get_supabase_service_client
from app.services.history_service import HistoryService # Re-use PDF/CSV generation
import csv
import io
from fpdf import FPDF
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class AdminService:
    """
    AdminService uses the get_supabase_service_client() which bypasses Row Level Security.
    This is necessary for admin operations that span across all users.
    """
    
    @staticmethod
    def get_dashboard_stats():
        try:
            client = get_supabase_service_client()
            
            users_res = client.table("users").select("id", count="exact").execute()
            active_users_res = client.table("users").select("id", count="exact").eq("is_active", True).execute()
            calcs_res = client.table("carbon_calculations").select("eco_score", count="exact").execute()
            ai_res = client.table("ai_recommendations").select("id", count="exact").execute()
            feedback_res = client.table("feedback").select("id", count="exact").execute()
            
            total_users = users_res.count if users_res.count else 0
            active_users = active_users_res.count if active_users_res.count else 0
            total_calcs = calcs_res.count if calcs_res.count else 0
            total_ai = ai_res.count if ai_res.count else 0
            total_feedback = feedback_res.count if feedback_res.count else 0
            
            avg_score = 0
            if calcs_res.data and total_calcs > 0:
                avg_score = sum(c.get('eco_score', 0) for c in calcs_res.data) / total_calcs
                
            return {
                "success": True,
                "stats": {
                    "total_users": total_users,
                    "active_users": active_users,
                    "total_calculations": total_calcs,
                    "total_ai_recommendations": total_ai,
                    "total_feedback": total_feedback,
                    "average_score": round(avg_score, 1)
                }
            }
        except Exception as e:
            logger.error(f"Error fetching admin stats: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_users(search_query=None, role_filter=None):
        try:
            client = get_supabase_service_client()
            query = client.table("users").select("*").order("created_at", desc=True)
            
            if search_query:
                query = query.or_(f"email.ilike.%{search_query}%,full_name.ilike.%{search_query}%")
                
            if role_filter and role_filter != 'all':
                query = query.eq("role", role_filter)
                
            response = query.execute()
            return {"success": True, "data": response.data}
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def update_user_role(user_id, new_role):
        try:
            client = get_supabase_service_client()
            client.table("users").update({"role": new_role}).eq("id", user_id).execute()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error updating user role: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def toggle_user_status(user_id, is_active):
        try:
            client = get_supabase_service_client()
            client.table("users").update({"is_active": is_active}).eq("id", user_id).execute()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error toggling user status: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def delete_user(user_id):
        try:
            client = get_supabase_service_client()
            # This deletes the public profile. Note: It does NOT delete the auth.users record automatically.
            # Usually Supabase requires an admin API call to delete auth.users, which we can simulate if we have the service role key.
            # Delete auth user:
            client.auth.admin.delete_user(user_id)
            # The profile will cascade if foreign keys are set up, but if not, we delete it too.
            client.table("users").delete().eq("id", user_id).execute()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error deleting user: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_all_calculations(search_query=None):
        try:
            client = get_supabase_service_client()
            # Perform a join with users table to get user details
            query = client.table("carbon_calculations").select("*, users(email, full_name)").order("created_at", desc=True)
            
            response = query.execute()
            
            # Note: supabase-py doesn't currently support nested filtering with ilike smoothly for joined tables via the REST api string.
            # We will filter manually if search query is provided for this example.
            data = response.data
            if search_query:
                q = search_query.lower()
                data = [d for d in data if (d.get('users') and q in d['users'].get('email', '').lower()) or 
                                          (d.get('users') and q in d['users'].get('full_name', '').lower())]
                                          
            return {"success": True, "data": data}
        except Exception as e:
            logger.error(f"Error fetching all calculations: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def delete_calculation(calc_id):
        try:
            client = get_supabase_service_client()
            client.table("carbon_calculations").delete().eq("id", calc_id).execute()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error deleting calculation: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_all_feedback(search_query=None, status_filter=None):
        try:
            client = get_supabase_service_client()
            query = client.table("feedback").select("*, users(email, full_name)").order("created_at", desc=True)
            
            if status_filter and status_filter != 'all':
                query = query.eq("status", status_filter)
                
            response = query.execute()
            data = response.data
            
            if search_query:
                q = search_query.lower()
                data = [d for d in data if q in d.get('subject', '').lower() or q in d.get('description', '').lower()]
                
            return {"success": True, "data": data}
        except Exception as e:
            logger.error(f"Error fetching all feedback: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def update_feedback_status(feedback_id, status, admin_response=None):
        try:
            client = get_supabase_service_client()
            update_data = {"status": status}
            if admin_response is not None:
                update_data["admin_response"] = admin_response
                
            client.table("feedback").update(update_data).eq("id", feedback_id).execute()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error updating feedback: {str(e)}")
            return {"success": False, "error": str(e)}
            
    @staticmethod
    def delete_feedback(feedback_id):
        try:
            client = get_supabase_service_client()
            client.table("feedback").delete().eq("id", feedback_id).execute()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error deleting feedback: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_system_analytics():
        try:
            client = get_supabase_service_client()
            
            # Simple aggregation for chart (last 30 days calculations)
            now = datetime.utcnow()
            thirty_days_ago = now - timedelta(days=30)
            
            calcs_res = client.table("carbon_calculations").select("created_at, total_emissions").gte("created_at", thirty_days_ago.isoformat()).execute()
            users_res = client.table("users").select("created_at").gte("created_at", thirty_days_ago.isoformat()).execute()
            
            return {
                "success": True,
                "data": {
                    "calculations": calcs_res.data,
                    "users": users_res.data
                }
            }
        except Exception as e:
            logger.error(f"Error fetching analytics: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def generate_users_csv(users):
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'Full Name', 'Email', 'Role', 'Status', 'Joined Date'])
        for u in users:
            writer.writerow([
                u.get('id'),
                u.get('full_name'),
                u.get('email'),
                u.get('role'),
                'Active' if u.get('is_active') else 'Inactive',
                u.get('created_at', '')[:10] if u.get('created_at') else ''
            ])
        return output.getvalue()
        
    @staticmethod
    def generate_users_pdf(users):
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font('Helvetica', 'B', 16)
        pdf.cell(0, 10, 'EcoTrack Users Report', ln=True, align='C')
        pdf.ln(5)
        
        pdf.set_font('Helvetica', 'B', 10)
        col_widths = [60, 60, 30, 30]
        headers = ['Full Name', 'Email', 'Role', 'Status']
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, border=1, align='C')
        pdf.ln()
        
        pdf.set_font('Helvetica', '', 9)
        for u in users:
            pdf.cell(col_widths[0], 10, str(u.get('full_name', ''))[:30], border=1)
            pdf.cell(col_widths[1], 10, str(u.get('email', ''))[:30], border=1)
            pdf.cell(col_widths[2], 10, str(u.get('role', '')), border=1, align='C')
            pdf.cell(col_widths[3], 10, 'Active' if u.get('is_active') else 'Inactive', border=1, align='C')
            pdf.ln()
            
        return pdf.output()
