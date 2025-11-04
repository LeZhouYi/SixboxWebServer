import mimetypes
import os.path
import re

from flask import Blueprint, Response

from core.config import get_config
from core.database.view.view_utils import catch_exception
from core.helpers.route import get_stream_io

STATIC_BP = Blueprint("static", __name__)


@STATIC_BP.route("/static/icons/<filename>")
@catch_exception
def get_icon(filename: str):
    """获取图标"""
    if re.match(r"^[0-9a-zA-Z-_]+.[a-zA-Z]+$", filename) is None:
        raise Exception("ICON FORMAT ERROR")
    filepath = os.path.join(get_config("flask", "static_folder"), "icons", filename)
    if not os.path.exists(filepath):
        raise Exception("ICON NOT FOUND")
    mime_type, _ = mimetypes.guess_type(filepath)
    return Response(get_stream_io(filepath), mimetype=mime_type, headers={
        "Transfer-Encoding": "chunked"
    })
