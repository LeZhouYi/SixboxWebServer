from core.database.table.session import SessionDB
from core.database.table.user import UserDB

USER_DB = UserDB()
SESSION_DB = SessionDB()
__all__ = [USER_DB, SESSION_DB]
