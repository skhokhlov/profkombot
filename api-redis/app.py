import os
import json
import re
from enum import Enum
import redis
from flask import Flask, jsonify, make_response, abort

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

# @app.route('/api/v1/rzd', methods=['PUT'])
# def db_update(request):
#     request.files