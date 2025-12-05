from flask import Flask, request

from core.helpers.route import get_translator, get_route_env


def register_template(app: Flask):
    """注册宏"""

    @app.template_global()
    def _(message: str) -> str:
        """
        获取多语言的文本
        :param message:
        :return:
        """
        translator = get_translator(request)
        return translator.gettext(message)

    @app.template_global()
    def get_locale() -> str:
        """
        获取当前语言
        :return:
        """
        best_match = request.accept_languages.best_match(get_route_env("langs")) or "zh_CN"
        return best_match.replace("_", "-")
