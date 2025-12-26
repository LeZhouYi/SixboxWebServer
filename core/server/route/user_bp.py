from flask import Blueprint, request, jsonify

from core.database.table import USER_DB, SESSION_DB
from core.database.table.session import Session
from core.database.table.user import Role, User
from core.database.view.session_view import verify_token
from core.database.view.user_view import role_required
from core.database.view.view_utils import catch_exception
from core.helpers.route import gen_prefix_api, extract_values, gen_success_response
from core.helpers.validate import validate_str_empty, validate_dict_str_empty

USER_BP = Blueprint("user", __name__)


@USER_BP.route(gen_prefix_api("/users"), methods=["POST"])
@catch_exception
@role_required(Role.ADMIN)
def add_user():
    """新增用户"""
    data = request.json
    validate_dict_str_empty(data, User.USERNAME, "USERNAME REQUIRED")
    validate_dict_str_empty(data, User.PASSWORD, "PASSWORD REQUIRED")
    role = data.get(User.ROLE)
    if not isinstance(role, int):
        raise Exception("ROLE REQUIRED")
    elif role< 0 or role > 2:
        raise Exception("ROLE ERROR")
    return jsonify(USER_DB.add_user(data))


@USER_BP.route(gen_prefix_api("/users/<user_id>"), methods=["GET"])
@catch_exception
def get_user(user_id: str):
    """获取用户详情"""
    verify_result = verify_token(request)
    now_user_id = verify_result.get(Session.USER_ID)
    if not USER_DB.match_role(now_user_id, Role.ADMIN) and now_user_id != user_id:
        raise Exception("PERMISSION DENIED")
    will_user = USER_DB.get_user(user_id)
    return jsonify(extract_values(will_user, [
        User.USER_ID, User.USERNAME, User.ROLE, User.BACKGROUND
    ]))


@USER_BP.route(gen_prefix_api("/user/<user_id>"), methods=["DELETE"])
@catch_exception
def delete_user(user_id: str):
    """删除/注销用户"""
    verify_result = verify_token(request)
    now_user_id = verify_result.get(Session.USER_ID)
    if not USER_DB.match_role(now_user_id, Role.ADMIN) and now_user_id != user_id:
        raise Exception("PERMISSION DENIED")
    USER_DB.delete_user(user_id)
    SESSION_DB.delete_token_by_user(user_id)
    return gen_success_response(request, "SUCCESS RESULT")
