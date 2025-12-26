from functools import wraps

from flask import request

from core.helpers.route import gen_fail_response
from core.helpers.validate import validate_int
from core.log import logger


class Params:
    PAGE = "_page"
    LIMIT = "_limit"
    SEARCH = "search"


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
            logger.error(e, exc_info=True)
            if str(e) in ["TOKEN INVALID", "TOKEN EXPIRED"]:
                return gen_fail_response(request, str(e), 401)
            return gen_fail_response(request, str(e), 400)

    return decorator


def page_args_required(func):
    """
    添加params中_limit和_page的校验
    :param func:
    :return:
    """

    @wraps(func)
    def decorator(*args, **kwargs):
        validate_int(request.args.get(Params.PAGE), 0, messages="PARAM PAGE REQUIRED / ERROR")
        validate_int(request.args.get(Params.LIMIT), 1, messages="PARAM LIMIT REQUIRED / ERROR")
        return func(*args, **kwargs)

    return decorator
