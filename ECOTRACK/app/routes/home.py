from flask import Blueprint, render_template, session, redirect, url_for, flash
from functools import wraps

home_bp = Blueprint('home', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@home_bp.route('/')
def index():
    return render_template('index.html')

@home_bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@home_bp.route('/profile')
@login_required
def profile():
    return render_template('profile.html')
