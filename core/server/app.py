from flask import Flask
from flask_assets import Environment

from core.config import get_section
from core.helpers.route import get_text, get_locale, register_assets
from core.server.route.cover_bp import COVER_PB
from core.server.route.page_bp import PAGE_BP
from core.server.route.session_bp import SESSION_BP
from core.server.route.static_bp import STATIC_BP
from core.server.route.storage_bp import STORAGE_BP
from core.server.route.user_bp import USER_BP

_config = get_section("flask")
app = Flask(**_config.get("app_init"))

# 注册蓝图
app.register_blueprint(USER_BP)
app.register_blueprint(SESSION_BP)
app.register_blueprint(STORAGE_BP)
app.register_blueprint(PAGE_BP)
app.register_blueprint(COVER_PB)
app.register_blueprint(STATIC_BP)

# 注册资源
register_assets(Environment(app))


# 注册自定义函数
@app.context_processor
def processor():
    return {
        "_": get_text,
        "get_locale": get_locale
    }


def run_app():
    """
    运行flask app
    :return:
    """
    global app, _config
    app.run(**_config.get("app_run"))
