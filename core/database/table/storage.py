import datetime
import os
import threading
from typing import Union, LiteralString
from uuid import uuid4

from tinydb import TinyDB, where

from core.database.table.table_base import TableBase
from core.helpers.lock import lock_required
from core.helpers.route import extract_values


class Storage:
    """
    Storage键名
    """
    FILE_ID = "fileID"
    FILE_PATH = "filepath"  # 文件本地存储路径，相对于根目录的相对路径
    FILE_NAME = "filename"  # 文件名，不带后缀
    FILE_TYPE = "type"  # 文件后缀，null表示文件夹
    UPLOADER = "uploader"  # 上传者
    CREATE_TIME = "createTime"
    EDITED_TIME = "editedTime"
    REMARK = "remark"  # 备注
    FOLDER_ID = "folderID"  # 所属文件夹

    FILES = "files"  # request form-data 的文件列表


class StorageDB(TableBase):
    _lock = threading.Lock()

    def __init__(self):
        super().__init__("database", "storage")

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
    def adjust_data(self, data: dict):
        """
        校验并调整数据
        :param data:
        :return:
        """
        filepath = data.get(Storage.FILE_PATH)
        if filepath is not None:
            if not os.path.exists(filepath):
                raise Exception("FILE SAVE FAIL")
            filetype = data.get(Storage.FILE_TYPE)
            if filetype is None:
                raise Exception("FILE EXT EMPTY")
        else:
            data.update({
                Storage.FILE_PATH: None,
                Storage.FILE_TYPE: None
            })
        folder_id = data.get(Storage.FOLDER_ID)
        if folder_id is None:
            raise Exception("FOLDER REQUIRED")
        elif self._db.get(
                (where(Storage.FILE_ID) == folder_id) & (where(Storage.FILE_TYPE) is None)) is None:  # type: ignore
            raise Exception("FOLDER NOT FOUND")
        return data

    @lock_required(_lock)
    def add_data(self, data: dict):
        """
        新增文件/文件夹
        :param data:
        :return:
        """
        data_id = str(uuid4())
        now_time = datetime.datetime.now().timestamp()
        insert_data = extract_values(data, [
            Storage.FILE_PATH,
            Storage.FILE_NAME,
            Storage.FILE_TYPE,
            Storage.UPLOADER,
            Storage.REMARK,
            Storage.FOLDER_ID
        ])
        insert_data.update({
            Storage.FILE_ID: data_id,
            Storage.CREATE_TIME: now_time,
            Storage.EDITED_TIME: now_time
        })
        self._db.insert(insert_data)
        return {
            Storage.FILE_ID: data_id
        }

    def edit_data(self, data: dict):
        """
        编辑数据
        :param data:
        :return:
        """
        file_id = data.get(Storage.FILE_ID)
        if self._db.get(where(Storage.FILE_ID) == file_id) is None:  # type: ignore
            raise Exception("DATA NOT FOUND")
        now_time = datetime.datetime.now().timestamp()
        data[Storage.EDITED_TIME] = now_time
        update_data = extract_values(data, [
            Storage.FILE_PATH,
            Storage.FILE_NAME,
            Storage.FILE_TYPE,
            Storage.UPLOADER,
            Storage.REMARK,
            Storage.FOLDER_ID,
            Storage.EDITED_TIME,
        ])
        self._db.update(update_data, where(Storage.FILE_ID) == file_id)  # type: ignore

    @lock_required(_lock)
    def is_folder_exist(self, folder_id: str):
        """
        判断文件夹是否存在
        :param folder_id:
        :return:
        """
        return self._db.get((where(Storage.FILE_ID) == folder_id) & (where(Storage.FILE_TYPE) is None)) is not None
