from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app.services.auth_service import AuthService
from email_validator import validate_email, EmailNotValidError

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if 'user' in session:
        return redirect(url_for('home.dashboard'))
        
    if request.method == 'POST':
        full_name = request.form.get('fullName')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirmPassword')
        terms = request.form.get('terms')
        
        if not all([full_name, email, password, confirm_password]):
            flash('All fields are required.', 'danger')
            return render_template('auth/register.html', request=request)
            
        if not terms:
            flash('You must accept the Terms and Conditions.', 'danger')
            return render_template('auth/register.html', request=request)
            
        if password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return render_template('auth/register.html', request=request)
            
        if len(password) < 8:
            flash('Password must be at least 8 characters long.', 'danger')
            return render_template('auth/register.html', request=request)
            
        try:
            # Validate email
            validate_email(email)
        except EmailNotValidError as e:
            flash(str(e), 'danger')
            return render_template('auth/register.html', request=request)
            
        result = AuthService.register_user(email, password, full_name)
        
        if result['success']:
            flash(result['message'], 'success')
            return redirect(url_for('auth.verify_email'))
        else:
            flash(result['error'], 'danger')
            
    return render_template('auth/register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if 'user' in session:
        return redirect(url_for('home.dashboard'))
        
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = request.form.get('remember')
        
        if not email or not password:
            flash('Email and password are required.', 'danger')
            return render_template('auth/login.html')
            
        result = AuthService.login_user(email, password)
        
        if result['success']:
            user = result['user']
            # Store necessary info in session
            session['user'] = {
                'id': user.id,
                'email': user.email
            }
            # Fetch profile to store in session
            profile_res = AuthService.get_user_profile(user.id)
            if profile_res['success']:
                session['user']['full_name'] = profile_res['profile'].get('full_name')
                session['user']['profile_image_url'] = profile_res['profile'].get('profile_image_url')
            else:
                # Profile missing (e.g., created before bug fix) — auto-create it now
                AuthService.ensure_user_profile(user.id, user.email)
                session['user']['full_name'] = user.email.split('@')[0]  # Use email prefix as fallback name
            
            if remember:
                session.permanent = True
            
            flash('Successfully logged in!', 'success')
            return redirect(url_for('home.dashboard'))
        else:
            flash(result['error'], 'danger')
            
    return render_template('auth/login.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('home.index'))

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if 'user' in session:
        return redirect(url_for('home.dashboard'))
        
    if request.method == 'POST':
        email = request.form.get('email')
        
        if not email:
            flash('Email is required.', 'danger')
            return render_template('auth/forgot_password.html')
            
        result = AuthService.reset_password_request(email)
        
        if result['success']:
            flash(result['message'], 'success')
        else:
            flash(result['error'], 'danger')
            
    return render_template('auth/forgot_password.html')

@auth_bp.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    if request.method == 'POST':
        access_token = request.form.get('access_token')
        new_password = request.form.get('password')
        confirm_password = request.form.get('confirmPassword')
        
        if not access_token:
            flash('Invalid or missing reset token. Please use the link sent to your email.', 'danger')
            return render_template('auth/reset_password.html')
            
        if not new_password or not confirm_password:
            flash('Both password fields are required.', 'danger')
            return render_template('auth/reset_password.html')
            
        if new_password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return render_template('auth/reset_password.html')
            
        if len(new_password) < 8:
            flash('Password must be at least 8 characters long.', 'danger')
            return render_template('auth/reset_password.html')
            
        result = AuthService.update_password(access_token, new_password)
        
        if result['success']:
            flash('Your password has been successfully reset. Please log in.', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash(result['error'], 'danger')
            
    return render_template('auth/reset_password.html')

@auth_bp.route('/verify-email')
def verify_email():
    return render_template('auth/verify_email.html')
