from flask import Flask
from flask_assets import Environment

from core.config import get_section
from core.helpers.route import register_assets, clear_webasset_cache
from core.server.route.cover_bp import COVER_PB
from core.server.route.page_bp import PAGE_BP
from core.server.route.session_bp import SESSION_BP
from core.server.route.storage_bp import STORAGE_BP
from core.server.route.user_bp import USER_BP
from core.server.template.template import register_template

_config = get_section("flask")
_app = Flask(**_config.get("app_init"))

# 注册蓝图
_app.register_blueprint(USER_BP)
_app.register_blueprint(SESSION_BP)
_app.register_blueprint(STORAGE_BP)
_app.register_blueprint(PAGE_BP)
_app.register_blueprint(COVER_PB)

# 注册资源
clear_webasset_cache()
register_assets(Environment(_app))

# 注册宏
register_template(_app)

def run_app():
    """
    运行flask app
    :return:
    """
    global _app, _config
    _app.run(**_config.get("app_run"))
