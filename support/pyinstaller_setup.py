import os.path
import shutil
import subprocess

from core.helpers.route import clear_webasset_cache

if __name__ == "__main__":
    dist_folder = os.path.join(os.getcwd(), "dist")
    if dist_folder:
        shutil.rmtree(dist_folder)
    source_path = os.path.join(os.getcwd(), "sources")
    des_path = os.path.join(dist_folder, "sources")
    shutil.copytree(source_path, des_path, dirs_exist_ok=True)

    clear_webasset_cache() ## 清除测试时产生的缓存
    source_path = os.path.join(os.getcwd(), "data/static")
    des_path = os.path.join(dist_folder, "data/static")
    os.makedirs(des_path, exist_ok=True)
    shutil.copytree(source_path, des_path, dirs_exist_ok=True)

    source_path = os.path.join(os.getcwd(), "config")
    des_path = os.path.join(dist_folder, "config")
    os.makedirs(des_path, exist_ok=True)
    shutil.copytree(source_path, des_path, dirs_exist_ok=True)
    try:
        command = "pyinstaller main.spec"
        result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True, encoding="utf-8")
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"FAIL: {e.stderr}")
