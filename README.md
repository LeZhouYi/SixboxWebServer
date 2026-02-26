## 简介
使用flask+tinydb构建的简单web服务

## 本地运行
- 搭建好python虚拟环境(3.12)后，安装依赖：
   ```commandline
   pip install poetry
   poetry install --no-root
   ```
- 运行main.py
  ```commandline
  python main.py
  ```

## babel 指令
确认环境是否已安装babel
```commandline
pybabel --version
```
初始化message.pot翻译文件模板
```commandline
pybabel extract -F .\config\babel.cfg -o .\sources\locale\messages.pot . -k lazy_gettext
```
创建”.po”翻译文件
```commandline
pybabel init -i .\sources\locale\messages.pot -d .\sources\locale\ -l zh 
```
编译po文件，并生成”*.mo”文件
```commandline
pybabel compile -d .\sources\locale\
```
更新翻译文件
```commandline
pybabel update -i .\sources\locale\messages.pot -d .\sources\locale\
```