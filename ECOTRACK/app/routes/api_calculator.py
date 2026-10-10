from flask import Blueprint, request, jsonify, g
from app.services.calculation_service import CalculationService
from app.services.emission_factor_service import EmissionFactorService
from app.middleware.auth import token_required

api_calculator_bp = Blueprint('api_calculator', __name__, url_prefix='/api/calculator')

@api_calculator_bp.route('/calculate', methods=['POST'])
@token_required
def calculate():
    user = g.user
    form_data = request.get_json() or {}
    
    result = CalculationService.calculate_and_save(
        user_id=user['id'],
        form_data=form_data,
        access_token=user.get('access_token')
    )
    
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@api_calculator_bp.route('/<calc_id>', methods=['GET'])
@token_required
def get_calculation(calc_id):
    user = g.user
    result = CalculationService.get_calculation(
        user_id=user['id'],
        calc_id=calc_id,
        access_token=user.get('access_token')
    )
    
    status_code = 200 if result.get('success') else 404
    return jsonify(result), status_code

@api_calculator_bp.route('/latest', methods=['GET'])
@token_required
def get_latest():
    user = g.user
    result = CalculationService.get_latest_calculation(
        user_id=user['id'],
        access_token=user.get('access_token')
    )
    
    status_code = 200 if result.get('success') else 404
    return jsonify(result), status_code

@api_calculator_bp.route('/factors', methods=['GET'])
def get_factors():
    """Returns static emission factors for informative client UI tooltips."""
    return jsonify({
        "success": True,
        "transportation": EmissionFactorService.TRANSPORTATION,
        "electricity": EmissionFactorService.ELECTRICITY,
        "water": EmissionFactorService.WATER,
        "food": EmissionFactorService.FOOD,
        "waste": EmissionFactorService.WASTE,
        "shopping": EmissionFactorService.SHOPPING,
        "travel": EmissionFactorService.TRAVEL
    }), 200
