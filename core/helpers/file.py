import json
import os.path
from typing import LiteralString, Union


def load_json(filepath: Union[LiteralString,str]):
    """
    加载本地的JSON数据
    :param filepath:
    :return:
    """
    if not os.path.exists(filepath) or not os.path.isfile(filepath):
        raise FileNotFoundError(f"文件不存在或非文件：{filepath}")
    with open(filepath) as file:
        return json.load(file)