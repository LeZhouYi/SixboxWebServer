import mimetypes
import os.path
from urllib.parse import quote

from flask import Blueprint, request, jsonify, Response, Request

from core.database.table import STORAGE_DB, USER_DB
from core.database.table.session import Session
from core.database.table.storage import Storage
from core.database.table.user import Role
from core.database.view.session_view import verify_token, token_required, verify_token_str
from core.database.view.storage_view import save_file, search_storage_data, save_text
from core.database.view.view_utils import catch_exception, page_args_required, Params
from core.helpers.route import gen_prefix_api, gen_success_response, get_stream_io
from core.helpers.validate import validate_str_empty, validate_dict_str_empty

STORAGE_BP = Blueprint("storage", __name__)


@STORAGE_BP.route(gen_prefix_api("/storages/files"), methods=["POST"])
@catch_exception
def add_files():
    """新增文件"""
    decoded = verify_token(request)
    files = request.files.getlist(Storage.FILES)
    ## 校验
    if len(files) < 1:
        raise Exception("FILES REQUIRED")
    filenames = request.form.getlist(Storage.FILE_NAME)
    if len(files) != len(filenames):
        raise Exception("FILENAME REQUIRED")
    for filename in filenames:
        validate_str_empty(filename, "FILENAME EMPTY")
    folder_id = request.form.get(Storage.FOLDER_ID)
    validate_folder(folder_id)
    ## 处理
    remarks = request.form.getlist(Storage.REMARK)
    for i, file in enumerate(files):
        data = save_file(file)
        remark = remarks[i] if i < len(remarks) else None
        data.update({
            Storage.FOLDER_ID: folder_id,
            Storage.FILE_NAME: filenames[i],
            Storage.UPLOADER: decoded.get(Session.USER_ID),
            Storage.REMARK: remark
        })
        STORAGE_DB.add_data(data).get(Storage.FILE_ID)
    return gen_success_response(request, "CREATE SUCCESS", 201)


@STORAGE_BP.route(gen_prefix_api("/storages"), methods=["GET"])
@catch_exception
@token_required
@page_args_required
def search_storages():
    """搜索文件"""
    return jsonify(
        search_storage_data(
            request.args.get(Storage.FOLDER_ID),
            request.args.get(Params.SEARCH),
            int(request.args.get(Params.PAGE)),
            int(request.args.get(Params.LIMIT))
        )
    )


@STORAGE_BP.route(gen_prefix_api("/storages/folders"), methods=["POST"])
@catch_exception
def add_folder():
    """新增文件夹"""
    decoded = verify_token(request)
    data = request.json
    ## 校验
    validate_dict_str_empty(data, Storage.FILE_NAME, "FILENAME EMPTY")
    validate_folder(data.get(Storage.FOLDER_ID))
    ## 处理
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


@STORAGE_BP.route(gen_prefix_api("/storages/files/<file_id>"), methods=["GET"])
@catch_exception
@token_required
def get_file(file_id: str):
    """获取文件详情"""
    return jsonify(STORAGE_DB.get_file_data(file_id))


@STORAGE_BP.route(gen_prefix_api("/storages/folders"), methods=["GET"])
@catch_exception
@token_required
def get_default_folder():
    """获取文件夹详情"""
    return jsonify(search_storage_data(None, None, 0, None))


@STORAGE_BP.route(gen_prefix_api("/storages/folders/<folder_id>"), methods=["PUT"])
@catch_exception
def edit_folder(folder_id: str):
    """编辑文件夹"""
    ## 校验
    validate_permission(request, folder_id, is_file=False)
    data = request.json
    validate_dict_str_empty(data, Storage.FILE_NAME, "FILENAME REQUIRED")
    validate_folder(data.get(Storage.FOLDER_ID))
    ## 处理
    data[Storage.FILE_ID] = folder_id
    STORAGE_DB.edit_data(data)
    return gen_success_response(request, "EDIT SUCCESS", 200)


@STORAGE_BP.route(gen_prefix_api("/storages/files/<file_id>"), methods=["PUT"])
@catch_exception
def edit_file(file_id: str):
    """编辑文件"""
    ## 校验
    validate_permission(request, file_id, is_file=True)
    data = request.json
    validate_dict_str_empty(data, Storage.FILE_NAME, "FILENAME REQUIRED")
    validate_folder(data.get(Storage.FOLDER_ID))
    ## 处理
    data[Storage.FILE_ID] = file_id
    STORAGE_DB.edit_data(data)
    return gen_success_response(request, "EDIT SUCCESS", 200)


@STORAGE_BP.route(gen_prefix_api("/storages/folders/<folder_id>"), methods=["DELETE"])
@catch_exception
def delete_folder(folder_id: str):
    """删除文件夹"""
    ## 校验
    validate_permission(request, folder_id, is_file=False)
    ## 处理
    STORAGE_DB.delete_folder(folder_id)
    return gen_success_response(request, "DELETE SUCCESS")


@STORAGE_BP.route(gen_prefix_api("/storages/files/<file_id>"), methods=["DELETE"])
@catch_exception
def delete_file(file_id: str):
    """删除文件"""
    ## 校验
    validate_permission(request, file_id, is_file=True)
    ## 处理
    STORAGE_DB.delete_file(file_id)
    return gen_success_response(request, "DELETE SUCCESS")


@STORAGE_BP.route(gen_prefix_api("/storages/files/<file_id>/download"), methods=["GET"])
@catch_exception
def download_file(file_id: str):
    """下载文件"""
    ## 校验
    verify_token_str(request.args.get(Session.ACCESS_TOKEN))
    file_data = STORAGE_DB.get_file_data(file_id)
    filepath = file_data.get(Storage.FILE_PATH)
    if not os.path.exists(filepath):
        raise Exception("FILE NOT FOUND")
    ## 处理
    filename = f"{file_data.get(Storage.FILE_NAME)}.{file_data.get(Storage.FILE_TYPE)}"
    mime_type, _ = mimetypes.guess_type(filepath)
    return Response(get_stream_io(filepath), mimetype=mime_type, headers={
        "Content-Disposition": "attachment;filename=%s" % quote(filename)
    })


@STORAGE_BP.route(gen_prefix_api("/storages/texts"), methods=["POST"])
@catch_exception
def add_text():
    """新增文本"""
    ## 校验
    verify_result = verify_token(request)
    now_user_id = verify_result.get(Session.USER_ID)
    data = request.json
    filename = data.get(Storage.FILE_NAME)
    validate_str_empty(filename, "FILENAME EMPTY")
    validate_folder(data.get(Storage.FOLDER_ID))
    content = data.get(Storage.CONTENT)
    validate_str_empty(content, "CONTENT EMPTY")
    ## 处理
    save_data = save_text(content)
    data.update(save_data)
    data.update({
        Storage.UPLOADER: now_user_id
    })
    STORAGE_DB.add_data(data).get(Storage.FILE_ID)
    return gen_success_response(request, "CREATE SUCCESS", 201)


@STORAGE_BP.route(gen_prefix_api("/storages/texts/<file_id>"), methods=["GET"])
@catch_exception
@token_required
def get_text(file_id: str):
    """获取文本内容"""
    file_data = STORAGE_DB.get_file_data(file_id)
    with open(file_data.get(Storage.FILE_PATH), 'r', encoding='utf-8') as file:
        content = file.read()
    return jsonify({
        Storage.CONTENT: content
    })


@STORAGE_BP.route(gen_prefix_api("/storages/texts/<file_id>"), methods=["PUT"])
@catch_exception
def edit_text(file_id: str):
    """编辑文本"""
    ## 校验
    validate_permission(request, file_id, is_file=True)
    data = request.json
    validate_dict_str_empty(data, Storage.FILE_NAME, "FILENAME REQUIRED")
    validate_folder(data.get(Storage.FOLDER_ID))
    content = data.get(Storage.CONTENT)
    validate_str_empty(content, "CONTENT EMPTY")
    ## 处理
    data[Storage.FILE_ID] = file_id
    file_data = STORAGE_DB.get_file_data(file_id)
    save_data = save_text(content, rewrite_path=file_data.get(Storage.FILE_PATH))
    data.update(save_data)
    STORAGE_DB.edit_data(data)
    return gen_success_response(request, "EDIT SUCCESS", 200)

def validate_permission(request_in: Request, file_id, is_file: bool):
    """校验文件权限"""
    verify_result = verify_token(request_in)
    now_user_id = verify_result.get(Session.USER_ID)
    if is_file:
        file_data = STORAGE_DB.get_file_data(file_id)
    else:
        file_data = STORAGE_DB.get_folder_data(file_id)
    if (not USER_DB.match_role(now_user_id, Role.ADMIN) and now_user_id != file_data.get(
            Storage.UPLOADER)) or file_data.get(Storage.FOLDER_ID) is None:
        raise Exception("PERMISSION DENIED")


def validate_folder(folder_id: str):
    """校验文件夹ID"""
    validate_str_empty(folder_id, "FOLDER REQUIRED")
    if not STORAGE_DB.is_folder_exist(folder_id):
        raise Exception("FOLDER NOT FOUND")
