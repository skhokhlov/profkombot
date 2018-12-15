import sys
import os
import json
from flask import Flask, jsonify, make_response, abort
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)


conn = psycopg2.connect("dbname='postgres' user='postgres' host='db' password='" +
                        os.environ.get('DATABASE_PASSWORD') + "'")


@app.route('/api/v1/user/<int:user_phone>', methods=['GET'])
def get_user(user_phone):
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""SELECT id, tel, first_name FROM test WHERE tel=%s""", [user_phone])
        rows = cur.fetchall()

        if len(rows) == 0:
            return make_response(json.dumps([dict(zip(['status'], ['Not Found']))]), 404)

        else:
            return make_response(json.dumps(rows), 200)

    except psycopg2.Error as exception:
        return make_response(json.dumps([dict(zip(['status', 'error'], ['Error', exception.pgerror]))]), 500)


@app.route('/api/v1/chat/<int:chat_id>/tel/<int:tel>', methods=['POST'])
def set_chat(chat_id, tel):
    try:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO chats VALUES (%s, %s) ON CONFLICT (chat_id) DO UPDATE SET chat_id = EXCLUDED.chat_id""",
            [chat_id, tel])
        conn.commit()
        return make_response(json.dumps([dict(zip(['status'], ['OK']))]), 404)

    except psycopg2.Error as exception:
        return make_response(json.dumps([dict(zip(['status', 'error'], ['Error', exception.pgerror]))]), 500)


@app.route('/api/v1/chat/<int:chat_id>', methods=['GET'])
def get_chat(chat_id):
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""SELECT chat_id, tel FROM chats WHERE chat_id=%s""", [chat_id])
        rows = cur.fetchall()

        if len(rows) == 0:
            return make_response(json.dumps([dict(zip(['status'], ['Not Found']))]), 404)

        else:
            return make_response(json.dumps(rows), 200)

    except psycopg2.Error as exception:
        return make_response(json.dumps([dict(zip(['status', 'error'], ['Error', exception.pgerror]))]), 500)


@app.route('/', methods=['GET'])
def get_home():
    return jsonify({'status': 'OK'})


@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'status': 'Not Found'}), 404)


if __name__ == '__main__':
    app.run(host="0.0.0.0", threaded=True, debug=True)
