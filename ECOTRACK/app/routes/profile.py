from flask import Blueprint, render_template, request, session, redirect, url_for, flash, current_app
from app.utils.auth import login_required
from app.services.auth_service import AuthService
from app.services.profile_service import ProfileService
from app.services.storage_service import StorageService
import os

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile', methods=['GET'])
@login_required
def index():
    user_session = session.get('user')
    user_id = user_session.get('id')
    
    # Get profile data
    profile_response = AuthService.get_user_profile(user_id)
    profile = profile_response.get('profile', {}) if profile_response.get('success') else {}
    
    return render_template('profile/profile.html', profile=profile)

@profile_bp.route('/profile/update', methods=['POST'])
@login_required
def update():
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    full_name = request.form.get('full_name')
    email = request.form.get('email')
    
    # Preferences
    theme = request.form.get('theme', 'system')
    language = request.form.get('language', 'en')
    email_notifications = request.form.get('email_notifications') == 'on'
    weekly_reminder = request.form.get('weekly_reminder') == 'on'
    monthly_reminder = request.form.get('monthly_reminder') == 'on'
    
    # Get current profile to check if email changed
    current_profile = AuthService.get_user_profile(user_id).get('profile', {})
    
    profile_data = {
        "full_name": full_name,
        "theme": theme,
        "language": language,
        "email_notifications": email_notifications,
        "weekly_reminder": weekly_reminder,
        "monthly_reminder": monthly_reminder
    }
    
    # Handle email update separately via Auth if changed
    if email and email != current_profile.get('email'):
        email_res = ProfileService.update_email(user_id, email, access_token, refresh_token)
        if not email_res.get('success'):
            flash(email_res.get('error'), 'danger')
            return redirect(url_for('profile.index'))
        else:
            flash(email_res.get('message'), 'info')
            # Also update in public.users
            profile_data['email'] = email
            
    # Update public.users
    update_res = ProfileService.update_profile(user_id, profile_data, access_token, refresh_token)
    
    if update_res.get('success'):
        flash("Profile updated successfully.", "success")
    else:
        flash("Failed to update profile details.", "danger")
        
    return redirect(url_for('profile.index'))

@profile_bp.route('/profile/password', methods=['POST'])
@login_required
def change_password():
    user_session = session.get('user')
    email = user_session.get('email')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')
    
    if new_password != confirm_password:
        flash("New passwords do not match.", "danger")
        return redirect(url_for('profile.index'))
        
    # Verify current password by attempting to log in again
    auth_res = AuthService.login_user(email, current_password)
    if not auth_res.get('success'):
        flash("Incorrect current password.", "danger")
        return redirect(url_for('profile.index'))
        
    # Change password
    res = ProfileService.change_password(new_password, access_token, refresh_token)
    
    if res.get('success'):
        flash(res.get('message'), "success")
    else:
        flash(res.get('error'), "danger")
        
    return redirect(url_for('profile.index'))

@profile_bp.route('/profile/image', methods=['POST'])
@login_required
def upload_image():
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    if 'profile_image' not in request.files:
        flash("No file provided.", "danger")
        return redirect(url_for('profile.index'))
        
    file = request.files['profile_image']
    if file.filename == '':
        flash("No file selected.", "danger")
        return redirect(url_for('profile.index'))
        
    # Validate file size (5MB)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    if file_length > 5 * 1024 * 1024:
        flash("File exceeds maximum size of 5MB.", "danger")
        return redirect(url_for('profile.index'))
    file.seek(0, 0)
    
    # Validate format
    allowed_types = ['image/jpeg', 'image/png', 'image/webp']
    if file.content_type not in allowed_types:
        flash("Unsupported file format. Please use JPG, PNG, or WEBP.", "danger")
        return redirect(url_for('profile.index'))
        
    # Get current profile to remove old image if exists
    current_profile = AuthService.get_user_profile(user_id).get('profile', {})
    old_url = current_profile.get('profile_image_url')
    
    # Upload new image
    upload_res = StorageService.upload_image(
        file, file.filename, file.content_type, 'profile-images', access_token, refresh_token
    )
    
    if upload_res.get('success'):
        new_url = upload_res.get('url')
        # Update user profile
        ProfileService.update_profile(user_id, {"profile_image_url": new_url}, access_token, refresh_token)
        
        # Remove old image
        if old_url:
            StorageService.remove_image(old_url, 'profile-images', access_token, refresh_token)
            
        flash("Profile picture updated.", "success")
    else:
        flash(f"Failed to upload image: {upload_res.get('error')}", "danger")
        
    return redirect(url_for('profile.index'))

@profile_bp.route('/profile/image/remove', methods=['POST'])
@login_required
def remove_image():
    user_session = session.get('user')
    user_id = user_session.get('id')
    access_token = user_session.get('access_token')
    refresh_token = user_session.get('refresh_token')
    
    current_profile = AuthService.get_user_profile(user_id).get('profile', {})
    old_url = current_profile.get('profile_image_url')
    
    if old_url:
        StorageService.remove_image(old_url, 'profile-images', access_token, refresh_token)
        ProfileService.update_profile(user_id, {"profile_image_url": None}, access_token, refresh_token)
        flash("Profile picture removed.", "success")
    else:
        flash("No profile picture to remove.", "warning")
        
    return redirect(url_for('profile.index'))
