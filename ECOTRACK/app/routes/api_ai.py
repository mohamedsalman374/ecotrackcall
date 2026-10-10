from flask import Blueprint, request, jsonify, g
from app.services.calculation_service import CalculationService
from app.services.auth_service import AuthService
from app.services.gemini_service import GeminiService
from app.middleware.auth import token_required

api_ai_bp = Blueprint('api_ai', __name__, url_prefix='/api/ai')

@api_ai_bp.route('/recommendations', methods=['GET'])
@token_required
def get_recommendations():
    user = g.user
    user_id = user['id']
    token = user.get('access_token')

    rec_res = GeminiService.get_latest_recommendation(user_id, access_token=token)
    
    # Also fetch latest calculation so the UI has context
    calc_res = CalculationService.get_latest_calculation(user_id, access_token=token)
    latest_calc = calc_res.get('data') if calc_res.get('success') else None

    return jsonify({
        "success": True,
        "recommendation": rec_res.get('data') if rec_res.get('success') else None,
        "latest_calculation": latest_calc
    }), 200

@api_ai_bp.route('/generate', methods=['POST'])
@token_required
def generate_recommendation():
    user = g.user
    user_id = user['id']
    token = user.get('access_token')
    data = request.get_json() or {}
    
    calc_id = data.get('calculation_id')
    if calc_id:
        calc_res = CalculationService.get_calculation(user_id, calc_id, access_token=token)
    else:
        calc_res = CalculationService.get_latest_calculation(user_id, access_token=token)
        
    latest_calc = calc_res.get('data') if calc_res.get('success') else None
    if not latest_calc:
        return jsonify({
            "success": False,
            "error": "You need to complete a Carbon Footprint Calculation before generating AI recommendations."
        }), 400

    profile_res = AuthService.get_user_profile(user_id, access_token=token)
    profile = profile_res.get('profile', {}) if profile_res.get('success') else {}

    result = GeminiService.generate_recommendation(
        user_id=user_id,
        calculation_data=latest_calc,
        profile=profile,
        access_token=token
    )

    status_code = 200 if result.get('success') else 500
    return jsonify(result), status_code
