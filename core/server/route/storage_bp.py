from flask import Blueprint, request, jsonify

from core.database.table import STORAGE_DB
from core.database.table.session import Session
from core.database.table.storage import Storage
from core.database.view.session_view import verify_token, token_required
from core.database.view.storage_view import save_file, search_storage_data
from core.database.view.view_utils import catch_exception, page_args_required, Params
from core.helpers.route import gen_prefix_api, gen_success_response
from core.helpers.validate import validate_str_empty

STORAGE_BP = Blueprint("storage", __name__)


@STORAGE_BP.route(gen_prefix_api("/storages/files"), methods=["POST"])
@catch_exception
def add_files():
    """新增文件"""
    decoded = verify_token(request)
    files = request.files.getlist(Storage.FILES)
    if len(files) < 1:
        raise Exception("FILES REQUIRED")
    filenames = request.form.getlist(Storage.FILE_NAME)
    if len(files) != len(filenames):
        raise Exception("FILENAME REQUIRED")
    for filename in filenames:
        if validate_str_empty(filename):
            raise Exception("FILENAME EMPTY")
    folder_id = request.form.get(Storage.FOLDER_ID)
    if not STORAGE_DB.is_folder_exist(folder_id):
        raise Exception("FOLDER NOT FOUND")
    file_ids = []
    for i, file in enumerate(files):
        data = save_file(file)
        data.update({
            Storage.FOLDER_ID: folder_id,
            Storage.FILE_NAME: filenames[i],
            Storage.UPLOADER: decoded.get(Session.USER_ID),
            Storage.REMARK: None
        })
        file_ids.append(STORAGE_DB.add_data(data).get(Storage.FILE_ID))
    return jsonify(file_ids)


@STORAGE_BP.route(gen_prefix_api("/storages"), methods=["GET"])
@catch_exception
@token_required
@page_args_required
def search_storages():
    """搜索文件"""
    folder_id = request.args.get(Storage.FOLDER_ID)
    search = request.args.get(Params.SEARCH)
    page = int(request.args.get(Params.PAGE))
    limit = int(request.args.get(Params.LIMIT))
    return jsonify(search_storage_data(folder_id, search, page, limit))


@STORAGE_BP.route(gen_prefix_api("/storages/folders"), methods=["POST"])
@catch_exception
def add_folder():
    """新增文件夹"""
    decoded = verify_token(request)
    data = request.json
    if validate_str_empty(data.get(Storage.FILE_NAME)):
        raise Exception("FILENAME EMPTY")
    folder_id = data.get(Storage.FOLDER_ID)
    if not STORAGE_DB.is_folder_exist(folder_id):
        raise Exception("FOLDER NOT FOUND")
    data.update({
        Storage.UPLOADER: decoded.get(Session.USER_ID),
        Storage.FILE_PATH: None,
        Storage.FILE_TYPE: None,
        Storage.SIZE: None
    })
    STORAGE_DB.add_data(data)
    return gen_success_response(request, "CREATE SUCCESS", 201)


@STORAGE_BP.route(gen_prefix_api("/storages/folders/<folder_id>"), methods=["GET"])
@catch_exception
@token_required
def get_folder(folder_id: str):
    """获取文件夹详情"""
    return jsonify(search_storage_data(folder_id, None, 0, None))


@STORAGE_BP.route(gen_prefix_api("/storages/folders"), methods=["GET"])
@catch_exception
@token_required
def get_default_folder():
    """获取文件夹详情"""
    return jsonify(search_storage_data(None, None, 0, None))
