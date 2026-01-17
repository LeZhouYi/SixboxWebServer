import gettext
import os
import shutil
from gettext import NullTranslations
from typing import Generator, Any

from flask import Response, jsonify, Request
from flask_assets import Environment
from webassets import Bundle

from core.config import get_section

__config = get_section("flask")


class ResponseKey:
    STATUS = "status"
    MESSAGE = "message"


def get_route_env(key: str):
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
    return get_route_env("api_prefix") + api_str


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
        ResponseKey.MESSAGE: translator.gettext(message)
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
        ResponseKey.MESSAGE: translator.gettext(message)
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
        if key in source_data:
            return_data[key] = source_data.get(key)
    return return_data


def get_translator(request_in: Request) -> NullTranslations:
    """
    根据Accept-Language头选择语言，并返回对应翻译
    :param request_in:
    :return:
    """
    best_match = request_in.accept_languages.best_match(get_route_env("langs")) or "zh_CN"
    translator = gettext.translation(
        domain=get_route_env("domain"),
        localedir=get_route_env("locale_dir"),
        languages=[best_match],
        fallback=True
    )
    translator.install()
    return translator

def register_assets(assets: Environment):
    """注册web assets"""
    asset_configs = __config["sources"]
    for filter_type, asset_dict in asset_configs.items():
        for asset_name, asset_attr in asset_dict.items():
            sources = []
            for source_file_str in asset_attr["sources"]:
                if source_file_str.endswith("/."):
                    folder = source_file_str.split("/.")[0]
                    for filename in os.listdir(folder):
                        sources.append(str(os.path.join(folder, filename)))
                else:
                    sources.append(source_file_str)
            assets.register(
                asset_name,
                Bundle(
                    *sources,
                    filters=filter_type,
                    output=asset_attr["output"]
                )
            )


def get_stream_io(filepath: str, chunk_size: int = None) -> Generator[bytes, Any, None]:
    """获取文件流式传输流"""
    chunk_size = chunk_size or get_route_env("chunk_size")
    with open(filepath, "rb") as file:
        while True:
            data = file.read(chunk_size)
            if not data:
                break
            yield data

def clear_webasset_cache():
    """清除webasset缓存"""
    cache_path = os.path.join(os.getcwd(), __config.get("static_folder"), ".webassets-cache")
    if os.path.exists(cache_path):
        shutil.rmtree(cache_path, ignore_errors=True)
    css_generate_path = os.path.join(os.getcwd(), __config.get("static_folder"), "css/generate")
    if os.path.exists(css_generate_path):
        shutil.rmtree(css_generate_path, ignore_errors=True)
    js_generate_path = os.path.join(os.getcwd(), __config.get("static_folder"), "js/generate")
    if os.path.exists(js_generate_path):
        shutil.rmtree(js_generate_path, ignore_errors=True)