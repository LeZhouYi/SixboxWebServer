from core.database.table import STORAGE_DB, AUDIO_DB
from core.database.table.storage import AudioFolder, Storage

AUDIO_ROOT = STORAGE_DB.get_default_folder(AudioFolder.AUDIO_FOLDER).get(Storage.FILE_ID)


def init_audio_folder() -> list:
    """初始化音频所需的文件夹"""
    folders = []
    for default_folder in AUDIO_DB.get_env("defaults"):
        data = STORAGE_DB.get_child_folder(AUDIO_ROOT, default_folder.get(Storage.FILE_NAME))
        if data is not None:
            folders.append(data.get(Storage.FILE_ID))
            continue
        default_folder.update({
            Storage.FOLDER_ID: AUDIO_ROOT
        })
        folders.append(STORAGE_DB.add_data(default_folder).get(Storage.FILE_ID))
    return folders


AUDIO_FOLDERS = init_audio_folder()
