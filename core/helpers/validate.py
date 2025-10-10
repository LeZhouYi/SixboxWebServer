def validate_str_empty(value: str, info_template: str):
    """
    校验字符串不能为空
    :param value: 要检查的值
    :param info_template: 输出的错误提示
    :return:
    """
    if value is None or value.strip() == "":
        raise Exception(info_template or "string empty")
