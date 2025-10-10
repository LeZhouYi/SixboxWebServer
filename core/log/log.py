import logging
import os
import sys
from logging.handlers import TimedRotatingFileHandler

from core.config import get_section


def init_logger() -> logging.Logger:
    """
    初始化日志
    :return:
    """
    config: dict = get_section("logger")
    folder = config.get("folder")
    os.makedirs(folder, exist_ok=True)
    logging.basicConfig(
        level=config.get("level"),
        format=config.get("format"),
        handlers=[
            TimedRotatingFileHandler(**config.get("file_handler")),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger(config.get("name"))

logger = init_logger()