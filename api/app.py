import os
import json
import re
import ast
from enum import Enum
import redis
from flask import Flask, make_response, abort, request

app = Flask(__name__)
r = redis.Redis(host='redis', port=6379, db=0)


class Tables(Enum):
    RZD = 'RZD'
    SUBSIDIES = 'SUBSIDIES'


def parse_number(tel):
    return re.sub(r'^8', '7', str(int(tel)))


def response(data, status=200):
    return make_response(json.dumps(data), status)


def update_index(index, phone_numbers):
    for tel in phone_numbers:
        r.sadd(parse_number(tel), index)


def check_in_index(index, tel):
    return r.sismember(tel, index)


@app.route('/api/v1/rzd/<int:user_phone>', methods=['GET'])
def get_rzd(user_phone):
    if check_in_index(Tables.RZD.value, parse_number(user_phone)):
        return response(dict(zip([Tables.RZD.value], [True])))

    else:
        return response(dict(zip([Tables.RZD.value], [False])), 404)


@app.route('/api/v1/subsidies/<int:user_phone>', methods=['GET'])
def get_subsidies(user_phone):
    if check_in_index(Tables.SUBSIDIES.value, parse_number(user_phone)):
        return response(dict(zip([Tables.SUBSIDIES.value], [True])))

    else:
        return response(dict(zip([Tables.SUBSIDIES.value], [False])), 404)


@app.route('/api/v1/rzd', methods=['PUT'])
def update_rzd():
    data = request.form.get('phone_numbers', False)
    if data:
        update_index(Tables.RZD.value, ast.literal_eval(data))
        return response(dict(zip(['status'], ['OK'])))

    else:
        return response(dict(zip(['status'], ['Bad Request'])), 400)


@app.route('/api/v1/subsidies', methods=['PUT'])
def update_subsidies():
    data = request.form.get('phone_numbers', False)
    if data:
        update_index(Tables.SUBSIDIES.value, ast.literal_eval(data))
        return response(dict(zip(['status'], ['OK'])))

    else:
        return response(dict(zip(['status'], ['Bad Request'])), 400)


@app.route('/', methods=['GET'])
def get_home():
    return response(dict(zip(['status'], ['OK'])))


@app.errorhandler(404)
def not_found(error):
    return response(dict(zip(['status'], ['Not Found'])), 404)


@app.errorhandler(405)
def method_not_allowed(error):
    return response(dict(zip(['status'], ['Method Not Allowed'])), 405)


@app.errorhandler(500)
def server_error(error):
    return response(dict(zip(['status'], ['Server Error'])), 400)


if __name__ == '__main__':
    app.run(host="0.0.0.0", threaded=True, debug=True)
