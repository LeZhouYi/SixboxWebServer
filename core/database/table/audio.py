import threading

from tinydb import where

from core.database.table.storage import Storage
from core.database.table.table_base import TableBase
from core.helpers.lock import lock_required
from core.helpers.route import extract_values


class Audio:
    """
    音频键名
    """
    FILE_ID = Storage.FILE_ID
    FILE_NAME = Storage.FILE_NAME # 使用的是文件系统的filename
    SINGER = "singer"
    ALBUM = "album"
    LYRICS_ID = "lyrics_id" # 指向文件系统的文件ID
    REMARK = Storage.REMARK # 使用的是文件系统的remark

    AUDIO = "audio" # 用于form-data字段
    LYRICS = "lyrics" # 用于form-data字段

class AudioFolder:
    """
    默认音频文件夹的序号
    """
    AUDIO_FOLDER = 0
    LYRICS_FOLDER = 1
    COVER_FOLDER = 2

class AudioDB(TableBase):
    _lock = threading.Lock()

    def __init__(self):
        super().__init__("database", "audio")

    @lock_required(_lock)
    def add_data(self, data:dict):
        """
        新增数据
        :param data:
        :return:
        """
        search = self._db.get(where(Audio.FILE_ID)==data.get(Audio.FILE_ID)) # type: ignore
        if search:
            raise Exception("DUPLICATE FILE")
        insert_data = extract_values(data, [
            Audio.FILE_ID,
            Audio.SINGER,
            Audio.ALBUM,
            Audio.LYRICS_ID
        ])
        self._db.insert(insert_data)

    @lock_required(_lock)
    def get_datas(self, ids:list[str]):
        """
        通过id列表获取详情
        :param ids:
        :return:
        """
        details = []
        for audio_id in ids:
            result = self._db.search(where(Audio.FILE_ID)==audio_id) # type:ignore
            if result:
                details.append(result)
        return details