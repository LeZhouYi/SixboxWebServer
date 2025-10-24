from core.database.table.session import SessionDB
from core.database.table.storage import StorageDB
from core.database.table.user import UserDB

USER_DB = UserDB()
SESSION_DB = SessionDB()
STORAGE_DB = StorageDB()
__all__ = [USER_DB, SESSION_DB, STORAGE_DB]
