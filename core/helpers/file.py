import json
import os.path
from typing import LiteralString, Union, Dict, List


def load_json(filepath: Union[LiteralString, str]):
    """
    加载本地的JSON数据
    :param filepath: 文件路径
    :return:
    """
    if not os.path.exists(filepath) or not os.path.isfile(filepath):
        raise FileNotFoundError(str(filepath))
    with open(filepath, encoding="utf-8") as file:
        return json.load(file)


def write_json(filepath: Union[LiteralString, str], data: Union[Dict, List], ensure_ascii: bool = False,
               indent=4):
    """
    写json数据到本地文件，若文件不存在则新建
    :param filepath: 文件路径
    :param data: 写入数据
    :param ensure_ascii: 是否转码
    :param indent: 缩进
    :return:
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=ensure_ascii, indent=indent)


def get_filelist(folder: Union[LiteralString, str], extensions: List[str] = None) -> list[Union[LiteralString, str]]:
    """
    获取该路径对应的文件列表，未指定suffixes则返回所有
    :param extensions:
    :param folder:
    :param suffixes:
    :return:
    """
    filelist = []
    for filename in os.listdir(folder):
        filepath = os.path.join(folder, filename)
        if os.path.isfile(filepath) and (extensions is None or os.path.splitext(filename)[-1].lower() in extensions):
            filelist.append(filename)
    return filelist
