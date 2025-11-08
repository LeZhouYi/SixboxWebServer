import datetime
import threading
from uuid import uuid4

import jwt
from tinydb import where

from core.database.table.table_base import TableBase
from core.database.table.user import User
from core.helpers.lock import lock_required
from core.helpers.validate import validate_str_empty


class Session:
    """
    Session表键名
    """
    ACCESS_TOKEN = "accessToken"
    REFRESH_TOKEN = "refreshToken"
    USER_ID = User.USER_ID
    DEVICE_ID = "deviceID"
    EXPIRE_AT = "exp"


class SessionDB(TableBase):
    _lock = threading.Lock()

    def __init__(self):
        super().__init__("database", "session")

    @lock_required(_lock)
    def add_session(self, user_id: str, device_id: str):
        """
        新增session
        :param user_id: 用户ID
        :param device_id: 设备ID
        :return:
        """
        result = self._db.get(
            (where(Session.USER_ID) == user_id) & (where(Session.DEVICE_ID) == device_id))  # type: ignore
        if result:
            self._db.remove(
                (where(Session.USER_ID) == user_id) & (where(Session.DEVICE_ID) == device_id))  # type: ignore
        access_token = self.generate_access_token(user_id)
        refresh_token = str(uuid4())
        self._db.insert({
            Session.USER_ID: user_id,
            Session.DEVICE_ID: device_id,
            Session.ACCESS_TOKEN: access_token,
            Session.REFRESH_TOKEN: refresh_token
        })
        return {
            Session.ACCESS_TOKEN: access_token,
            Session.REFRESH_TOKEN: refresh_token
        }

    @lock_required(_lock)
    def remove_session(self, user_id: str, access_token: str):
        """
        删除Session
        :param access_token:
        :param user_id:
        :return:
        """
        self._db.remove(
            (where(Session.USER_ID) == user_id) & (where(Session.ACCESS_TOKEN) == access_token))  # type: ignore

    @lock_required(_lock)
    def verify_access_token(self, access_token: str) -> dict:
        """
        校验access_token
        :param access_token:
        :return:
        """
        try:
            decoded = jwt.decode(access_token, self.get_env("jwt_secret_key"),
                                 algorithms=[self.get_env("jwt_algorithm")], options={"require_exp": True})
            user_id = decoded.get(Session.USER_ID)
            if validate_str_empty(user_id):
                raise Exception("TOKEN INVALID")
            result = self._db.get(
                (where(Session.USER_ID) == user_id) & (where(Session.ACCESS_TOKEN) == access_token))  # type: ignore
            if result is None:
                raise Exception("TOKEN INVALID")
            return decoded
        except jwt.ExpiredSignatureError:
            raise Exception("TOKEN EXPIRED")
        except jwt.InvalidTokenError:
            raise Exception("TOKEN INVALID")

    @lock_required(_lock)
    def update_token(self, refresh_token):
        """
        更新token
        :param refresh_token:
        :return:
        """
        result = self._db.get(where(Session.REFRESH_TOKEN) == refresh_token)  # type: ignore
        if result is None:
            raise Exception("REFRESH TOKEN INVALID")
        return_body = {
            Session.ACCESS_TOKEN: self.generate_access_token(result.get(Session.USER_ID)),
            Session.REFRESH_TOKEN: str(uuid4())
        }
        self._db.update(return_body, where(Session.REFRESH_TOKEN) == refresh_token)  # type: ignore
        return return_body

    def generate_access_token(self, user_id: str) -> str:
        """
        生成access_token
        :param user_id: 用户ID
        :return:
        """
        expire_at = datetime.datetime.now(datetime.UTC) + datetime.timedelta(
            seconds=self.get_env("jwt_exp_delta_seconds"))
        payload = {
            Session.USER_ID: user_id,
            Session.EXPIRE_AT: expire_at.timestamp()
        }
        token = jwt.encode(payload, self.get_env("jwt_secret_key"), algorithm=self.get_env("jwt_algorithm"))
        return token

    @lock_required(_lock)
    def delete_token_by_user(self, user_id: str):
        """
        通过用户ID进行删除所属的token
        :param user_id:
        :return:
        """
        self._db.remove(where(Session.USER_ID) == user_id)  # type: ignore
