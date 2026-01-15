import os
import shutil

from core.helpers.route import clear_webasset_cache

if __name__ == "__main__":
    # 用于本地测试清除缓存和打包文件
    clear_webasset_cache()
    dist_folder = os.path.join(os.getcwd(), "dist")
    if os.path.exists(dist_folder):
        shutil.rmtree(dist_folder)