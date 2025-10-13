from functools import wraps

from flask import request

from core.database.table import USER_DB
from core.database.table.session import Session
from core.database.view.session_view import verify_token
from core.helpers.route import gen_fail_response


def role_required(role:str):
    """
    判断权限是否满足，已包含token的校验
    :param role: 最低权限
    :return:
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                verify_result = verify_token(request)
                user_id = verify_result.get(Session.USER_ID)
                if USER_DB.match_role(user_id, role):
                    return func(*args, **kwargs)
                else:
                    raise Exception("PERMISSION DENIED")
            except Exception as e:
                return gen_fail_response(str(e))
        return wrapper
    return decorator

