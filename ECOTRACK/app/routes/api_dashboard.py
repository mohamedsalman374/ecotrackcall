from flask import Blueprint, jsonify, g
from app.services.auth_service import AuthService
from app.services.calculation_service import CalculationService
from app.middleware.auth import token_required

api_dashboard_bp = Blueprint('api_dashboard', __name__, url_prefix='/api/dashboard')

@api_dashboard_bp.route('/summary', methods=['GET'])
@token_required
def summary():
    user = g.user
    user_id = user['id']
    token = user.get('access_token')

    profile_res = AuthService.get_user_profile(user_id, access_token=token)
    profile = profile_res.get('profile', {}) if profile_res.get('success') else {}

    calc_res = CalculationService.get_latest_calculation(user_id, access_token=token)
    latest_calc = calc_res.get('data') if calc_res.get('success') else None

    # Calculate quick stats
    eco_score = latest_calc.get('eco_score', 0) if latest_calc else 0
    total_co2 = latest_calc.get('total_emissions', 0) if latest_calc else 0

    return jsonify({
        "success": True,
        "profile": profile,
        "latest_calculation": latest_calc,
        "metrics": {
            "eco_score": eco_score,
            "total_emissions": total_co2,
            "has_calculation": latest_calc is not None
        }
    }), 200
