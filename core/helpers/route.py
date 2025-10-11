from flask import Response, jsonify

from core.config import get_section

__config = get_section("flask")


class ResponseKey:
    STATUS = "status"
    MESSAGE = "message"


def __get_env(key: str):
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
    return __get_env("api_prefix")+api_str


def gen_fail_response(message: str, error_code: int = 400) -> tuple[Response, int]:
    """
    生成执行失败的回复
    :param message: 错误信息
    :param error_code: 错误码
    :return:
    """
    return jsonify({ResponseKey.STATUS: "Fail", ResponseKey.MESSAGE: message}), error_code

def gen_success_response(message: str, status_code: int = 200) -> tuple[Response, int]:
    """
    生成执行成功的回复
    :param message:
    :param status_code:
    :return:
    """
    return jsonify({ResponseKey.STATUS: "OK", ResponseKey.MESSAGE: message}), status_code