from flask import Blueprint, render_template

PAGE_BP = Blueprint("page", __name__)


@PAGE_BP.route("/login.html", methods=["GET"])
def login():
    """登录页"""
    return render_template("page/login.html")


@PAGE_BP.route("/home.html", methods=["GET"])
def home():
    """主页"""
    return render_template("page/storage.html")


@PAGE_BP.route("/", methods=["GET"])
def default():
    """主页"""
    return render_template("page/storage.html")

@PAGE_BP.route("/music.html", methods=["GET"])
def music():
    """音乐盒"""
    return render_template("page/music.html")

@PAGE_BP.route("/tools/pdf_editor.html", methods=["GET"])
def pdf_editor():
    """音乐盒"""
    return render_template("page/tools/pdf_editor.html")