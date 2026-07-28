from flask import Blueprint, render_template, session, request, redirect, url_for, flash, Response, jsonify
from app.utils.auth import login_required
from app.services.auth_service import AuthService
from app.services.history_service import HistoryService
import math

history_bp = Blueprint('history', __name__)

@history_bp.route('/history', methods=['GET'])
@login_required
def index():
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    # Get profile
    profile_response = AuthService.get_user_profile(user_id)
    profile = profile_response.get('profile', {}) if profile_response.get('success') else {}
    
    # Get filters, sorting, pagination
    date_filter = request.args.get('date_filter', 'all_time')
    sort_by = request.args.get('sort', 'newest')
    page = int(request.args.get('page', 1))
    limit = 10
    
    filters = {'date_range': date_filter}
    
    history_response = HistoryService.get_history(
        user_id, filters, sort_by, page, limit, access_token, refresh_token
    )
    
    if not history_response.get('success'):
        flash(f"Could not load history: {history_response.get('error')}", "danger")
        return redirect(url_for('dashboard.dashboard'))
        
    records = history_response.get('data', [])
    total_count = history_response.get('total', 0)
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
    
    avg_score = 0
    if records:
        avg_score = sum(r.get('eco_score', 0) for r in records) / len(records)
        
    return render_template('history/history.html', 
                           profile=profile,
                           records=records,
                           total_count=total_count,
                           avg_score=round(avg_score, 1),
                           current_filter=date_filter,
                           current_sort=sort_by,
                           current_page=page,
                           total_pages=total_pages)

@history_bp.route('/history/<calc_id>', methods=['GET'])
@login_required
def detail(calc_id):
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    profile_response = AuthService.get_user_profile(user_id)
    profile = profile_response.get('profile', {}) if profile_response.get('success') else {}
    
    detail_response = HistoryService.get_calculation_details(
        user_id, calc_id, access_token, refresh_token
    )
    
    if not detail_response.get('success'):
        flash(f"Could not load calculation details: {detail_response.get('error')}", "danger")
        return redirect(url_for('history.index'))
        
    calc = detail_response.get('calculation')
    ai_rec = detail_response.get('ai_recommendation')
    
    return render_template('history/detail.html', 
                           profile=profile,
                           calc=calc,
                           ai_rec=ai_rec)

@history_bp.route('/history/delete', methods=['POST'])
@login_required
def delete():
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    data = request.get_json()
    if not data or 'ids' not in data:
        return jsonify({"success": False, "error": "No IDs provided"}), 400
        
    ids = data['ids']
    
    if data.get('delete_all') is True:
        # Delete all history
        result = HistoryService.delete_all_history(user_id, access_token, refresh_token)
    else:
        # Delete specific IDs
        result = HistoryService.delete_calculations(user_id, ids, access_token, refresh_token)
        
    if result.get('success'):
        flash(f"Successfully deleted {result.get('deleted_count')} record(s).", "success")
        return jsonify(result)
    else:
        return jsonify(result), 500

@history_bp.route('/history/export/csv', methods=['GET'])
@login_required
def export_csv():
    user_session = session.get('user')
    user_id = user_session.get('id')
    
    date_filter = request.args.get('date_filter', 'all_time')
    sort_by = request.args.get('sort', 'newest')
    
    # Get all records for export, limit to a high number
    history_response = HistoryService.get_history(
        user_id, {'date_range': date_filter}, sort_by, 1, 10000, 
        user_session.get('access_token'), user_session.get('refresh_token')
    )
    
    if not history_response.get('success'):
        flash("Export failed.", "danger")
        return redirect(url_for('history.index'))
        
    csv_data = HistoryService.generate_csv(history_response.get('data', []))
    
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=ecotrack_history.csv"}
    )

@history_bp.route('/history/export/pdf', methods=['GET'])
@login_required
def export_pdf():
    user_session = session.get('user')
    user_id = user_session.get('id')
    
    # Get profile for PDF header
    profile_response = AuthService.get_user_profile(user_id)
    profile = profile_response.get('profile', {}) if profile_response.get('success') else {}
    
    date_filter = request.args.get('date_filter', 'all_time')
    sort_by = request.args.get('sort', 'newest')
    
    history_response = HistoryService.get_history(
        user_id, {'date_range': date_filter}, sort_by, 1, 10000, 
        user_session.get('access_token'), user_session.get('refresh_token')
    )
    
    if not history_response.get('success'):
        flash("Export failed.", "danger")
        return redirect(url_for('history.index'))
        
    pdf_data = HistoryService.generate_pdf(history_response.get('data', []), profile)
    
    return Response(
        pdf_data,
        mimetype="application/pdf",
        headers={"Content-disposition": "attachment; filename=ecotrack_history.pdf"}
    )
