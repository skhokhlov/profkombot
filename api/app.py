import os
import json
import re
import ast
from enum import Enum
from datetime import date
import redis
from flask import Flask, make_response, abort, request

app = Flask(__name__)
r = redis.Redis(host='redis', port=6379, db=0)


class Tables(Enum):
    RZD = 'RZD'
    SUBSIDIES = 'SUBSIDIES'
    ANALYTICS = 'ANALYTICS'
    USERS = ANALYTICS + 'USERS'
    COUNTER = ANALYTICS + 'COUNTER'


def parse_number(tel):
    return re.sub(r'^8', '7', str(int(tel)))


def response(data, status=200):
    return make_response(json.dumps(data), status)


def update_index(index, phone_numbers):
    for tel in r.keys():
        r.srem(tel, index)

    for tel in phone_numbers:
        r.sadd(parse_number(tel), index)


def check_in_index(index, tel):
    return r.sismember(tel, index)


def update_analytics(index, data):
    return r.sadd(index, data)


def get_analytics(index):
    return r.smembers(index)


def incr_counter():
    r.hsetnx(Tables.COUNTER.value, str(date.today()), 0)
    r.hincrby(Tables.COUNTER.value, str(date.today()), 1)


def get_counter():
    return r.hgetall(Tables.COUNTER.value)


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


@app.route('/api/v1/analytics', methods=['POST', 'GET'])
def analytics():
    if request.method == 'POST':
        data = request.form.get('user', False)
        if data:
            update_analytics(Tables.USERS.value, data)
            return response(dict(zip(['status'], ['OK'])))

        else:
            return response(dict(zip(['status'], ['Bad Request'])), 400)

    elif request.method == 'GET':
        return response(str(get_analytics(Tables.USERS.value)))


@app.route('/api/v1/analytics/<string:section>', methods=['POST', 'GET'])
def analytics_section(section):
    section = section.upper()
    key = Tables.USERS.value + ':'

    if section == Tables.RZD.value:
        key += Tables.RZD.value

    elif section == Tables.SUBSIDIES.value:
        key += Tables.SUBSIDIES.value

    else:
        return not_found()

    if request.method == 'POST':
        data = request.form.get('user', False)
        if data:
            update_analytics(key, data)
            return response(dict(zip(['status'], ['OK'])))

        else:
            return response(dict(zip(['status'], ['Bad Request'])), 400)

    elif request.method == 'GET':
        return response(str(get_analytics(key)))


@app.route('/api/v1/analytics/counter', methods=['POST', 'GET'])
def analytics_counter():
    if request.method == 'POST':
        incr_counter()
        return response(dict(zip(['status'], ['OK'])))

    elif request.method == 'GET':
        return response(str(get_counter()))


@app.route('/', methods=['GET'])
def get_home():
    return response(dict(zip(['status'], ['OK'])))


@app.errorhandler(404)
def not_found():
    return response(dict(zip(['status'], ['Not Found'])), 404)


@app.errorhandler(405)
def method_not_allowed():
    return response(dict(zip(['status'], ['Method Not Allowed'])), 405)


@app.errorhandler(500)
def server_error():
    return response(dict(zip(['status'], ['Server Error'])), 400)


if __name__ == '__main__':
    app.run(host="0.0.0.0", threaded=True, debug=True)
