from flask import Flask

from core.config import get_section
from core.server.route.helpers import register_blueprints


def run_app():
    """
    运行flask app
    :return:
    """
    config = get_section("flask")
    app = Flask(**config.get("app_init"))
    register_blueprints(app)
    app.run(**config.get("app_run"))
