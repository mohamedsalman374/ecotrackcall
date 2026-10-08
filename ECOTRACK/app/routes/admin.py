from flask import Blueprint, render_template, request, redirect, url_for, flash, Response, jsonify
from app.utils.auth import admin_required
from app.services.admin_service import AdminService
import json

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/', endpoint='index')
@admin_bp.route('/dashboard', endpoint='dashboard')
@admin_required
def dashboard():
    stats_res = AdminService.get_dashboard_stats()
    stats = stats_res.get('stats', {}) if stats_res.get('success') else {}
    
    analytics_res = AdminService.get_system_analytics()
    chart_data = analytics_res.get('data', {}) if analytics_res.get('success') else {}
    
    return render_template('admin/dashboard.html', stats=stats, chart_data=json.dumps(chart_data, default=str))

@admin_bp.route('/users')
@admin_required
def users():
    search = request.args.get('search', '')
    role = request.args.get('role', 'all')
    
    res = AdminService.get_users(search, role)
    users_list = res.get('data', []) if res.get('success') else []
    
    return render_template('admin/users.html', users=users_list, search=search, current_role=role)

@admin_bp.route('/users/<user_id>/update', methods=['POST'])
@admin_required
def update_user(user_id):
    action = request.form.get('action')
    
    if action == 'toggle_status':
        is_active = request.form.get('is_active') == 'true'
        res = AdminService.toggle_user_status(user_id, is_active)
        if res.get('success'):
            flash(f"User status updated.", "success")
        else:
            flash("Failed to update user status.", "danger")
            
    elif action == 'change_role':
        new_role = request.form.get('role')
        if new_role in ['user', 'admin']:
            res = AdminService.update_user_role(user_id, new_role)
            if res.get('success'):
                flash(f"User role updated to {new_role}.", "success")
            else:
                flash("Failed to update user role.", "danger")
                
    return redirect(url_for('admin.users'))

@admin_bp.route('/users/<user_id>/delete', methods=['POST'])
@admin_required
def delete_user(user_id):
    res = AdminService.delete_user(user_id)
    if res.get('success'):
        flash("User deleted successfully.", "success")
    else:
        flash("Failed to delete user.", "danger")
    return redirect(url_for('admin.users'))

@admin_bp.route('/calculations')
@admin_required
def calculations():
    search = request.args.get('search', '')
    res = AdminService.get_all_calculations(search)
    calcs = res.get('data', []) if res.get('success') else []
    return render_template('admin/calculations.html', calculations=calcs, search=search)

@admin_bp.route('/calculations/<calc_id>/delete', methods=['POST'])
@admin_required
def delete_calculation(calc_id):
    res = AdminService.delete_calculation(calc_id)
    if res.get('success'):
        flash("Calculation deleted.", "success")
    else:
        flash("Failed to delete calculation.", "danger")
    return redirect(url_for('admin.calculations'))

@admin_bp.route('/feedback')
@admin_required
def feedback():
    search = request.args.get('search', '')
    status = request.args.get('status', 'all')
    
    res = AdminService.get_all_feedback(search, status)
    feedbacks = res.get('data', []) if res.get('success') else []
    
    return render_template('admin/feedback.html', feedbacks=feedbacks, search=search, current_status=status)

@admin_bp.route('/feedback/<feedback_id>/update', methods=['POST'])
@admin_required
def update_feedback(feedback_id):
    status = request.form.get('status')
    admin_response = request.form.get('admin_response')
    
    if status in ['Pending', 'In Review', 'Resolved', 'Closed']:
        res = AdminService.update_feedback_status(feedback_id, status, admin_response)
        if res.get('success'):
            flash("Feedback updated successfully.", "success")
        else:
            flash("Failed to update feedback.", "danger")
            
    return redirect(url_for('admin.feedback'))

@admin_bp.route('/feedback/<feedback_id>/delete', methods=['POST'])
@admin_required
def delete_feedback(feedback_id):
    res = AdminService.delete_feedback(feedback_id)
    if res.get('success'):
        flash("Feedback deleted.", "success")
    else:
        flash("Failed to delete feedback.", "danger")
    return redirect(url_for('admin.feedback'))

@admin_bp.route('/reports')
@admin_required
def reports():
    return render_template('admin/reports.html')

@admin_bp.route('/reports/export/<report_type>/<format>')
@admin_required
def export(report_type, format):
    if report_type == 'users':
        res = AdminService.get_users()
        data = res.get('data', [])
        
        if format == 'csv':
            csv_data = AdminService.generate_users_csv(data)
            return Response(csv_data, mimetype="text/csv", headers={"Content-disposition": "attachment; filename=users_report.csv"})
        elif format == 'pdf':
            pdf_data = AdminService.generate_users_pdf(data)
            return Response(pdf_data, mimetype="application/pdf", headers={"Content-disposition": "attachment; filename=users_report.pdf"})
            
    # Additional reports (calculations, feedback) can be added here following the same pattern
    flash("Report type not supported yet.", "warning")
    return redirect(url_for('admin.reports'))

@admin_bp.route('/settings')
@admin_required
def settings():
    return render_template('admin/settings.html')
