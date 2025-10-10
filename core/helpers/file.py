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
        raise FileNotFoundError(f"文件不存在或非文件：{filepath}")
    with open(filepath) as file:
        return json.load(file)


def write_json(filepath: Union[LiteralString, str], data: Union[Dict, List], ensure_ascii: bool = False, indent=4):
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
