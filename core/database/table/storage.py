import datetime
import os
import re
import threading
from typing import Union, LiteralString, Tuple, List, Optional
from uuid import uuid4

from tinydb import TinyDB, where

from core.database.table.table_base import TableBase
from core.helpers.lock import lock_required
from core.helpers.route import extract_values
from core.log import logger


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
    SIZE = "size"  # 文件大小，空表示文件夹

    FILES = "files"  # request form-data 的文件列表
    FOLDERS = "folders"  # 文件夹列表，表示当前文件/文件夹的嵌套关系
    CONTENT = "content"  # 文本一类的内容


class AudioFolder:
    ROOT_FOLDER = 0  # 根目录
    AUDIO_FOLDER = 1  # 音频页面所用目录


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
            Storage.FOLDER_ID,
            Storage.SIZE
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

    @lock_required(_lock)
    def edit_data(self, data: dict):
        """
        编辑数据
        :param data:
        :return:
        """
        file_id = data.get(Storage.FILE_ID)
        now_data = self._db.get(where(Storage.FILE_ID) == file_id)
        if now_data is None:  # type: ignore
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
        now_data.update(update_data)
        self._db.update(now_data, where(Storage.FILE_ID) == file_id)  # type: ignore

    @lock_required(_lock)
    def is_folder_exist(self, folder_id: str):
        """
        判断文件夹是否存在
        :param folder_id:
        :return:
        """
        return self._db.get((where(Storage.FILE_ID) == folder_id) & (where(Storage.FILE_TYPE) == None)) is not None

    @lock_required(_lock)
    def search_data(self, folder_id: Union[str, None], search: Union[str, None], page: int, limit: Optional[int]) -> \
            Tuple[int, List[dict]]:
        """
        搜索数据
        :param folder_id:
        :param search:
        :param page:
        :param limit: 为空只会获得文件夹，数量不受限制
        :return:
        """
        if search is None:
            query = where(Storage.FOLDER_ID) == folder_id
        else:
            search = re.compile(search, re.IGNORECASE)
            query = where(Storage.FILE_NAME).search(search) | where(Storage.REMARK).search(search) #type:ignore
        # 分别搜索文件夹和文件，按名称排序后拼接
        # noinspection PyComparisonWithNone
        search_data = self._db.search(query & (where(Storage.FILE_TYPE) == None))
        search_data = sorted(search_data, key=lambda data_item: data_item[Storage.FILE_NAME])

        if limit is not None:
            # noinspection PyComparisonWithNone
            file_search = self._db.search(query & (where(Storage.FILE_TYPE) != None))
            search_data.extend(sorted(file_search, key=lambda data_item: data_item[Storage.FILE_NAME]))

        # 统计/切片
        count = len(search_data)
        if limit is not None:
            search_data = search_data[page * limit:(page + 1) * limit]
        return count, search_data

    @lock_required(_lock)
    def get_default_folder(self, default_index: int):
        """
        获取默认固定的文件夹
        :param default_index:
        :return:
        """
        default_data = self.get_env("defaults")[default_index]
        return self._db.get(
            (where(Storage.FILE_NAME) == default_data.get(Storage.FILE_NAME))
            & (where(Storage.FILE_TYPE) == None)
            & (where(Storage.FOLDER_ID) == None)
            & (where(Storage.UPLOADER) == None)
        )

    @lock_required(_lock)
    def get_folder_data(self, file_id: str) -> dict:
        """
        获取文件夹数据
        :param file_id:
        :return:
        """
        result = self._db.get((where(Storage.FILE_ID) == file_id) & (where(Storage.FILE_TYPE) == None))
        if result:
            parents = []
            parent_id = result.get(Storage.FOLDER_ID)
            while parent_id:
                folder_data = self._db.get((where(Storage.FILE_ID) == parent_id) & (where(Storage.FILE_TYPE) == None))
                parents.append(folder_data)
                parent_id = folder_data.get(Storage.FOLDER_ID)
            result[Storage.FOLDERS] = list(reversed(parents))
            return result
        raise Exception("FOLDER NOT FOUND")

    @lock_required(_lock)
    def delete_folder(self, folder_id: str):
        """
        删除文件夹，文件夹内的文件/文件夹也会被移除
        :param folder_id:
        :return:
        """
        self._db.remove((where(Storage.FILE_ID) == folder_id) & (where(Storage.FILE_TYPE) == None))
        delete_queue = [folder_id]
        while len(delete_queue) > 0:
            now_folder_id = delete_queue.pop()
            query = where(Storage.FOLDER_ID) == now_folder_id
            search = self._db.search(query)
            for data_item in search:
                if data_item.get(Storage.FILE_TYPE) is None:
                    delete_queue.append(data_item.get(Storage.FILE_ID))
                else:
                    try:
                        os.remove(data_item.get(Storage.FILE_PATH))
                    except Exception as e:
                        logger.warn(f"remove file: {data_item.get(Storage.FILE_PATH)}, error: {e}")
            self._db.remove(query)

    @lock_required(_lock)
    def get_file_data(self, file_id: str):
        """
        获取文件数据
        :param file_id:
        :return:
        """
        result = self._db.get((where(Storage.FILE_ID) == file_id) & (where(Storage.FILE_TYPE) != None))
        if result:
            parents = []
            parent_id = result.get(Storage.FOLDER_ID)
            while parent_id:
                folder_data = self._db.get((where(Storage.FILE_ID) == parent_id) & (where(Storage.FILE_TYPE) == None))
                parents.append(folder_data)
                parent_id = folder_data.get(Storage.FOLDER_ID)
            result[Storage.FOLDERS] = list(reversed(parents))
            return result
        raise Exception("FILE NOT FOUND")

    @lock_required(_lock)
    def delete_file(self, file_id: str):
        """
        删除文件
        :param file_id:
        :return:
        """
        query = (where(Storage.FILE_ID) == file_id) & (where(Storage.FILE_TYPE) != None)
        file_data = self._db.get(query)
        if file_data is None:
            raise Exception("FILE NOT FOUND")
        try:
            self._db.remove(query)
            os.remove(file_data.get(Storage.FILE_PATH))
        except Exception as e:
            logger.warn(f"remove file: {file_data.get(Storage.FILE_PATH)}, error: {e}")

    @lock_required(_lock)
    def get_child_folder(self, parent_folder_id: str, folder_name: str):
        """
        是否存在子文件夹
        :param folder_name:
        :param parent_folder_id:
        :return:
        """
        search = self._db.get(
            (where(Storage.FOLDER_ID) == parent_folder_id) & (where(Storage.FILE_NAME) == folder_name) & (
                    where(Storage.FILE_TYPE) == None))
        return search
