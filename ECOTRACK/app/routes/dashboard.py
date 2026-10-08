import logging
from flask import Blueprint, render_template, session, redirect, url_for, flash
from app.services.auth_service import AuthService
from app.utils.auth import login_required

logger = logging.getLogger(__name__)

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/dashboard')
@login_required
def dashboard():
    """
    Renders the protected dashboard for authenticated Supabase users.
    Retrieves the user's profile from the public.profiles table.
    """
    user_session = session.get('user', {})
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')

    if not user_id:
        flash('Session expired or invalid. Please log in again.', 'warning')
        session.clear()
        return redirect(url_for('auth.login'))

    # Retrieve fresh profile data from Supabase public.profiles (RLS compliant)
    profile_response = AuthService.get_user_profile(user_id, access_token=access_token)
    profile = profile_response.get('profile', {}) if profile_response.get('success') else {}

    # Optional compatibility check for future calculation module
    latest_calc = None
    try:
        from app.services.calculation_service import CalculationService
        calc_response = CalculationService.get_latest_calculation(
            user_id=user_id,
            access_token=access_token,
            refresh_token=user_session.get('refresh_token')
        )
        if calc_response.get('success'):
            latest_calc = calc_response.get('data')
    except Exception as e:
        logger.debug(f"Calculation module not active or no calculations: {str(e)}")

    return render_template('dashboard.html', profile=profile, latest_calc=latest_calc)
