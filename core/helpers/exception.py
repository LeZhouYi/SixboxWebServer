from gettext import NullTranslations

from flask import jsonify

from core.helpers.route import ResponseKey


class ApiException(Exception):

    def __init__(self, message_key: str, status_code: int = 400):
        self.message_key = message_key
        self.status_code = status_code

    def gen_response(self, translator: NullTranslations):
        """
        生成该错误的返回内容
        :param translator:
        :return:
        """
        return jsonify({
            ResponseKey.STATUS: translator.gettext("FAIL RESULT"),
            ResponseKey.MESSAGE: translator.gettext(self.message_key)
        }), self.status_code
