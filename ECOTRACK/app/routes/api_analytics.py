from flask import Blueprint, request, jsonify, g
from app.services.analytics_service import AnalyticsService
from app.services.auth_service import AuthService
from app.middleware.auth import token_required

api_analytics_bp = Blueprint('api_analytics', __name__, url_prefix='/api/analytics')

@api_analytics_bp.route('', methods=['GET'])
@token_required
def get_analytics():
    user = g.user
    user_id = user['id']
    token = user.get('access_token')

    time_filter = request.args.get('filter', 'all_time')

    profile_res = AuthService.get_user_profile(user_id, access_token=token)
    profile = profile_res.get('profile', {}) if profile_res.get('success') else {}

    result = AnalyticsService.get_user_analytics(
        user_id=user_id,
        filter_type=time_filter,
        access_token=token
    )

    if not result.get('success'):
        return jsonify(result), 500

    return jsonify({
        "success": True,
        "profile": profile,
        "current_filter": time_filter,
        "analytics": result.get('data')
    }), 200
