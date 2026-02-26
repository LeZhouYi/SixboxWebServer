import threading
from uuid import uuid4

from tinydb import where

from core.database.table.storage import Storage
from core.database.table.table_base import TableBase
from core.helpers.lock import lock_required
from core.helpers.route import extract_values


class Audio:
    """
    音频键名
    """
    AUDIO_ID = "audioID"
    FILE_ID = Storage.FILE_ID
    FILE_NAME = "filename"
    SINGER = "singer"
    ALBUM = "album"
    LYRICS_ID = "lyricsID"  # 指向文件系统的文件ID
    REMARK = "remark"

    AUDIO = "audio"  # 用于form-data字段
    LYRICS = "lyrics"  # 用于form-data字段


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
    def add_data(self, data: dict) -> str:
        """
        新增数据
        :param data:
        :return:
        """
        insert_data = extract_values(data, [
            Audio.FILE_ID,
            Audio.SINGER,
            Audio.ALBUM,
            Audio.LYRICS_ID,
            Audio.REMARK,
            Audio.FILE_NAME
        ])
        insert_data[Audio.AUDIO_ID] = str(uuid4())
        self._db.insert(insert_data)
        return insert_data[Audio.AUDIO_ID]

    @lock_required(_lock)
    def get_datas(self, ids: list[str]):
        """
        通过id列表获取详情
        :param ids:
        :return:
        """
        details = []
        for audio_id in ids:
            result = self._db.get(where(Audio.AUDIO_ID) == audio_id)  # type:ignore
            if result:
                details.append(result)
        return details

    @lock_required(_lock)
    def delete_data(self, audio_id: str) -> dict:
        """
        删除数据
        :param audio_id:
        :return:
        """
        result = self._db.get(where(Audio.AUDIO_ID) == audio_id)  # type:ignore
        if result:
            self._db.remove(where(Audio.AUDIO_ID) == audio_id)  # type:ignore
            return result
        raise Exception("AUDIO NOT FOUND")

    @lock_required(_lock)
    def get_data(self, audio_id: str) -> dict:
        """
        获取数据
        :param audio_id:
        :return:
        """
        result = self._db.get(where(Audio.AUDIO_ID) == audio_id)  # type:ignore
        if result:
            return result
        raise Exception("AUDIO NOT FOUND")

    @lock_required(_lock)
    def edit_data(self, audio_id: str, data: dict):
        """
        编辑数据
        :param audio_id:
        :param data:
        :return:
        """
        result = self._db.get(where(Audio.AUDIO_ID) == audio_id)  # type:ignore
        if result:
            result.update(extract_values(data, [
                Audio.FILE_ID,
                Audio.SINGER,
                Audio.ALBUM,
                Audio.LYRICS_ID,
                Audio.REMARK,
                Audio.FILE_NAME
            ]))
            self._db.update(result, where(Audio.AUDIO_ID) == audio_id)  # type:ignore
        else:
            raise Exception("AUDIO NOT FOUND")
