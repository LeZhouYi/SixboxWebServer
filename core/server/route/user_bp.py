from flask import Blueprint, request, jsonify

from core.database.table import USER_DB
from core.database.table.user import Role, User
from core.database.view.user_view import role_required
from core.helpers.route import gen_prefix_api, gen_fail_response
from core.helpers.validate import validate_str_empty

USER_BP = Blueprint("user", __name__)


@USER_BP.route(gen_prefix_api("/users"), methods=["POST"])
@role_required(Role.ADMIN)
def add_user():
    """新增用户"""
    try:
        data = request.json
        username = data.get(User.USERNAME)
        password = data.get(User.PASSWORD)
        role = data.get(User.ROLE)
        if validate_str_empty(username):
            raise Exception("USERNAME REQUIRED")
        if validate_str_empty(password):
            raise Exception("PASSWORD REQUIRED")
        if validate_str_empty(role):
            raise Exception("ROLE REQUIRED")
        return jsonify({User.USER_ID:USER_DB.add_user(username, password, role)})
    except Exception as e:
        return gen_fail_response(str(e))
