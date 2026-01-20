import os
import re
import threading
from typing import Union, LiteralString, Optional, Tuple, List
from uuid import uuid4

from tinydb import TinyDB, where

from core.database.table.table_base import TableBase
from core.helpers.lock import lock_required
from core.helpers.route import extract_values


class AudioSet:
    SET_ID = "setID"
    SET_NAME = "setName"
    REMARK = "remark"
    COVER_ID = "coverID"
    AUDIOS = "audios"  # 音频列表


class AudioSetDB(TableBase):
    _lock = threading.Lock()

    def __init__(self):
        super().__init__("database", "audio_set")

    def init_db(self, db_path: Union[LiteralString, str]):
        """
        初始化本地数据文件并加载
        :param db_path: 本地数据文件路径
        :return:
        """
        if not os.path.exists(db_path):
            self._db = super().init_db(db_path)
            for default_item in self.get_env("defaults"):
                self.add_data(default_item)
            return self._db
        return TinyDB(db_path)

    @lock_required(_lock)
    def add_data(self, data: dict):
        """
        新增数据
        :param data:
        :return:
        """
        set_id = str(uuid4())
        data = extract_values(data, [
            AudioSet.REMARK,
            AudioSet.COVER_ID,
            AudioSet.AUDIOS,
            AudioSet.SET_NAME
        ])
        data[AudioSet.SET_ID] = set_id
        self._db.insert(data)
        return {
            AudioSet.SET_ID: set_id
        }

    @lock_required(_lock)
    def search_data(self, search: Union[str, None], page: int, limit: Optional[int]) -> Tuple[int, List[dict]]:
        """
        搜索数据
        :param search:
        :param page:
        :param limit:
        :return:
        """
        if search is None:
            search_data = self._db.all()
        else:
            search = re.compile(search, re.IGNORECASE)
            search_data = self._db.search(where(AudioSet.SET_NAME).search(search))  # type:ignore
        # 统计/切片
        count = len(search_data)
        print(search_data)
        print(len(search_data))
        if limit is not None:
            search_data = search_data[page * limit:(page + 1) * limit]
        return count, search_data

    @lock_required(_lock)
    def get_set_detail(self, set_id: str):
        """
        获取合集详情
        :param set_id:
        :return:
        """
        result = self._db.get(where(AudioSet.SET_ID) == set_id)  # type:ignore
        if result:
            return result
        raise Exception("SET NOT FOUND")
