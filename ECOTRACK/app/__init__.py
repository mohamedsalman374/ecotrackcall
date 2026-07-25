from flask import Flask
from app.config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Register blueprints
    from app.routes.home import home_bp
    from app.routes.auth import auth_bp
    
    app.register_blueprint(home_bp)
    app.register_blueprint(auth_bp)

    return app
