import mimetypes
import os.path

from flask import Blueprint, request, Response, jsonify

from core.database.table import STORAGE_DB, AUDIO_DB, AUDIO_SET_DB
from core.database.table.audio import AudioFolder, Audio
from core.database.table.audio_set import AudioSet
from core.database.table.session import Session
from core.database.table.storage import Storage
from core.database.view.audio_view import AUDIO_FOLDERS
from core.database.view.session_view import verify_token, token_required
from core.database.view.storage_view import save_file
from core.database.view.view_utils import catch_exception, page_args_required, Params
from core.helpers.route import gen_prefix_api, gen_success_response, get_stream_io
from core.helpers.validate import validate_str_empty

AUDIO_BP = Blueprint("audio", __name__)


@AUDIO_BP.route("/static/audios/<filename>", methods=["GET"])
def get_set_cover(filename: str):
    """获取默认合集封面"""
    filepath = AUDIO_DB.get_env("default_cover")
    if not os.path.exists(filepath) or filename is None:
        raise Exception("COVER NOT EXIST")
    mime_type, _ = mimetypes.guess_type(filepath)
    return Response(get_stream_io(filepath), mimetype=mime_type, headers={
        "Transfer-Encoding": "chunked"
    })


@AUDIO_BP.route(gen_prefix_api("/audios"), methods=["POST"])
@catch_exception
def add_audio():
    """新增音频"""
    # 校验
    decoded = verify_token(request)
    file = request.files.get(Audio.AUDIO)
    if file is None:
        raise Exception("AUDIO REQUIRED")
    filename = request.form.get(Storage.FILE_NAME)
    validate_str_empty(filename, "FILENAME EMPTY")
    # 处理
    # 保存音频
    audio_data = save_file(file)
    audio_data.update({
        Storage.UPLOADER: decoded.get(Session.USER_ID),
        Storage.FOLDER_ID: AUDIO_FOLDERS[AudioFolder.AUDIO_FOLDER],
        Storage.FILE_NAME: filename,
        Storage.REMARK: request.form.get(Storage.REMARK)
    })
    audio_id = STORAGE_DB.add_data(audio_data)
    # 保存歌词
    lyrics = request.files.get(Audio.LYRICS)
    lyrics_data = save_file(lyrics)
    lyrics_data.update({
        Storage.UPLOADER: decoded.get(Session.USER_ID),
        Storage.FOLDER_ID: AUDIO_FOLDERS[AudioFolder.LYRICS_FOLDER],
        Storage.FILE_NAME: filename,
        Storage.REMARK: request.form.get(Storage.REMARK)
    })
    lyrics_id = STORAGE_DB.add_data(lyrics_data)
    # 保存音频整体数据
    AUDIO_DB.add_data({
        Audio.FILE_ID: audio_id,
        Audio.SINGER: request.form.get(Audio.SINGER),
        Audio.ALBUM: request.form.get(Audio.ALBUM),
        Audio.LYRICS_ID: lyrics_id
    })
    # 保存至合集
    return gen_success_response(request, "CREATE SUCCESS", 201)


@AUDIO_BP.route(gen_prefix_api("/audioSet"), methods=["GET"])
@catch_exception
@token_required
@page_args_required
def get_audio_set_list():
    """获取合集列表"""
    search = request.args.get(Params.SEARCH)
    page = int(request.args.get(Params.PAGE))
    limit = int(request.args.get(Params.LIMIT))
    total, search_data = AUDIO_SET_DB.search_data(search, page, limit)
    return jsonify({
        Params.TOTAL: total,
        Params.CONTENTS: search_data
    })


@AUDIO_BP.route(gen_prefix_api("/audioSet/<set_id>"), methods=["GET"])
@catch_exception
@token_required
def get_audio_set_info(set_id: str):
    """获取合集详情"""
    # 校验
    validate_str_empty(set_id, "SET ID REQUIRED")
    set_data = AUDIO_SET_DB.get_set_detail(set_id)
    set_data[AudioSet.AUDIOS] = AUDIO_DB.get_datas(set_data.get(AudioSet.AUDIOS, []))
    return jsonify(set_data)
