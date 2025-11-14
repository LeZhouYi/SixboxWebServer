from typing import Union


def validate_str_empty(value: str) -> bool:
    """
    校验字符串是否为空
    :param value: 要检查的值
    :return: True 表示字符串为空
    """
    return value is None or value.strip() == ""


def validate_dict_str_empty(data: dict, key: str) -> bool:
    """
    校验dict中key对应的字符串是否为空
    :param data:
    :param key:
    :return:
    """
    return validate_str_empty(data.get(key))


def validate_int_empty(value: Union[str, int, None], min_value: int = None, max_value: int = None) -> bool:
    """
    校验整数
    :param value:
    :param min_value:
    :param max_value:
    :return:
    """
    if value is None:
        return True
    value = int(value)
    return (min_value is not None and value < min_value) or (max_value is not None and value > max_value)
