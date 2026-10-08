from flask import Blueprint, render_template, request, redirect, url_for, flash, session, current_app
from app.services.auth_service import AuthService
from email_validator import validate_email, EmailNotValidError

auth_bp = Blueprint('auth', __name__)


# -----------------------------------------------------------------------------
# User Registration / Signup
# -----------------------------------------------------------------------------
@auth_bp.route('/signup', methods=['GET', 'POST'], endpoint='signup')
@auth_bp.route('/register', methods=['GET', 'POST'], endpoint='register')
@auth_bp.route('/auth/signup', methods=['GET', 'POST'])
@auth_bp.route('/auth/register', methods=['GET', 'POST'])
def signup():
    """
    Handles user registration via Supabase Auth.
    Creates a user in auth.users and triggers automatic profile record creation.
    """
    if 'user' in session:
        return redirect(url_for('dashboard.dashboard'))

    if request.method == 'POST':
        full_name = (request.form.get('fullName') or request.form.get('full_name') or '').strip()
        email = (request.form.get('email') or '').strip().lower()
        password = request.form.get('password') or ''
        confirm_password = (request.form.get('confirmPassword') or request.form.get('confirm_password') or '')

        # 1. Validation: Required fields
        if not full_name:
            flash('Full Name is required.', 'danger')
            return render_template('auth/signup.html', form_data=request.form)

        if not email:
            flash('Email address is required.', 'danger')
            return render_template('auth/signup.html', form_data=request.form)

        if not password or not confirm_password:
            flash('Password and confirmation are required.', 'danger')
            return render_template('auth/signup.html', form_data=request.form)

        # 2. Validation: Passwords match
        if password != confirm_password:
            flash('Passwords do not match. Please re-enter.', 'danger')
            return render_template('auth/signup.html', form_data=request.form)

        # 3. Validation: Minimum password length
        if len(password) < 8:
            flash('Password must be at least 8 characters long.', 'danger')
            return render_template('auth/signup.html', form_data=request.form)

        # 4. Validation: RFC compliant email
        try:
            validate_email(email, check_deliverability=False)
        except EmailNotValidError as e:
            flash(f'Invalid email address: {str(e)}', 'danger')
            return render_template('auth/signup.html', form_data=request.form)

        # 5. Execute signup in Supabase Auth
        result = AuthService.register_user(email=email, password=password, full_name=full_name)

        if result.get('success'):
            if result.get('requires_confirmation'):
                flash(result.get('message', 'Registration successful! Please check your email to verify your account.'), 'info')
                return redirect(url_for('auth.verify_email'))
            else:
                flash('Account created successfully! You may now log in.', 'success')
                return redirect(url_for('auth.login'))
        else:
            flash(result.get('error', 'Registration failed. Please try again.'), 'danger')
            return render_template('auth/signup.html', form_data=request.form)

    return render_template('auth/signup.html')


# -----------------------------------------------------------------------------
# User Login
# -----------------------------------------------------------------------------
@auth_bp.route('/login', methods=['GET', 'POST'], endpoint='login')
@auth_bp.route('/auth/login', methods=['GET', 'POST'])
def login():
    """
    Authenticates user credentials using Supabase Auth and establishes
    a verified server-side session.
    """
    if 'user' in session:
        return redirect(url_for('dashboard.dashboard'))

    if request.method == 'POST':
        email = (request.form.get('email') or '').strip().lower()
        password = request.form.get('password') or ''
        remember = request.form.get('remember')

        if not email or not password:
            flash('Email and password are both required.', 'danger')
            return render_template('auth/login.html')

        result = AuthService.login_user(email=email, password=password)

        if result.get('success'):
            user = result['user']
            supabase_session = result.get('session')

            # Fetch profile record from public.profiles
            profile_res = AuthService.get_user_profile(
                user_id=user.id,
                access_token=supabase_session.access_token if supabase_session else None
            )
            profile = profile_res.get('profile', {}) if profile_res.get('success') else {}

            # Fallback name if profile was not fetched yet
            display_name = (
                profile.get('full_name')
                or getattr(user, 'user_metadata', {}).get('full_name')
                or email.split('@')[0]
            )

            # Store authenticated session securely on Flask server
            session['user'] = {
                'id': user.id,
                'email': user.email,
                'full_name': display_name,
                'role': profile.get('role', 'user'),
                'profile_image_url': profile.get('profile_image_url'),
                'access_token': supabase_session.access_token if supabase_session else None,
                'refresh_token': supabase_session.refresh_token if supabase_session else None
            }

            if remember:
                session.permanent = True

            flash(f'Welcome back, {display_name}!', 'success')
            return redirect(url_for('dashboard.dashboard'))
        else:
            flash(result.get('error', 'Invalid email or password.'), 'danger')

    return render_template('auth/login.html')


# -----------------------------------------------------------------------------
# User Logout
# -----------------------------------------------------------------------------
@auth_bp.route('/logout', endpoint='logout')
@auth_bp.route('/auth/logout')
def logout():
    """
    Invalidates the Supabase Auth session and clears Flask session state.
    """
    user_session = session.get('user', {})
    access_token = user_session.get('access_token')

    # Revoke session via Supabase
    AuthService.logout_user(access_token=access_token)

    # Clear Flask session cookie
    session.clear()
    flash('You have been successfully logged out.', 'info')
    return redirect(url_for('auth.login'))


# -----------------------------------------------------------------------------
# Password Reset Request (Forgot Password)
# -----------------------------------------------------------------------------
@auth_bp.route('/forgot-password', methods=['GET', 'POST'], endpoint='forgot_password')
@auth_bp.route('/auth/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """
    Sends a password recovery link to the user's email via Supabase Auth.
    """
    if 'user' in session:
        return redirect(url_for('dashboard.dashboard'))

    if request.method == 'POST':
        email = (request.form.get('email') or '').strip().lower()

        if not email:
            flash('Please enter your email address.', 'danger')
            return render_template('auth/forgot_password.html')

        try:
            validate_email(email, check_deliverability=False)
        except EmailNotValidError:
            flash('Please enter a valid email address.', 'danger')
            return render_template('auth/forgot_password.html')

        # Configure reset redirect URL to point to /reset-password
        reset_redirect_url = request.host_url.rstrip('/') + url_for('auth.reset_password')
        result = AuthService.reset_password_request(email=email, redirect_to=reset_redirect_url)

        if result.get('success'):
            flash('If an account exists for that email, a password reset link has been sent.', 'success')
        else:
            flash(result.get('error', 'Could not process password reset.'), 'danger')

    return render_template('auth/forgot_password.html')


# -----------------------------------------------------------------------------
# Password Reset Completion (Update Password)
# -----------------------------------------------------------------------------
@auth_bp.route('/reset-password', methods=['GET', 'POST'], endpoint='reset_password')
@auth_bp.route('/auth/reset-password', methods=['GET', 'POST'])
def reset_password():
    """
    Allows the user with a recovery access token to set a new password.
    """
    if request.method == 'POST':
        access_token = request.form.get('access_token')
        new_password = request.form.get('password') or ''
        confirm_password = (request.form.get('confirmPassword') or request.form.get('confirm_password') or '')

        if not access_token:
            flash('Invalid or expired reset token. Please request a new link from your email.', 'danger')
            return render_template('auth/reset_password.html')

        if not new_password or not confirm_password:
            flash('Please fill in both password fields.', 'danger')
            return render_template('auth/reset_password.html')

        if new_password != confirm_password:
            flash('Passwords do not match. Please re-enter.', 'danger')
            return render_template('auth/reset_password.html')

        if len(new_password) < 8:
            flash('New password must be at least 8 characters long.', 'danger')
            return render_template('auth/reset_password.html')

        result = AuthService.update_password(access_token=access_token, new_password=new_password)

        if result.get('success'):
            flash('Your password has been successfully reset! Please log in with your new password.', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash(result.get('error', 'Failed to update password.'), 'danger')

    return render_template('auth/reset_password.html')


# -----------------------------------------------------------------------------
# Email Verification Notice
# -----------------------------------------------------------------------------
@auth_bp.route('/verify-email', endpoint='verify_email')
@auth_bp.route('/auth/verify-email')
def verify_email():
    """
    Displays instructions for users to confirm their email via Supabase Auth.
    """
    return render_template('auth/verify_email.html')
