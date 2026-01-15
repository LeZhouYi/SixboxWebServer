from core.database.table.audio import AudioDB
from core.database.table.audio_set import AudioSetDB
from core.database.table.session import SessionDB
from core.database.table.storage import StorageDB
from core.database.table.user import UserDB

USER_DB = UserDB()
SESSION_DB = SessionDB()
STORAGE_DB = StorageDB()
AUDIO_DB = AudioDB()
AUDIO_SET_DB = AudioSetDB()
__all__ = [USER_DB, SESSION_DB, STORAGE_DB, AUDIO_DB, AUDIO_SET_DB]
