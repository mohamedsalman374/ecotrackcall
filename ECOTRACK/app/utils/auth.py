from functools import wraps
from flask import session, redirect, url_for, flash


def login_required(f):
    """
    Decorator to ensure that the user has an active, authenticated Supabase session.
    Unauthenticated requests are redirected to the login page.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = session.get('user')
        if not user or not user.get('id'):
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """
    Decorator to verify that the authenticated user possesses the 'admin' role.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = session.get('user')
        if not user or not user.get('id'):
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('auth.login'))

        role = user.get('role')
        # If role is not cached in session or needs verification, query profile
        if not role:
            from app.services.auth_service import AuthService
            profile_res = AuthService.get_user_profile(user.get('id'), access_token=user.get('access_token'))
            if profile_res.get('success'):
                role = profile_res.get('profile', {}).get('role')
                user['role'] = role
                session['user'] = user

        if role != 'admin':
            flash('Access Denied: Administrative privileges required.', 'danger')
            return redirect(url_for('dashboard.dashboard'))

        return f(*args, **kwargs)
    return decorated_function
