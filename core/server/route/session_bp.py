from flask import Blueprint, request, jsonify

from core.database.table import USER_DB, SESSION_DB
from core.database.table.session import Session
from core.database.table.user import User
from core.database.view.session_view import verify_token, get_bearer_token
from core.helpers.route import gen_prefix_api, gen_fail_response, gen_success_response
from core.helpers.validate import validate_str_empty

SESSION_BP = Blueprint("session", __name__)


@SESSION_BP.route(gen_prefix_api("/sessions"), methods=["POST"])
def login():
    """登录"""
    try:
        data = request.json
        username = data.get(User.USERNAME)
        password = data.get(User.PASSWORD)
        device_id = data.get(Session.DEVICE_ID)

        if validate_str_empty(username):
            raise Exception("USERNAME REQUIRED")
        if validate_str_empty(password):
            raise Exception("PASSWORD REQUIRED")
        if validate_str_empty(device_id):
            raise Exception("DEVICE ID REQUIRED")

        user = USER_DB.verify_user(username, password)
        if user is None:
            raise Exception("USER/PASSWORD ERROR")
        response_body = SESSION_DB.add_session(user.get(User.USER_ID), device_id)
        return jsonify(response_body)
    except Exception as e:
        return gen_fail_response(str(e))


@SESSION_BP.route(gen_prefix_api("/sessions"), methods=["DELETE"])
def logout():
    """登出"""
    try:
        verify_data = verify_token(request)
        SESSION_DB.remove_session(
            verify_data.get(Session.USER_ID),
            get_bearer_token(request)
        )
        return gen_success_response("LOGOUT SUCCESS")
    except Exception as e:
        return gen_fail_response(str(e))


@SESSION_BP.route(gen_prefix_api("/sessions"), methods=["PUT"])
def refresh():
    """刷新token"""
    try:
        data = request.json
        refresh_token = data.get(Session.REFRESH_TOKEN)
        if validate_str_empty(refresh_token):
            raise Exception("REFRESH TOKEN REQUIRED")
        return jsonify(SESSION_DB.update_token(refresh_token))
    except Exception as e:
        return gen_fail_response(str(e))
