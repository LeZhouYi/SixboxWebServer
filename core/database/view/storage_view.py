import os.path
from uuid import uuid4

from werkzeug.datastructures import FileStorage

from core.database.table import STORAGE_DB
from core.database.table.storage import Storage
from core.log import logger


def save_file(file: FileStorage):
    """保存文件"""
    if file.filename is None:
        raise Exception("FILENAME EMPTY")
    file_ext = os.path.splitext(file.filename)[-1].lower()
    if file_ext not in STORAGE_DB.get_env("file_ext"):
        raise Exception("FILE FORMAT UNSUPPORTED")
    folder = os.path.join(STORAGE_DB.get_env("save_folder"), file_ext[1:])
    os.makedirs(folder, exist_ok=True)
    filepath = os.path.join(folder, f"{uuid4()}{file_ext}")
    try:
        file.save(filepath)
    except Exception as e:
        logger.error(f"保存文件失败：{e}")
        raise Exception("FILE SAVE FAIL")
    return {
        Storage.FILE_TYPE: file_ext[1:],
        Storage.FILE_PATH: filepath
    }