from flask import Blueprint, render_template

PAGE_BP = Blueprint("page", __name__)


@PAGE_BP.route("/login.html", methods=["GET"])
def login():
    """登录页"""
    return render_template("page/login.html")
