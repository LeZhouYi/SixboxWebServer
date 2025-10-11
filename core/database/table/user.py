import hashlib
import os.path
import threading
from typing import LiteralString, Union, Optional
from uuid import uuid4

from tinydb import TinyDB, where

from core.database.table.table_base import TableBase
from core.helpers.file import write_json
from core.helpers.lock import lock_required


class Role:
    """
    角色
    """
    # 管理员，全部功能
    ADMIN = "admin"
    # 用户，没有管理/设置功能
    USER = "user"
    # 游客，只读
    TOURIST = "tourist"


class User:
    """
    用户表键名
    """
    USERNAME = "username"  # 用户名，唯一，登录账号
    PASSWORD = "password"  # 密码
    ROLE = "role"  # 角色
    USER_ID = "userID"  # UUID


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
            write_json(db_path, self.get_env("db_init"))
            self._db = TinyDB(db_path)
            for default_item in self.get_env("defaults"):
                self.add_user(**default_item)
            return self._db
        return TinyDB(db_path)

    @lock_required(_lock)
    def add_user(self, username: str, password: str, role: str) -> str:
        """
        新增用户
        :param username: 用户名
        :param password: 密码
        :param role: 角色
        :return: primary_key
        """
        result = self._db.get(where(User.USERNAME) == username) # type: ignore
        if result:
            raise Exception(f"DUPLICATE USERNAME")
        self._db.insert({
            User.USER_ID: str(uuid4()),
            User.USERNAME: username,
            User.PASSWORD: self.hash_encrypt(password),
            User.ROLE: role
        })
        return username

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
