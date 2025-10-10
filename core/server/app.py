from flask import Flask

from core.config import get_section
from core.server.route.session_bp import SESSION_BP
from core.server.route.user_bp import USER_BP


def register_blueprints(app: Flask):
    """
    注册所有路由的蓝图
    :return:
    """
    app.register_blueprint(USER_BP)
    app.register_blueprint(SESSION_BP)


def run_app():
    """
    运行flask app
    :return:
    """
    config = get_section("flask")
    app = Flask(**config.get("init"))
    register_blueprints(app)
    app.run(**config.get("run"))