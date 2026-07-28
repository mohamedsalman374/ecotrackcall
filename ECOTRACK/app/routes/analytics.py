from flask import Blueprint, render_template, session, request, redirect, url_for, flash
from app.utils.auth import login_required
from app.services.auth_service import AuthService
from app.services.analytics_service import AnalyticsService

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics', methods=['GET'])
@login_required
def index():
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    # Get profile for the header/sidebar
    profile_response = AuthService.get_user_profile(user_id)
    profile = profile_response.get('profile', {}) if profile_response.get('success') else {}
    
    # Get active filter from query params
    time_filter = request.args.get('filter', 'all_time')
    
    # Get analytics data
    analytics_response = AnalyticsService.get_user_analytics(user_id, time_filter, access_token, refresh_token)
    
    if not analytics_response.get('success'):
        flash(f"Could not load analytics: {analytics_response.get('error')}", "danger")
        return redirect(url_for('dashboard.dashboard'))
        
    analytics_data = analytics_response.get('data')
    
    return render_template('analytics/dashboard.html', 
                           profile=profile, 
                           analytics_data=analytics_data, 
                           current_filter=time_filter)
