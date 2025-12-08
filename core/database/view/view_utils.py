from functools import wraps

from flask import request

from core.helpers.route import gen_fail_response
from core.helpers.validate import validate_int_empty
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
            return gen_fail_response(request, str(e))

    return decorator


def page_args_required(func):
    """
    添加params中_limit和_page的校验
    :param func:
    :return:
    """

    @wraps(func)
    def decorator(*args, **kwargs):
        page = request.args.get(Params.PAGE)
        if validate_int_empty(page, 0):
            raise Exception("PARAM PAGE REQUIRED / ERROR")
        limit = request.args.get(Params.LIMIT)
        if validate_int_empty(limit, 1):
            raise Exception("PARAM LIMIT REQUIRED / ERROR")
        return func(*args, **kwargs)

    return decorator
