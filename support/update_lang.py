import subprocess

if __name__ == "__main__":
    try:
        # 更新字段
        command = "pybabel update -i .\\sources\\locale\\messages.pot -d .\\sources\\locale\\"
        result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True, encoding="utf-8")
        print(result.stdout)

        # 编译
        command = "pybabel compile -d .\\sources\\locale\\"
        result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True, encoding="utf-8")
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"FAIL: {e.stderr}")