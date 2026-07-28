import os
from flask import Blueprint, render_template, request, session, redirect, url_for, flash, jsonify
from app.utils.auth import login_required
from app.services.auth_service import AuthService
from app.services.feedback_service import FeedbackService
from app.services.storage_service import StorageService

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/feedback/new', methods=['GET'])
@login_required
def new():
    user_session = session.get('user')
    user_id = user_session.get('id')
    
    # Get profile data
    profile_response = AuthService.get_user_profile(user_id)
    profile = profile_response.get('profile', {}) if profile_response.get('success') else {}
    
    return render_template('feedback/feedback.html', profile=profile, edit_mode=False)

@feedback_bp.route('/feedback/submit', methods=['POST'])
@login_required
def submit():
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    feedback_type = request.form.get('feedback_type')
    subject = request.form.get('subject')
    description = request.form.get('description')
    rating = request.form.get('rating')
    
    # Validation
    if not feedback_type or not subject or not description:
        flash("Please fill in all required fields.", "danger")
        return redirect(url_for('feedback.new'))
        
    rating = int(rating) if rating else None
    
    feedback_data = {
        "feedback_type": feedback_type,
        "subject": subject,
        "description": description,
        "rating": rating,
        "status": "Pending"
    }
    
    # Handle Screenshot Upload
    if 'screenshot' in request.files:
        file = request.files['screenshot']
        if file.filename != '':
            # Validate file size (5MB)
            file.seek(0, os.SEEK_END)
            file_length = file.tell()
            if file_length > 5 * 1024 * 1024:
                flash("Screenshot exceeds maximum size of 5MB.", "danger")
                return redirect(url_for('feedback.new'))
            file.seek(0, 0)
            
            allowed_types = ['image/jpeg', 'image/png', 'image/webp']
            if file.content_type not in allowed_types:
                flash("Unsupported file format. Please use JPG, PNG, or WEBP.", "danger")
                return redirect(url_for('feedback.new'))
                
            upload_res = StorageService.upload_image(
                file, file.filename, file.content_type, 'feedback-images', access_token, refresh_token
            )
            
            if upload_res.get('success'):
                feedback_data["screenshot_url"] = upload_res.get('url')
            else:
                flash(f"Failed to upload screenshot: {upload_res.get('error')}", "danger")
                return redirect(url_for('feedback.new'))
                
    # Save Feedback
    res = FeedbackService.create_feedback(user_id, feedback_data, access_token, refresh_token)
    
    if res.get('success'):
        flash("Feedback submitted successfully!", "success")
        return redirect(url_for('feedback.history'))
    else:
        flash("Failed to submit feedback.", "danger")
        return redirect(url_for('feedback.new'))

@feedback_bp.route('/feedback/history', methods=['GET'])
@login_required
def history():
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    profile_response = AuthService.get_user_profile(user_id)
    profile = profile_response.get('profile', {}) if profile_response.get('success') else {}
    
    status_filter = request.args.get('status', 'All')
    type_filter = request.args.get('type', 'All')
    search_query = request.args.get('search', '')
    
    res = FeedbackService.get_feedbacks(
        user_id, status_filter, type_filter, search_query, access_token, refresh_token
    )
    
    feedbacks = res.get('data', []) if res.get('success') else []
    
    return render_template('feedback/history.html', 
                           profile=profile, 
                           feedbacks=feedbacks,
                           current_status=status_filter,
                           current_type=type_filter,
                           search_query=search_query)

@feedback_bp.route('/feedback/<feedback_id>/edit', methods=['GET'])
@login_required
def edit(feedback_id):
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    profile_response = AuthService.get_user_profile(user_id)
    profile = profile_response.get('profile', {}) if profile_response.get('success') else {}
    
    res = FeedbackService.get_feedback_by_id(user_id, feedback_id, access_token, refresh_token)
    
    if not res.get('success'):
        flash(res.get('error'), "danger")
        return redirect(url_for('feedback.history'))
        
    feedback = res.get('data')
    
    if feedback.get('status') != 'Pending':
        flash("Only pending feedback can be edited.", "warning")
        return redirect(url_for('feedback.history'))
        
    return render_template('feedback/feedback.html', profile=profile, edit_mode=True, feedback=feedback)

@feedback_bp.route('/feedback/<feedback_id>/update', methods=['POST'])
@login_required
def update(feedback_id):
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    feedback_type = request.form.get('feedback_type')
    subject = request.form.get('subject')
    description = request.form.get('description')
    rating = request.form.get('rating')
    
    if not feedback_type or not subject or not description:
        flash("Please fill in all required fields.", "danger")
        return redirect(url_for('feedback.edit', feedback_id=feedback_id))
        
    rating = int(rating) if rating else None
    
    update_data = {
        "feedback_type": feedback_type,
        "subject": subject,
        "description": description,
        "rating": rating
    }
    
    # Handle Screenshot replacement
    if 'screenshot' in request.files:
        file = request.files['screenshot']
        if file.filename != '':
            # Validate size
            file.seek(0, os.SEEK_END)
            if file.tell() > 5 * 1024 * 1024:
                flash("Screenshot exceeds 5MB.", "danger")
                return redirect(url_for('feedback.edit', feedback_id=feedback_id))
            file.seek(0, 0)
            
            allowed_types = ['image/jpeg', 'image/png', 'image/webp']
            if file.content_type not in allowed_types:
                flash("Unsupported format.", "danger")
                return redirect(url_for('feedback.edit', feedback_id=feedback_id))
                
            upload_res = StorageService.upload_image(
                file, file.filename, file.content_type, 'feedback-images', access_token, refresh_token
            )
            
            if upload_res.get('success'):
                update_data["screenshot_url"] = upload_res.get('url')
                # Try to remove old
                current_feedback = FeedbackService.get_feedback_by_id(user_id, feedback_id, access_token, refresh_token)
                if current_feedback.get('success') and current_feedback['data'].get('screenshot_url'):
                    StorageService.remove_image(current_feedback['data']['screenshot_url'], 'feedback-images', access_token, refresh_token)
            else:
                flash(f"Failed to upload screenshot: {upload_res.get('error')}", "danger")
                return redirect(url_for('feedback.edit', feedback_id=feedback_id))
                
    res = FeedbackService.update_feedback(user_id, feedback_id, update_data, access_token, refresh_token)
    
    if res.get('success'):
        flash("Feedback updated successfully.", "success")
    else:
        flash(res.get('error'), "danger")
        
    return redirect(url_for('feedback.history'))

@feedback_bp.route('/feedback/<feedback_id>/delete', methods=['POST'])
@login_required
def delete(feedback_id):
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    # Check if there is an image to delete first
    current_feedback = FeedbackService.get_feedback_by_id(user_id, feedback_id, access_token, refresh_token)
    if current_feedback.get('success') and current_feedback['data'].get('screenshot_url'):
        StorageService.remove_image(current_feedback['data']['screenshot_url'], 'feedback-images', access_token, refresh_token)
        
    res = FeedbackService.delete_feedback(user_id, feedback_id, access_token, refresh_token)
    
    if res.get('success'):
        flash("Feedback deleted.", "success")
    else:
        flash(res.get('error'), "danger")
        
    return redirect(url_for('feedback.history'))
