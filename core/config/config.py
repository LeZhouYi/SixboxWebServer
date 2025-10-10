from core.helpers.file import load_json

__config = load_json("config/config.json")

def get_section(section: str):
    """
    读取当前配置对应节点
    :param section: 对应节点
    :return: DEFAULT中字段对应的值
    """
    if section in __config:
        return __config[section]
    raise KeyError(section)

def get_config(section: str, option: str) -> any:
    """
    读取当前配置对应字段的值
    :param section: 对应节点
    :param option: 字段
    :return: DEFAULT中字段对应的值
    """
    if section in __config:
        section_value = __config[section]
        if option in section_value:
            return section_value[option]
    raise KeyError(option)