from typing import Union


def validate_str_empty(value: str, message: str):
    """
    校验字符串是否为空
    :param message: 为空时抛出的Exception信息
    :param value: 要检查的值
    """
    if value is None or value.strip() == "":
        raise Exception(message)


def validate_dict_str_empty(data: dict, key: str, message: str):
    """
    校验dict中key对应的字符串是否为空
    :param message:
    :param data:
    :param key:
    :return:
    """
    validate_str_empty(data.get(key), message)


def validate_int(value: Union[str, int, None], min_value: int = None, max_value: int = None, messages: str = ""):
    """
    校验整数
    :param messages:
    :param value:
    :param min_value:
    :param max_value:
    :return:
    """
    if value is None:
        raise Exception(messages)
    value = int(value)
    if (min_value is not None and value < min_value) or (max_value is not None and value > max_value):
        raise Exception(messages)


def validate_str_list(data: list, message: str = ""):
    """
    校验列表及列表内容是否为str且非空
    :param message:
    :param data:
    :return:
    """
    if not isinstance(data, list):
        raise Exception(message)
    for item in data:
        validate_str_empty(item, message)
