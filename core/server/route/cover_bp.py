import mimetypes
import os.path
import random

from flask import Blueprint, Response

from core.config import get_config
from core.database.view.view_utils import catch_exception
from core.helpers.file import get_filelist
from core.helpers.route import get_stream_io

COVER_PB = Blueprint("cover", __name__)

_config = get_config("database", "cover")
_save_folder = _config["save_folder"]
os.makedirs(_save_folder, exist_ok=True)
_filelist = get_filelist(_save_folder, _config["extensions"])


@COVER_PB.route("/static/covers/<filename>", methods=["GET"])
@catch_exception
def get_cover(filename: str):
    """获取封面，路径固定，随机给出"""
    if filename != "cover.png":
        raise Exception("COVER NOT FOUND")
    if len(_filelist) < 1:
        raise Exception("COVER EMPTY")
    filepath = str(os.path.join(_save_folder, random.choice(_filelist)))
    if not os.path.exists(filepath):
        raise Exception("COVER NOT EXIST")
    mime_type, _ = mimetypes.guess_type(filepath)
    return Response(get_stream_io(filepath), mimetype=mime_type, headers={
        "Transfer-Encoding": "chunked"
    })
