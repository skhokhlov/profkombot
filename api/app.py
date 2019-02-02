import os
import json
import re
import csv
from enum import Enum
import redis
from flask import Flask, make_response, abort

app = Flask(__name__)
r = redis.Redis(host='redis', port=6379, db=0)

class Tables(Enum):
    RZD = 'RZD'

def parse_number(tel):
    return re.sub(r'^8', '7', str(int(tel)))

@app.route('/api/v1/rzd/<int:user_phone>', methods=['GET'])
def get_user(user_phone):
    tel = parse_number(user_phone)
    if r.sismember(tel, Tables.RZD):
        return make_response(json.dumps(dict(zip(['rzd'], [True]))), 200)

    else:
        return make_response(json.dumps(dict(zip(['rzd'], [False]))), 404)

@app.route('/api/v1/rzd', methods=['PUT'])
def db_update(request):
    if request.files[0]:
        csv_reader = csv.reader(request.files[0], delimiter=',')
        line_count = 0
        for row in csv_reader:
            if line_count == 0:
                line_count += 1
            else:
                r.sadd(row[6], Tables.RZD)
                line_count += 1

        make_response(json.dumps(dict(zip(['status'], ['OK']))), 200)

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
    app.run(host="0.0.0.0", threaded=True, debug=True)