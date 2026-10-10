from flask import Blueprint, request, jsonify, g, session
from app.services.auth_service import AuthService
from app.services.supabase_service import SupabaseService
from app.middleware.auth import token_required

api_auth_bp = Blueprint('api_auth', __name__, url_prefix='/api/auth')

@api_auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    password = data.get('password', '')
    full_name = data.get('full_name', '').strip()

    if not email or not password or not full_name:
        return jsonify({"success": False, "error": "Email, password, and full name are required."}), 400

    result = AuthService.register_user(email=email, password=password, full_name=full_name)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@api_auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required."}), 400

    result = AuthService.login_user(email=email, password=password)
    if result.get('success'):
        user_data = result.get('user', {})
        # Save session as well for hybrid clients
        session['user'] = user_data
        session.permanent = True
        return jsonify(result), 200
    return jsonify(result), 401

@api_auth_bp.route('/logout', methods=['POST'])
def logout():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.split(" ", 1)[1] if auth_header.startswith("Bearer ") else None
    
    AuthService.logout_user(access_token=token)
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"}), 200

@api_auth_bp.route('/me', methods=['GET'])
@token_required
def me():
    user = g.user
    profile_res = AuthService.get_user_profile(user['id'], access_token=user.get('access_token'))
    profile = profile_res.get('profile', {}) if profile_res.get('success') else {}
    
    return jsonify({
        "success": True,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "role": profile.get('role', user.get('role', 'user')),
            "full_name": profile.get('full_name', user.get('user_metadata', {}).get('full_name', '')),
            "profile": profile
        }
    }), 200

@api_auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    redirect_to = data.get('redirect_to')

    if not email:
        return jsonify({"success": False, "error": "Email is required."}), 400

    result = AuthService.reset_password_request(email=email, redirect_to=redirect_to)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@api_auth_bp.route('/reset-password', methods=['POST'])
@token_required
def reset_password():
    data = request.get_json() or {}
    new_password = data.get('password', '')
    
    if not new_password or len(new_password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters long."}), 400
        
    result = AuthService.update_password(access_token=g.user['access_token'], new_password=new_password)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code
