def validate_str_empty(value: str) -> bool:
    """
    校验字符串是否为空
    :param value: 要检查的值
    :return: True 表示字符串为空
    """
    return value is None or value.strip() == ""

def validate_dict_str_empty(data: dict, key:str)->bool:
    """
    校验dict中key对应的字符串是否为空
    :param data:
    :param key:
    :return:
    """
    return validate_str_empty(data.get(key))