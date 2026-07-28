from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash
from app.utils.auth import login_required
from app.services.calculation_service import CalculationService
from app.services.auth_service import AuthService

calculator_bp = Blueprint('calculator', __name__)

@calculator_bp.route('/calculator', methods=['GET'])
@login_required
def index():
    """Renders the multi-step calculator form."""
    user_session = session.get('user')
    profile_response = AuthService.get_user_profile(user_session.get('id'))
    profile = profile_response.get('profile', {}) if profile_response.get('success') else {}
    
    return render_template('calculator/calculator.html', profile=profile)

@calculator_bp.route('/calculator/calculate', methods=['POST'])
@login_required
def calculate():
    """Handles the form submission, validates, calculates, and saves."""
    user_session = session.get('user', {})
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    if not user_id:
        return jsonify({"success": False, "error": "User session invalid"}), 401
        
    form_data = request.form
    
    # Process calculation and save
    result = CalculationService.calculate_and_save(user_id, form_data, access_token, refresh_token)
    
    if result.get("success"):
        flash("Carbon footprint calculated successfully!", "success")
        calc_id = result["data"]["id"]
        return redirect(url_for('calculator.result', calc_id=calc_id))
    else:
        flash(f"Calculation failed: {result.get('error')}", "danger")
        return redirect(url_for('calculator.index'))

@calculator_bp.route('/calculator/result/<calc_id>', methods=['GET'])
@login_required
def result(calc_id):
    """Renders the result page for a specific calculation."""
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    profile_response = AuthService.get_user_profile(user_id)
    profile = profile_response.get('profile', {}) if profile_response.get('success') else {}
    
    result = CalculationService.get_calculation(user_id, calc_id, access_token, refresh_token)
    
    if not result.get("success"):
        flash(result.get("error"), "danger")
        return redirect(url_for('dashboard.dashboard'))
        
    calculation = result.get("data")
    return render_template('calculator/result.html', calculation=calculation, profile=profile)
