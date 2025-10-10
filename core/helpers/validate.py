
def validate_str_empty(value: str, info_template: str):
    if value is None or value.strip()== "":
        raise Exception(info_template or "string empty")