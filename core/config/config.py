from core.helpers.file import load_json

__config = load_json("config/config.json")

def get_config(option: str):
    """
    读取当前配置对应字段的值
    :param option: [str]字段
    :return: [any]DEFAULT中字段对应的值
    """
    if option in __config:
        return __config[option]
    raise KeyError(option)