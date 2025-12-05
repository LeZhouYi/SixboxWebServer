import hashlib
import os.path
import threading
from typing import LiteralString, Union, Optional
from uuid import uuid4

from tinydb import TinyDB, where

from core.database.table.table_base import TableBase
from core.helpers.lock import lock_required
from core.helpers.route import extract_values


class Role:
    """
    角色
    """
    # 管理员，全部功能
    ADMIN = 0
    # 用户，没有管理/设置功能
    USER = 1
    # 游客，只读
    TOURIST = 2


class User:
    """
    用户表键名
    """
    USERNAME = "username"  # 用户名，唯一，登录账号
    PASSWORD = "password"  # 密码
    ROLE = "role"  # 角色
    USER_ID = "userID"  # UUID 可以作为外部下载链接的参数
    BACKGROUND = "background"  # 图片背景，默认为None，图片随机


class UserDB(TableBase):
    _lock = threading.Lock()

    def __init__(self):
        super().__init__("database", "user")

    def init_db(self, db_path: Union[LiteralString, str]) -> TinyDB:
        """
        初始化本地数据文件并加载
        :param db_path: 本地数据文件路径
        :return:
        """
        if not os.path.exists(db_path):
            self._db = super().init_db(db_path)
            for default_item in self.get_env("defaults"):
                self.add_user(default_item)
            return self._db
        return TinyDB(db_path)

    @lock_required(_lock)
    def add_user(self, data: dict) -> dict:
        """
        新增用户
        :param data:
        :return:
        """
        result = self._db.get(where(User.USERNAME) == data.get(User.USERNAME))  # type: ignore
        if result:
            raise Exception(f"DUPLICATE USERNAME")
        user_id = str(uuid4())
        data.update({
            User.USER_ID: user_id,
            User.PASSWORD: self.hash_encrypt(data.get(User.PASSWORD)),
            User.BACKGROUND: None
        })
        self._db.insert(extract_values(data, [
            User.USER_ID,
            User.USERNAME,
            User.PASSWORD,
            User.ROLE,
            User.BACKGROUND
        ]))
        return {
            User.USER_ID: user_id
        }

    @lock_required(_lock)
    def verify_user(self, username: str, password: str) -> Optional[dict]:
        """
        校验用户是否存在并且密码正确，如果匹配则返回相应数据
        :param username:
        :param password:
        :return:
        """
        password = self.hash_encrypt(password)
        return self._db.get((where(User.USERNAME) == username) & (where(User.PASSWORD) == password))  # type: ignore

    @staticmethod
    def hash_encrypt(value: str) -> str:
        """
        哈希加密数据
        :param value:
        :return:
        """
        hash_coder = hashlib.sha256()
        hash_coder.update(value.encode("utf-8"))
        return hash_coder.hexdigest()

    @lock_required(_lock)
    def match_role(self, user_id: str, will_role: int) -> bool:
        """
        匹配用户的角色权限是否满足
        :param user_id: 申请的角色
        :param will_role:
        :return:
        """
        result = self._db.get(where(User.USER_ID) == user_id)  # type:ignore
        if result is None:
            raise Exception("USER NOT FOUND")
        now_role = result.get(User.ROLE)
        return will_role <= now_role

    @lock_required(_lock)
    def get_user(self, user_id: str):
        """
        获取用户
        :param user_id:
        :return:
        """
        result = self._db.get(where(User.USER_ID) == user_id)  # type: ignore
        if result:
            return result
        raise Exception("USER NOT FOUND")

    @lock_required(_lock)
    def delete_user(self, user_id: str):
        """
        删除用户
        :param user_id:
        :return:
        """
        result = self._db.get(where(User.USER_ID) == user_id)  # type: ignore
        if result:
            self._db.remove(where(User.USER_ID) == user_id)  # type: ignore
            return
        raise Exception("USER NOT FOUND")
