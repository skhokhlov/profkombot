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

def parse_number(tel):
    return re.sub(r'^8', '7', str(int(tel)))

@app.route('/api/v1/rzd/<int:user_phone>', methods=['GET'])
def get_user(user_phone):
    tel = parse_number(user_phone)
    if r.sismember(tel, Tables.RZD.value):
        return make_response(json.dumps(dict(zip(['rzd'], [True]))), 200)

    else:
        return make_response(json.dumps(dict(zip(['rzd'], [False]))), 404)

@app.route('/api/v1/rzd', methods=['PUT'])
def db_update():
    data = request.form.get('phone_numbers', False)
    if data:
        for tel in ast.literal_eval(data):
            r.sadd(parse_number(tel), Tables.RZD.value)

        return make_response(json.dumps(dict(zip(['status'], ['OK']))), 200)

    else:
        return make_response(json.dumps(dict(zip(['status'], ['Bad Request']))), 400)

@app.route('/', methods=['GET'])
def get_home():
    return make_response(json.dumps(dict(zip(['status'], ['OK']))), 200)

@app.errorhandler(404)
def not_found(error):
    return make_response(json.dumps(dict(zip(['status'], ['Not Found']))), 404)

@app.errorhandler(405)
def method_not_allowed(error):
    return make_response(json.dumps(dict(zip(['status'], ['Method Not Allowed']))), 405)

@app.errorhandler(500)
def server_error(error):
    return make_response(json.dumps(dict(zip(['status'], ['Server Error']))), 500)


if __name__ == '__main__':
    app.run(host="0.0.0.0", threaded=True, debug=False)