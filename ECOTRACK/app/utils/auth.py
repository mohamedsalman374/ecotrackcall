from flask import session, redirect, url_for, flash
from functools import wraps

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('auth.login'))
            
        user = session.get('user')
        # We need to fetch the latest role from the database, or assume it's in the session.
        # It's safer to check the database since role can change.
        from app.services.auth_service import AuthService
        profile_res = AuthService.get_user_profile(user.get('id'))
        
        if not profile_res.get('success') or profile_res.get('profile', {}).get('role') != 'admin':
            return "Access Denied: You do not have permission to view this page.", 403
            
        return f(*args, **kwargs)
    return decorated_function
