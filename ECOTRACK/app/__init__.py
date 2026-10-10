import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, request, g
from dotenv import load_dotenv
from app.config import Config

load_dotenv()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.secret_key = os.environ.get('SECRET_KEY', 'dev_secret_key_change_in_production')

    # Enable Cross-Origin Resource Sharing for React frontend
    try:
        from flask_cors import CORS
        CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    except ImportError:
        pass

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def api_health():
        return {"status": "ok", "app": "EcoTrack REST API", "version": "2.0.0"}, 200

    # Register API blueprints
    from app.routes.api_auth import api_auth_bp
    from app.routes.api_dashboard import api_dashboard_bp
    from app.routes.api_calculator import api_calculator_bp
    from app.routes.api_ai import api_ai_bp
    from app.routes.api_analytics import api_analytics_bp
    from app.routes.api_history import api_history_bp
    from app.routes.api_profile import api_profile_bp
    from app.routes.api_feedback import api_feedback_bp
    from app.routes.api_admin import api_admin_bp

    app.register_blueprint(api_auth_bp)
    app.register_blueprint(api_dashboard_bp)
    app.register_blueprint(api_calculator_bp)
    app.register_blueprint(api_ai_bp)
    app.register_blueprint(api_analytics_bp)
    app.register_blueprint(api_history_bp)
    app.register_blueprint(api_profile_bp)
    app.register_blueprint(api_feedback_bp)
    app.register_blueprint(api_admin_bp)

    # Register legacy/page blueprints for backward compatibility
    from app.routes.home import home_bp
    from app.routes.auth import auth_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.calculator import calculator_bp
    from app.routes.ai import ai_bp
    from app.routes.analytics import analytics_bp
    from app.routes.history import history_bp
    from app.routes.profile import profile_bp
    from app.routes.feedback import feedback_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(home_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(calculator_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(feedback_bp)
    app.register_blueprint(admin_bp)

    # Optional SPA support: serve React build from frontend/dist if present
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))
    if os.path.exists(frontend_dist):
        from flask import send_from_directory

        @app.route('/app', defaults={'path': ''})
        @app.route('/app/<path:path>')
        def serve_react_app(path):
            file_path = os.path.join(frontend_dist, path)
            if path != "" and os.path.exists(file_path):
                return send_from_directory(frontend_dist, path)
            return send_from_directory(frontend_dist, 'index.html')

    # Configure Logging
    if not app.debug and not app.testing:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/ecotrack.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('EcoTrack startup')

    # Security Headers
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        return response

    return app
