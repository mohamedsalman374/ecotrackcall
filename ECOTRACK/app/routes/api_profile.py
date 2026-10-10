from flask import Blueprint, request, jsonify, g
from app.services.auth_service import AuthService
from app.services.profile_service import ProfileService
from app.services.storage_service import StorageService
from app.middleware.auth import token_required

api_profile_bp = Blueprint('api_profile', __name__, url_prefix='/api/profile')

@api_profile_bp.route('', methods=['GET'])
@token_required
def get_profile():
    user = g.user
    result = AuthService.get_user_profile(user['id'], access_token=user.get('access_token'))
    if result.get('success'):
        return jsonify(result), 200
    return jsonify({
        "success": True,
        "profile": {
            "id": user['id'],
            "email": user.get('email', ''),
            "full_name": user.get('user_metadata', {}).get('full_name', ''),
            "theme": "light",
            "language": "en",
            "role": user.get('role', 'user'),
            "email_notifications": True,
            "weekly_reminder": True,
            "monthly_reminder": True
        }
    }), 200

@api_profile_bp.route('', methods=['PUT'])
@token_required
def update_profile():
    user = g.user
    user_id = user['id']
    token = user.get('access_token')
    data = request.get_json() or {}

    profile_data = {
        "full_name": data.get('full_name', '').strip(),
        "theme": data.get('theme', 'light'),
        "language": data.get('language', 'en'),
        "email_notifications": bool(data.get('email_notifications', True)),
        "weekly_reminder": bool(data.get('weekly_reminder', True)),
        "monthly_reminder": bool(data.get('monthly_reminder', True))
    }

    result = ProfileService.update_profile(
        user_id=user_id,
        profile_data=profile_data,
        access_token=token
    )

    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@api_profile_bp.route('/avatar', methods=['POST'])
@token_required
def upload_avatar():
    user = g.user
    user_id = user['id']
    token = user.get('access_token')

    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded."}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"success": False, "error": "No file selected."}), 400

    allowed_exts = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if ext not in allowed_exts:
        return jsonify({"success": False, "error": f"Invalid format. Allowed: {', '.join(allowed_exts)}"}), 400

    content_type = file.content_type or 'image/jpeg'
    upload_res = StorageService.upload_image(
        file_stream=file.stream,
        filename=file.filename,
        content_type=content_type,
        bucket_name='profile-images',
        access_token=token
    )

    if not upload_res.get('success'):
        return jsonify(upload_res), 500

    avatar_url = upload_res.get('url')
    # Update profile in database
    ProfileService.update_profile(
        user_id=user_id,
        profile_data={"profile_image_url": avatar_url},
        access_token=token
    )

    return jsonify({
        "success": True,
        "avatar_url": avatar_url,
        "message": "Avatar uploaded successfully."
    }), 200

@api_profile_bp.route('/avatar', methods=['DELETE'])
@token_required
def remove_avatar():
    user = g.user
    user_id = user['id']
    token = user.get('access_token')

    profile_res = AuthService.get_user_profile(user_id, access_token=token)
    profile = profile_res.get('profile', {}) if profile_res.get('success') else {}
    current_img = profile.get('profile_image_url')

    if current_img:
        StorageService.remove_image(current_img, bucket_name='profile-images', access_token=token)

    ProfileService.update_profile(
        user_id=user_id,
        profile_data={"profile_image_url": None},
        access_token=token
    )

    return jsonify({"success": True, "message": "Avatar removed successfully."}), 200

@api_profile_bp.route('/password', methods=['POST'])
@token_required
def change_password():
    user = g.user
    token = user.get('access_token')
    data = request.get_json() or {}

    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if new_password != confirm_password:
        return jsonify({"success": False, "error": "Passwords do not match."}), 400

    result = ProfileService.change_password(new_password=new_password, access_token=token)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code
