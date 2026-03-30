import os

from dotenv import load_dotenv

load_dotenv()

SERVER_PORT = int(os.getenv("SERVER_PORT"))

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
JWT_EXPIRED_SECONDS = int(os.getenv("JWT_EXPIRED_SECONDS"))

DEFAULT_USER = os.getenv("DEFAULT_USER")
DEFAULT_PASSWORD = os.getenv("DEFAULT_PASSWORD")