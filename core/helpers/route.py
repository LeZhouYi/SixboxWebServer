import gettext
from gettext import NullTranslations

from flask import Response, jsonify, Request, request
from flask_assets import Environment
from webassets import Bundle

from core.config import get_section

__config = get_section("flask")


class ResponseKey:
    STATUS = "status"
    MESSAGE = "message"


def _get_env(key: str):
    """
    获取env配置
    :param key:
    :return:
    """
    global __config
    return __config["env"][key]


def gen_prefix_api(api_str: str) -> str:
    """
    生成添加了前缀的api
    :param api_str:
    :return:
    """
    return _get_env("api_prefix") + api_str


def gen_fail_response(request_in: Request, message: str, error_code: int = 400) -> tuple[Response, int]:
    """
    生成执行失败的回复
    :param request_in:
    :param message: 错误信息
    :param error_code: 错误码
    :return:
    """
    translator = get_translator(request_in)
    return jsonify({
        ResponseKey.STATUS: translator.gettext("FAIL RESULT"),
        ResponseKey.MESSAGE: message
    }), error_code


def gen_success_response(request_in: Request, message: str, status_code: int = 200) -> tuple[Response, int]:
    """
    生成执行成功的回复
    :param request_in:
    :param message:
    :param status_code:
    :return:
    """
    translator = get_translator(request_in)
    return jsonify({
        ResponseKey.STATUS: translator.gettext("SUCCESS RESULT"),
        ResponseKey.MESSAGE: message
    }), status_code


def extract_values(source_data: dict, keys: list) -> dict:
    """
    根据keys提供合适的数据
    :param source_data:
    :param keys:
    :return:
    """
    return_data = {}
    for key in keys:
        return_data[key] = source_data.get(key)
    return return_data


def get_translator(request_in: Request) -> NullTranslations:
    """
    根据Accept-Language头选择语言，并返回对应翻译
    :param request_in:
    :return:
    """
    best_match = request_in.accept_languages.best_match(_get_env("langs")) or "zh_CN"
    translator = gettext.translation(
        domain=_get_env("domain"),
        localedir=_get_env("locale_dir"),
        languages=[best_match],
        fallback=True
    )
    translator.install()
    return translator


def get_text(message: str) -> str:
    """
    获取多语言的文本
    :param message:
    :return:
    """
    translator = get_translator(request)
    return translator.gettext(message)


def get_locale() -> str:
    """
    获取当前语言
    :return:
    """
    best_match = request.accept_languages.best_match(_get_env("langs")) or "zh_CN"
    return best_match.replace("_", "-")


def register_assets(assets: Environment):
    """注册web assets"""
    asset_configs = __config["sources"]
    for filter_type, asset_dict in asset_configs.items():
        for asset_name, asset_attr in asset_dict.items():
            assets.register(
                asset_name,
                Bundle(
                    *asset_attr["sources"],
                    filters=filter_type,
                    output=asset_attr["output"]
                )
            )
