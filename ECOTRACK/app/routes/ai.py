from flask import Blueprint, render_template, session, redirect, url_for, flash, request
from app.utils.auth import login_required
from app.services.calculation_service import CalculationService
from app.services.auth_service import AuthService
from app.services.gemini_service import GeminiService

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/recommendations', methods=['GET'])
@login_required
def index():
    """Displays the latest AI recommendation, or prompts to generate one."""
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    # Get profile
    profile_response = AuthService.get_user_profile(user_id)
    profile = profile_response.get('profile', {}) if profile_response.get('success') else {}
    
    # Get latest calculation to see if they can even generate one
    calc_response = CalculationService.get_latest_calculation(user_id, access_token, refresh_token)
    latest_calc = calc_response.get('data') if calc_response.get('success') else None
    
    if not latest_calc:
        flash("You need to complete a Carbon Footprint Calculation before getting AI recommendations.", "warning")
        return redirect(url_for('calculator.index'))
        
    # Get latest recommendation
    rec_response = GeminiService.get_latest_recommendation(user_id, access_token, refresh_token)
    latest_rec = rec_response.get('data') if rec_response.get('success') else None
    
    return render_template('ai/recommendation.html', profile=profile, latest_calc=latest_calc, latest_rec=latest_rec)

@ai_bp.route('/recommendations/generate', methods=['POST'])
@login_required
def generate():
    """Generates a new AI recommendation based on the latest calculation."""
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    # Get profile
    profile_response = AuthService.get_user_profile(user_id)
    profile = profile_response.get('profile', {}) if profile_response.get('success') else {}
    
    # Get latest calculation
    calc_response = CalculationService.get_latest_calculation(user_id, access_token, refresh_token)
    latest_calc = calc_response.get('data') if calc_response.get('success') else None
    
    if not latest_calc:
        flash("You need to complete a calculation first.", "warning")
        return redirect(url_for('calculator.index'))
        
    # Generate new recommendation
    result = GeminiService.generate_recommendation(user_id, latest_calc, profile, access_token, refresh_token)
    
    if result.get("success"):
        flash("AI Recommendations successfully generated!", "success")
    else:
        flash(f"Failed to generate recommendations: {result.get('error')}", "danger")
        
    return redirect(url_for('ai.index'))
