from core.config import get_section

__config = get_section("flask")

def __get_env(key:str):
    """
    获取env配置
    :param key:
    :return:
    """
    global __config
    return __config["env"][key]

def gen_prefix_api(api_str: str) -> str:
    """
    生成添加了前缀的api
    :param api_str:
    :return:
    """
    return __get_env(api_str)