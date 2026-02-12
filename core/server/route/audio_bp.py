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

    audio_name = request.form.get(Audio.FILE_NAME)
    validate_str_empty(audio_name, "AUDIO NAME REQUIRED")
    singer = request.form.get(Audio.SINGER)
    validate_str_empty(singer, "SINGER REQUIRED")

    file = request.files.get(Audio.AUDIO)
    if file is None:
        raise Exception("AUDIO REQUIRED")
    # 处理
    # 保存音频
    audio_data = save_file(file)
    audio_data.update({
        Storage.UPLOADER: decoded.get(Session.USER_ID),
        Storage.FOLDER_ID: AUDIO_FOLDERS[AudioFolder.AUDIO_FOLDER],
        Storage.FILE_NAME: f"{singer}-{audio_name}",
        Storage.REMARK: request.form.get(Storage.REMARK)
    })
    audio_id = STORAGE_DB.add_data(audio_data).get(Storage.FILE_ID)
    # 保存歌词
    lyrics = request.files.get(Audio.LYRICS)
    lyrics_data = save_file(lyrics, ext_filter=[".lrc"])
    lyrics_data.update({
        Storage.UPLOADER: decoded.get(Session.USER_ID),
        Storage.FOLDER_ID: AUDIO_FOLDERS[AudioFolder.LYRICS_FOLDER],
        Storage.FILE_NAME: f"{singer}-{audio_name}",
        Storage.REMARK: request.form.get(Storage.REMARK)
    })
    lyrics_id = STORAGE_DB.add_data(lyrics_data).get(Storage.FILE_ID)
    # 保存音频整体数据
    AUDIO_DB.add_data({
        Audio.FILE_NAME: audio_name,
        Audio.FILE_ID: audio_id,
        Audio.SINGER: singer,
        Audio.ALBUM: request.form.get(Audio.ALBUM),
        Audio.LYRICS_ID: lyrics_id,
        Audio.REMARK: request.form.get(Audio.REMARK)
    })
    # 保存至默认合集
    AUDIO_SET_DB.add_audio(None, audio_id)
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
    # 处理
    set_data = AUDIO_SET_DB.get_set_detail(set_id)
    set_data[AudioSet.AUDIOS] = AUDIO_DB.get_datas(set_data.get(AudioSet.AUDIOS, []))
    return jsonify(set_data)


@AUDIO_BP.route(gen_prefix_api("/audioSet"), methods=["POST"])
@catch_exception
def add_set():
    """新增合集"""
    # 校验
    decoded = verify_token(request)
    set_name = request.form.get(AudioSet.SET_NAME)
    validate_str_empty(set_name, "SET NAME REQUIRED")
    ## 处理文件
    files = request.files.getlist(Storage.FILES)
    cover_id = None
    if len(files) > 0:
        folder_id = AUDIO_FOLDERS[AudioFolder.COVER_FOLDER]
        folder_path = STORAGE_DB.get_folder_data(folder_id).get(Storage.FILE_PATH)
        file_data = save_file(files[0], folder_path)
        file_data.update({
            Storage.FOLDER_ID: folder_id,
            Storage.FILE_NAME: f"{set_name}_cover",
            Storage.UPLOADER: decoded.get(Session.USER_ID),
            Storage.REMARK: ""
        })
        cover_id = STORAGE_DB.add_data(file_data).get(Storage.FILE_ID)
    AUDIO_SET_DB.add_data({
        AudioSet.SET_NAME: set_name,
        AudioSet.REMARK: request.form.get(AudioSet.REMARK),
        AudioSet.COVER_ID: cover_id,
        AudioSet.AUDIOS: []
    })
    return gen_success_response(request, "CREATE SUCCESS", 201)


@AUDIO_BP.route(gen_prefix_api("/audioSet/<set_id>"), methods=["DELETE"])
@catch_exception
@token_required
def delete_set(set_id: str):
    """删除合集"""
    # 校验
    validate_str_empty(set_id, "SET ID REQUIRED")
    # 处理
    delete_data = AUDIO_SET_DB.delete_set(set_id)
    # 移除相关封面
    cover_id = delete_data.get(AudioSet.COVER_ID)
    STORAGE_DB.delete_file(cover_id)
    return gen_success_response(request, "DELETE SUCCESS")


@AUDIO_BP.route(gen_prefix_api("/audioSet/<set_id>"), methods=["PUT"])
@catch_exception
def edit_set(set_id: str):
    """编辑合集"""
    # 校验
    decoded = verify_token(request)
    set_name = request.form.get(AudioSet.SET_NAME)
    validate_str_empty(set_name, "SET NAME REQUIRED")
    # 处理
    files = request.files.getlist(Storage.FILES)
    cover_id = request.form.get(AudioSet.COVER_ID)
    if cover_id is None:
        # 当cover_id为空时，表示清空原来的cover
        delete_id = AUDIO_SET_DB.get_set_detail(set_id).get(AudioSet.COVER_ID)
        if delete_id:
            STORAGE_DB.delete_file(delete_id)  # 移除旧有的封面
    if len(files) > 0:
        # 处理新上传的cover
        folder_id = AUDIO_FOLDERS[AudioFolder.COVER_FOLDER]
        folder_path = STORAGE_DB.get_folder_data(folder_id).get(Storage.FILE_PATH)
        file_data = save_file(files[0], folder_path)
        file_data.update({
            Storage.FOLDER_ID: folder_id,
            Storage.FILE_NAME: f"{set_name}_cover",
            Storage.UPLOADER: decoded.get(Session.USER_ID),
            Storage.REMARK: ""
        })
        cover_id = STORAGE_DB.add_data(file_data).get(Storage.FILE_ID)
    if cover_id:
        STORAGE_DB.get_file_data(cover_id)  # 校验文件是否存在
    # 更新数据
    AUDIO_SET_DB.edit_data(set_id, {
        AudioSet.SET_NAME: set_name,
        AudioSet.REMARK: request.form.get(AudioSet.REMARK),
        AudioSet.COVER_ID: cover_id
    })
    return gen_success_response(request, "EDIT SUCCESS", 200)


@AUDIO_BP.route(gen_prefix_api("/audios/<audio_id>"), methods=["DELETE"])
def delete_audio(audio_id: str):
    """删除音频"""
    # 校验
    validate_str_empty(audio_id, "AUDIO ID REQUIRED")
    # 处理
    delete_data = AUDIO_DB.delete_data(audio_id)
    lyrics_id = delete_data.get(Audio.LYRICS_ID)
    STORAGE_DB.delete_file(audio_id)
    STORAGE_DB.delete_file(lyrics_id)
    # 从合集中移除
    AUDIO_SET_DB.patch_remove_audio(audio_id)
    return gen_success_response(request, "DELETE SUCCESS")
