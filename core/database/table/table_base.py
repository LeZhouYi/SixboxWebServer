import os
from abc import ABC
from typing import Union, LiteralString

from tinydb import TinyDB

from core.config import get_config
from core.helpers.file import write_json


class TableBase(ABC):

    def __init__(self, section: str, option: str):
        """
        :param section: 节点名
        :param option: 字段名
        """
        self._config = get_config(section, option)
        self._db = self.init_db(self.get_env("db_path"))

    def get_env(self, key: str):
        """
        获取env配置
        :param key: 字段
        :return:
        """
        return self._config[key]

    def init_db(self, db_path: Union[LiteralString, str]):
        """
        初始化本地数据文件并加载
        :param db_path: 本地数据文件路径
        :return:
        """
        if not os.path.exists(db_path):
            write_json(db_path, self.get_env("db_init"))
        return TinyDB(db_path)
