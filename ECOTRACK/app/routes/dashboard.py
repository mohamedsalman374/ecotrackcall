from flask import Blueprint, render_template, session, redirect, url_for, flash
from app.services.auth_service import AuthService
from app.services.calculation_service import CalculationService
from app.utils.auth import login_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard')
@login_required
def dashboard():
    user_session = session.get('user')
    
    # Retrieve fresh profile data from Supabase to ensure it's up to date
    profile_response = AuthService.get_user_profile(user_session.get('id'))
    
    if not profile_response.get('success'):
        flash('Could not retrieve user profile. Please log in again.', 'danger')
        session.clear()
        return redirect(url_for('auth.login'))
        
    profile = profile_response.get('profile', {})
    
    # Fetch latest calculation
    latest_calc_response = CalculationService.get_latest_calculation(
        user_session.get('id'), 
        user_session.get('access_token'), 
        user_session.get('refresh_token')
    )
    latest_calc = latest_calc_response.get('data') if latest_calc_response.get('success') else None
    
    return render_template('dashboard/dashboard.html', profile=profile, latest_calc=latest_calc)
