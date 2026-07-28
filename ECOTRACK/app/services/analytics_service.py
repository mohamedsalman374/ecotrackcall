import logging
from datetime import datetime, timedelta
from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

class AnalyticsService:
    @staticmethod
    def get_user_analytics(user_id, filter_type='all_time', access_token=None, refresh_token=None):
        try:
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            query = client.table("carbon_calculations").select("*").eq("user_id", user_id).order("created_at", desc=False)
            
            # Apply date filters
            if filter_type != 'all_time':
                now = datetime.utcnow()
                if filter_type == 'today':
                    start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
                elif filter_type == '7_days':
                    start_date = now - timedelta(days=7)
                elif filter_type == '30_days':
                    start_date = now - timedelta(days=30)
                elif filter_type == '6_months':
                    start_date = now - timedelta(days=180)
                elif filter_type == '1_year':
                    start_date = now - timedelta(days=365)
                else:
                    start_date = now - timedelta(days=30) # default fallback
                
                query = query.gte("created_at", start_date.isoformat())
            
            response = query.execute()
            
            if not response.data:
                return {"success": True, "data": None, "message": "No calculations found for the selected period."}
                
            records = response.data
            
            # Aggregate stats
            total_c = sum(r['total_emissions'] for r in records)
            avg_c = total_c / len(records)
            highest_c = max(r['total_emissions'] for r in records)
            lowest_c = min(r['total_emissions'] for r in records)
            total_calcs = len(records)
            current_eco_score = records[-1]['eco_score'] if records else 0
            
            # Category totals for pie/doughnut/radar
            categories = ['transportation', 'electricity', 'water', 'food', 'waste', 'shopping', 'travel']
            category_totals = {cat: 0 for cat in categories}
            
            for r in records:
                for cat in categories:
                    category_totals[cat] += r.get(f'{cat}_emissions', 0)
            
            category_labels = ['Transport', 'Electricity', 'Water', 'Food', 'Waste', 'Shopping', 'Travel']
            category_data = [category_totals[cat] for cat in categories]
            
            # Timeline data for line chart
            timeline_labels = []
            timeline_data = []
            for r in records:
                # Format date like 'Mon DD'
                dt = datetime.fromisoformat(r['created_at'].replace('Z', '+00:00'))
                timeline_labels.append(dt.strftime('%b %d'))
                timeline_data.append(r['total_emissions'])
            
            # Monthly grouping for bar chart
            monthly_totals = {}
            for r in records:
                dt = datetime.fromisoformat(r['created_at'].replace('Z', '+00:00'))
                month_key = dt.strftime('%b %Y')
                if month_key not in monthly_totals:
                    monthly_totals[month_key] = 0
                monthly_totals[month_key] += r['total_emissions']
                
            bar_labels = list(monthly_totals.keys())
            bar_data = list(monthly_totals.values())
            
            # Generate insights
            highest_cat_name = categories[category_data.index(max(category_data))].capitalize()
            lowest_cat_name = categories[category_data.index(min(category_data))].capitalize()
            
            trend_text = "stable"
            trend_val = 0
            if len(records) > 1:
                first = records[0]['total_emissions']
                last = records[-1]['total_emissions']
                if first > 0:
                    trend_val = ((last - first) / first) * 100
                    if trend_val > 0:
                        trend_text = f"increased by {abs(trend_val):.1f}%"
                    elif trend_val < 0:
                        trend_text = f"decreased by {abs(trend_val):.1f}%"
            
            insights = {
                "highest_category": highest_cat_name,
                "lowest_category": lowest_cat_name,
                "trend": trend_text,
                "trend_value": trend_val,
                "score_improvement": "Great job maintaining your score!" if len(records) == 1 or records[-1]['eco_score'] >= records[0]['eco_score'] else "Score dropped, time to focus!"
            }
            
            analytics_data = {
                "stats": {
                    "total": round(total_c, 1),
                    "average": round(avg_c, 1),
                    "highest": round(highest_c, 1),
                    "lowest": round(lowest_c, 1),
                    "count": total_calcs,
                    "eco_score": current_eco_score
                },
                "charts": {
                    "line": {"labels": timeline_labels, "data": timeline_data},
                    "bar": {"labels": bar_labels, "data": bar_data},
                    "pie": {"labels": category_labels, "data": category_data},
                    "radar": {"labels": category_labels, "data": category_data} # Same base data, ChartJS handles normalization
                },
                "insights": insights
            }
            
            return {"success": True, "data": analytics_data}
            
        except Exception as e:
            logger.error(f"Error fetching analytics data: {str(e)}")
            return {"success": False, "error": str(e)}
