from flask import Flask

from core.server.route.session_bp import SESSION_BP
from core.server.route.storage_bp import STORAGE_BP
from core.server.route.user_bp import USER_BP


def register_blueprints(app: Flask):
    """
    注册所有路由的蓝图
    :return:
    """
    app.register_blueprint(USER_BP)
    app.register_blueprint(SESSION_BP)
    app.register_blueprint(STORAGE_BP)
