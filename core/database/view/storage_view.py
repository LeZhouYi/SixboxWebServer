import os.path
from typing import Union, Optional
from uuid import uuid4

from werkzeug.datastructures import FileStorage

from core.database.table import STORAGE_DB
from core.database.table.storage import Storage, DefaultFolder
from core.helpers.validate import validate_str_empty
from core.log import logger

def save_file(file: FileStorage):
    """保存文件"""
    if file.filename is None:
        raise Exception("FILENAME EMPTY")
    file_ext = os.path.splitext(file.filename)[-1].lower()
    if file_ext not in STORAGE_DB.get_env("extensions"):
        raise Exception("FILE FORMAT UNSUPPORTED")
    folder = os.path.join(STORAGE_DB.get_env("save_folder"), file_ext[1:])
    os.makedirs(folder, exist_ok=True)
    filepath = os.path.join(folder, f"{uuid4()}{file_ext}")
    filepath = os.path.normpath(filepath)
    try:
        file.save(filepath)
        file_size = os.path.getsize(filepath)
    except Exception as e:
        logger.error(f"保存文件失败：{e}")
        raise Exception("FILE SAVE FAIL")
    return {
        Storage.FILE_TYPE: file_ext[1:],
        Storage.FILE_PATH: filepath,
        Storage.SIZE: file_size
    }


def search_storage_data(file_id: Union[str, None], search: Union[str, None], page: int, limit: Optional[int]) -> dict:
    """搜索文件/文件夹"""
    if validate_str_empty(search):
        if validate_str_empty(file_id):
            folder_data = STORAGE_DB.get_default_folder(DefaultFolder.ROOT_FOLDER)
        else:
            folder_data = STORAGE_DB.get_folder_data(file_id)
        count, search_data = STORAGE_DB.search_data(folder_data.get(Storage.FILE_ID), None, page, limit)
        folder_data[Storage.TOTAL] = count
        folder_data[Storage.CONTENTS] = search_data
        return folder_data
    else:
        count, search_data = STORAGE_DB.search_data(None, search, page, limit)
        return {
            Storage.TOTAL: count,
            Storage.CONTENTS: search_data
        }
