import threading
from functools import wraps


def lock_required(lock: threading.Lock, timeout: int = 300):
    """
    加锁
    :return:
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            acquired = lock.acquire_lock(timeout=timeout)
            if not acquired:
                raise Exception(f"获取得锁超时:{timeout}，函数：{func}")
            try:
                return func(*args, **kwargs)
            finally:
                lock.release_lock()

        return wrapper

    return decorator
