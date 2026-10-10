from flask import Blueprint, request, jsonify, g
from app.services.feedback_service import FeedbackService
from app.services.storage_service import StorageService
from app.middleware.auth import token_required

api_feedback_bp = Blueprint('api_feedback', __name__, url_prefix='/api/feedback')

@api_feedback_bp.route('', methods=['POST'])
@token_required
def create_feedback():
    user = g.user
    user_id = user['id']
    token = user.get('access_token')

    screenshot_url = None
    if 'screenshot' in request.files:
        file = request.files['screenshot']
        if file and file.filename != '':
            content_type = file.content_type or 'image/png'
            upload_res = StorageService.upload_image(
                file_stream=file.stream,
                filename=file.filename,
                content_type=content_type,
                bucket_name='feedback-images',
                access_token=token
            )
            if upload_res.get('success'):
                screenshot_url = upload_res.get('url')

    if request.is_json:
        data = request.get_json() or {}
    else:
        data = request.form.to_dict()

    feedback_type = data.get('feedback_type', 'General')
    subject = data.get('subject', '').strip()
    description = data.get('description', '').strip()
    try:
        rating = int(data.get('rating', 5))
    except (ValueError, TypeError):
        rating = 5

    if not subject or not description:
        return jsonify({"success": False, "error": "Subject and description are required."}), 400

    feedback_data = {
        "feedback_type": feedback_type,
        "subject": subject,
        "description": description,
        "rating": rating,
        "screenshot_url": screenshot_url or data.get('screenshot_url')
    }

    result = FeedbackService.create_feedback(
        user_id=user_id,
        feedback_data=feedback_data,
        access_token=token
    )

    status_code = 201 if result.get('success') else 400
    return jsonify(result), status_code

@api_feedback_bp.route('', methods=['GET'])
@token_required
def get_feedbacks():
    user = g.user
    user_id = user['id']
    token = user.get('access_token')

    status_filter = request.args.get('status', 'All')
    type_filter = request.args.get('type', 'All')
    search_query = request.args.get('search', '').strip()

    result = FeedbackService.get_feedbacks(
        user_id=user_id,
        status_filter=status_filter,
        type_filter=type_filter,
        search_query=search_query,
        access_token=token
    )

    status_code = 200 if result.get('success') else 500
    return jsonify(result), status_code

@api_feedback_bp.route('/<feedback_id>', methods=['GET'])
@token_required
def get_feedback(feedback_id):
    user = g.user
    result = FeedbackService.get_feedback_by_id(
        user_id=user['id'],
        feedback_id=feedback_id,
        access_token=user.get('access_token')
    )
    status_code = 200 if result.get('success') else 404
    return jsonify(result), status_code

@api_feedback_bp.route('/<feedback_id>', methods=['PUT'])
@token_required
def update_feedback(feedback_id):
    user = g.user
    data = request.get_json() or {}

    update_data = {
        "feedback_type": data.get('feedback_type'),
        "subject": data.get('subject'),
        "description": data.get('description'),
        "rating": data.get('rating')
    }
    update_data = {k: v for k, v in update_data.items() if v is not None}

    result = FeedbackService.update_feedback(
        user_id=user['id'],
        feedback_id=feedback_id,
        update_data=update_data,
        access_token=user.get('access_token')
    )

    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@api_feedback_bp.route('/<feedback_id>', methods=['DELETE'])
@token_required
def delete_feedback(feedback_id):
    user = g.user
    result = FeedbackService.delete_feedback(
        user_id=user['id'],
        feedback_id=feedback_id,
        access_token=user.get('access_token')
    )
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code
