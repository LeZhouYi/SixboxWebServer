import re
from functools import wraps
from typing import Optional

from flask import request

from core.database.table import SESSION_DB
from core.helpers.validate import validate_str_empty


def token_required(func):
    """
    添加Token校验的装饰器
    :return:
    """

    @wraps(func)
    def decorator(*args, **kwargs):
        verify_token(request)
        return func(*args, **kwargs)

    return decorator


def verify_token(request_in: request) -> dict:
    """
    校验token
    :param request_in:
    :return: 解析过的token信息
    """
    token = get_bearer_token(request_in)
    if validate_str_empty(token):
        raise Exception("TOKEN INVALID")
    return SESSION_DB.verify_access_token(token)


def get_bearer_token(request_in: request) -> Optional[str]:
    """获取bearer类型的token"""
    auth_header = request_in.headers.get('Authorization')
    if re.fullmatch(r"^Bearer [A-Za-z0-9\-._~+/]+$", auth_header):
        return auth_header.split(" ")[-1]
    return None
