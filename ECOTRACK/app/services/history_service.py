import csv
import io
import logging
from datetime import datetime, timedelta
from app.services.supabase_client import get_supabase_client, get_supabase_service_client
from fpdf import FPDF

logger = logging.getLogger(__name__)

class HistoryService:
    @staticmethod
    def get_history(user_id, filters=None, sort_by='newest', page=1, limit=50, access_token=None, refresh_token=None):
        try:
            def _build_query(cli):
                q = cli.table("carbon_calculations").select("*", count="exact").eq("user_id", user_id)
                if filters and filters.get('date_range') and filters['date_range'] != 'all_time':
                    now = datetime.utcnow()
                    date_range = filters['date_range']
                    if date_range == 'today':
                        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
                    elif date_range == '7_days':
                        start_date = now - timedelta(days=7)
                    elif date_range == '30_days':
                        start_date = now - timedelta(days=30)
                    elif date_range == '6_months':
                        start_date = now - timedelta(days=180)
                    elif date_range == '1_year':
                        start_date = now - timedelta(days=365)
                    else:
                        start_date = None
                    if start_date:
                        q = q.gte("created_at", start_date.isoformat())
                if sort_by == 'oldest':
                    q = q.order("created_at", desc=False)
                elif sort_by == 'highest':
                    q = q.order("total_emissions", desc=True)
                elif sort_by == 'lowest':
                    q = q.order("total_emissions", desc=False)
                else:
                    q = q.order("created_at", desc=True)
                start_range = (page - 1) * limit
                end_range = start_range + limit - 1
                return q.range(start_range, end_range)

            try:
                client = get_supabase_client()
                if access_token and refresh_token:
                    client.auth.set_session(access_token, refresh_token)
                response = _build_query(client).execute()
            except Exception:
                service_client = get_supabase_service_client()
                response = _build_query(service_client).execute()
            
            # Parse results to determine highest category for display
            records = response.data or []
            categories = ['transportation', 'electricity', 'water', 'food', 'waste', 'shopping', 'travel']
            
            for record in records:
                # Find highest emission category
                highest_cat = max(categories, key=lambda c: float(record.get(f'{c}_emissions') or 0))
                record['highest_category'] = highest_cat.capitalize()
                
            total_count = response.count if response.count is not None else len(records)
            
            return {
                "success": True, 
                "data": records, 
                "total": total_count,
                "page": page,
                "limit": limit
            }
            
        except Exception as e:
            logger.error(f"Error fetching history: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_calculation_details(user_id, calc_id, access_token=None, refresh_token=None):
        try:
            try:
                client = get_supabase_client()
                if access_token and refresh_token:
                    client.auth.set_session(access_token, refresh_token)
                calc_response = client.table("carbon_calculations").select("*").eq("id", calc_id).eq("user_id", user_id).execute()
                ai_response = client.table("ai_recommendations").select("*").eq("calculation_id", calc_id).execute()
            except Exception:
                service_client = get_supabase_service_client()
                calc_response = service_client.table("carbon_calculations").select("*").eq("id", calc_id).eq("user_id", user_id).execute()
                ai_response = service_client.table("ai_recommendations").select("*").eq("calculation_id", calc_id).execute()
            
            if not calc_response.data:
                return {"success": False, "error": "Calculation not found."}
                
            calculation = calc_response.data[0]
            ai_rec = ai_response.data[0] if ai_response.data else None
            
            return {
                "success": True,
                "calculation": calculation,
                "ai_recommendation": ai_rec
            }
            
        except Exception as e:
            logger.error(f"Error fetching calculation details: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def delete_calculations(user_id, calc_ids, access_token=None, refresh_token=None):
        try:
            try:
                client = get_supabase_client()
                if access_token and refresh_token:
                    client.auth.set_session(access_token, refresh_token)
                response = client.table("carbon_calculations").delete().in_("id", calc_ids).eq("user_id", user_id).execute()
            except Exception:
                service_client = get_supabase_service_client()
                response = service_client.table("carbon_calculations").delete().in_("id", calc_ids).eq("user_id", user_id).execute()
            
            return {"success": True, "deleted_count": len(response.data or [])}
            
        except Exception as e:
            logger.error(f"Error deleting calculations: {str(e)}")
            return {"success": False, "error": str(e)}
            
    @staticmethod
    def delete_all_history(user_id, access_token=None, refresh_token=None):
        try:
            try:
                client = get_supabase_client()
                if access_token and refresh_token:
                    client.auth.set_session(access_token, refresh_token)
                response = client.table("carbon_calculations").delete().eq("user_id", user_id).execute()
            except Exception:
                service_client = get_supabase_service_client()
                response = service_client.table("carbon_calculations").delete().eq("user_id", user_id).execute()
            return {"success": True, "deleted_count": len(response.data or [])}
        except Exception as e:
            logger.error(f"Error deleting all history: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def generate_csv(records):
        """Generates a CSV string from history records."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'Date', 'Total CO2 (kg)', 'Eco Score', 'Transportation', 
            'Electricity', 'Water', 'Food', 'Waste', 'Shopping', 'Travel'
        ])
        
        for r in records:
            dt = datetime.fromisoformat(r['created_at'].replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M')
            writer.writerow([
                dt,
                r.get('total_emissions', 0),
                r.get('eco_score', 0),
                r.get('transportation_emissions', 0),
                r.get('electricity_emissions', 0),
                r.get('water_emissions', 0),
                r.get('food_emissions', 0),
                r.get('waste_emissions', 0),
                r.get('shopping_emissions', 0),
                r.get('travel_emissions', 0)
            ])
            
        return output.getvalue()

    @staticmethod
    def generate_pdf(records, profile):
        """Generates a PDF report from history records using fpdf2."""
        pdf = FPDF()
        pdf.add_page()
        
        # Title
        pdf.set_font('Helvetica', 'B', 16)
        pdf.cell(0, 10, 'EcoTrack Carbon Footprint History', ln=True, align='C')
        pdf.ln(5)
        
        # User Info
        pdf.set_font('Helvetica', '', 12)
        pdf.cell(0, 8, f"User: {profile.get('full_name', 'EcoTrack User')}", ln=True)
        pdf.cell(0, 8, f"Email: {profile.get('email', '')}", ln=True)
        pdf.cell(0, 8, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True)
        pdf.ln(10)
        
        # Table Header
        pdf.set_font('Helvetica', 'B', 10)
        col_widths = [40, 30, 25, 45, 45]
        headers = ['Date', 'Total (kg)', 'Score', 'Highest Category', 'Details']
        
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, border=1, align='C')
        pdf.ln()
        
        # Table Body
        pdf.set_font('Helvetica', '', 9)
        for r in records:
            dt = datetime.fromisoformat(r['created_at'].replace('Z', '+00:00')).strftime('%Y-%m-%d')
            pdf.cell(col_widths[0], 10, dt, border=1)
            pdf.cell(col_widths[1], 10, str(r.get('total_emissions', 0)), border=1, align='C')
            pdf.cell(col_widths[2], 10, str(r.get('eco_score', 0)), border=1, align='C')
            pdf.cell(col_widths[3], 10, str(r.get('highest_category', '')), border=1)
            
            # Summary of other details
            details = f"Trans:{r.get('transportation_emissions',0)} Elec:{r.get('electricity_emissions',0)}"
            pdf.cell(col_widths[4], 10, details, border=1)
            pdf.ln()
            
        # Return as bytes string
        return pdf.output()
