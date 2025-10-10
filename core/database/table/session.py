import datetime
import threading
from uuid import uuid4

import jwt
from tinydb import where

from core.database.table.table_base import TableBase
from core.database.table.user import User
from core.helpers.lock import lock_required


class Session:
    """
    Session表键名
    """
    ACCESS_TOKEN = "accessToken"
    REFRESH_TOKEN = "refreshToken"
    USER_ID = User.USER_ID
    DEVICE_ID = "deviceID"
    EXPIRE_AT = "expireAt"


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
        result = self._db.get((where(Session.USER_ID) == user_id) & (where(Session.DEVICE_ID) == device_id))
        if result:
            raise Exception(f"设备已存在，重复登录：{device_id}")
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

    def generate_access_token(self, user_id: str) -> str:
        """
        生成access_token
        :param user_id: 用户ID
        :return:
        """
        payload = {
            Session.USER_ID: user_id,
            Session.EXPIRE_AT: datetime.datetime.now(datetime.UTC) + datetime.timedelta(
                seconds=self.get_env("jwt_exp_delta_seconds"))
        }
        token = jwt.encode(payload, self.get_env("jwt_secret_key"), algorithm=self.get_env("jwt_algorithm"))
        return token
