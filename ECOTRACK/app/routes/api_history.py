from flask import Blueprint, request, jsonify, g, Response
from app.services.history_service import HistoryService
from app.services.auth_service import AuthService
from app.middleware.auth import token_required

api_history_bp = Blueprint('api_history', __name__, url_prefix='/api/history')

@api_history_bp.route('', methods=['GET'])
@token_required
def get_history():
    user = g.user
    user_id = user['id']
    token = user.get('access_token')

    date_range = request.args.get('date_range', 'all_time')
    sort_by = request.args.get('sort_by', 'newest')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))

    filters = {'date_range': date_range}
    
    result = HistoryService.get_history(
        user_id=user_id,
        filters=filters,
        sort_by=sort_by,
        page=page,
        limit=limit,
        access_token=token
    )

    status_code = 200 if result.get('success') else 500
    return jsonify(result), status_code

@api_history_bp.route('/<calc_id>', methods=['GET'])
@token_required
def get_details(calc_id):
    user = g.user
    result = HistoryService.get_calculation_details(
        user_id=user['id'],
        calc_id=calc_id,
        access_token=user.get('access_token')
    )
    status_code = 200 if result.get('success') else 404
    return jsonify(result), status_code

@api_history_bp.route('/<calc_id>', methods=['DELETE'])
@token_required
def delete_single(calc_id):
    user = g.user
    result = HistoryService.delete_calculations(
        user_id=user['id'],
        calc_ids=[calc_id],
        access_token=user.get('access_token')
    )
    status_code = 200 if result.get('success') else 500
    return jsonify(result), status_code

@api_history_bp.route('/delete-batch', methods=['POST'])
@token_required
def delete_batch():
    user = g.user
    data = request.get_json() or {}
    calc_ids = data.get('calc_ids', [])
    
    if not calc_ids:
        return jsonify({"success": False, "error": "No calculation IDs provided."}), 400

    result = HistoryService.delete_calculations(
        user_id=user['id'],
        calc_ids=calc_ids,
        access_token=user.get('access_token')
    )
    status_code = 200 if result.get('success') else 500
    return jsonify(result), status_code

@api_history_bp.route('/all', methods=['DELETE'])
@token_required
def delete_all():
    user = g.user
    result = HistoryService.delete_all_history(
        user_id=user['id'],
        access_token=user.get('access_token')
    )
    status_code = 200 if result.get('success') else 500
    return jsonify(result), status_code

@api_history_bp.route('/export/<format>', methods=['GET'])
@token_required
def export_history(format):
    user = g.user
    user_id = user['id']
    token = user.get('access_token')

    # Fetch all records for export (limit 500)
    history_res = HistoryService.get_history(user_id=user_id, limit=500, access_token=token)
    records = history_res.get('data', [])

    if format == 'csv':
        csv_data = HistoryService.generate_csv(records)
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=ecotrack_history.csv"}
        )
    elif format == 'pdf':
        profile_res = AuthService.get_user_profile(user_id, access_token=token)
        profile = profile_res.get('profile', {}) if profile_res.get('success') else {}
        pdf_bytes = HistoryService.generate_pdf(records, profile)
        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={"Content-disposition": "attachment; filename=ecotrack_history.pdf"}
        )
    else:
        return jsonify({"success": False, "error": "Invalid format. Supported: csv, pdf"}), 400
