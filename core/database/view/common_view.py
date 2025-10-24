from functools import wraps

from flask import request

from core.helpers.exception import ApiException
from core.helpers.route import gen_fail_response, get_translator


def catch_exception(func):
    """
    捕获错误并构造Response返回
    :return:
    """

    @wraps(func)
    def decorator(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:

            if isinstance(e, ApiException):
                return e.gen_response(get_translator(request))
            return gen_fail_response(request, str(e))

    return decorator
