from flask import Blueprint, request, jsonify, Response
from app.services.admin_service import AdminService
from app.middleware.auth import admin_required

api_admin_bp = Blueprint('api_admin', __name__, url_prefix='/api/admin')

@api_admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    result = AdminService.get_dashboard_stats()
    status_code = 200 if result.get('success') else 500
    return jsonify(result), status_code

@api_admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    search = request.args.get('search', '').strip()
    role = request.args.get('role', 'all')
    
    result = AdminService.get_users(search_query=search, role_filter=role)
    status_code = 200 if result.get('success') else 500
    return jsonify(result), status_code

@api_admin_bp.route('/users/<user_id>/role', methods=['POST'])
@admin_required
def update_user_role(user_id):
    data = request.get_json() or {}
    role = data.get('role')
    if role not in ['user', 'admin']:
        return jsonify({"success": False, "error": "Invalid role."}), 400
        
    result = AdminService.update_user_role(user_id, role)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@api_admin_bp.route('/users/<user_id>/status', methods=['POST'])
@admin_required
def toggle_user_status(user_id):
    data = request.get_json() or {}
    is_active = bool(data.get('is_active', True))
    
    result = AdminService.toggle_user_status(user_id, is_active)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@api_admin_bp.route('/users/<user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    result = AdminService.delete_user(user_id)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@api_admin_bp.route('/calculations', methods=['GET'])
@admin_required
def get_calculations():
    search = request.args.get('search', '').strip()
    result = AdminService.get_all_calculations(search_query=search)
    status_code = 200 if result.get('success') else 500
    return jsonify(result), status_code

@api_admin_bp.route('/calculations/<calc_id>', methods=['DELETE'])
@admin_required
def delete_calculation(calc_id):
    result = AdminService.delete_calculation(calc_id)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@api_admin_bp.route('/feedback', methods=['GET'])
@admin_required
def get_feedback():
    search = request.args.get('search', '').strip()
    status = request.args.get('status', 'all')
    result = AdminService.get_all_feedback(search_query=search, status_filter=status)
    status_code = 200 if result.get('success') else 500
    return jsonify(result), status_code

@api_admin_bp.route('/feedback/<feedback_id>/respond', methods=['POST'])
@admin_required
def respond_feedback(feedback_id):
    data = request.get_json() or {}
    status = data.get('status', 'Resolved')
    admin_response = data.get('admin_response', '')

    result = AdminService.update_feedback_status(
        feedback_id=feedback_id,
        status=status,
        admin_response=admin_response
    )
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@api_admin_bp.route('/feedback/<feedback_id>', methods=['DELETE'])
@admin_required
def delete_feedback(feedback_id):
    result = AdminService.delete_feedback(feedback_id)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@api_admin_bp.route('/analytics', methods=['GET'])
@admin_required
def get_analytics():
    result = AdminService.get_system_analytics()
    status_code = 200 if result.get('success') else 500
    return jsonify(result), status_code

@api_admin_bp.route('/export/<report_type>', methods=['GET'])
@admin_required
def export_report(report_type):
    fmt = request.args.get('format', 'csv').lower()
    
    if report_type == 'users':
        users_res = AdminService.get_users()
        users_data = users_res.get('data', [])
        
        if fmt == 'csv':
            csv_content = AdminService.generate_users_csv(users_data)
            return Response(
                csv_content,
                mimetype="text/csv",
                headers={"Content-disposition": "attachment; filename=users_report.csv"}
            )
        elif fmt == 'pdf':
            pdf_bytes = AdminService.generate_users_pdf(users_data)
            return Response(
                pdf_bytes,
                mimetype="application/pdf",
                headers={"Content-disposition": "attachment; filename=users_report.pdf"}
            )
            
    return jsonify({"success": False, "error": "Unsupported report type or format."}), 400
