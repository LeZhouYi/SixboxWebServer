import os

import logging.config

logger_save_path = "data/logs"
os.makedirs(logger_save_path, exist_ok=True)


class ShortNameFormatter(logging.Formatter):
    def format(self, record):
        # 修改record的name属性
        original_name = record.name
        record.name = original_name.split('.')[-1]
        result = super().format(record)
        record.name = original_name  # 恢复原始值
        return result


LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {
            "()": ShortNameFormatter,
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        },
        "standard": {
            "format": "%(asctime)s [%(process)d] %(name)s %(levelname)s: %(message)s"
        }
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "formatter": "simple",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout"
        },
        "file": {
            "class": "logging.handlers.TimedRotatingFileHandler",
            "filename": "data/logs/log.log",
            "when": "midnight",
            "interval": 1,
            "backupCount": 30,
            "encoding": "utf-8",
            "formatter": "simple"
        }
    },
    "root": {
        "handlers": [
            "console",
            "file"
        ],
        "level": "INFO"
    }
}


def init_logging():
    """初始化日志"""
    # noinspection PyUnresolvedReferences
    logging.config.dictConfig(LOGGING_CONFIG)