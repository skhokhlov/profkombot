import sys
import os
from flask import Flask, jsonify, make_response, abort
import psycopg2

app = Flask(__name__)

try:
    conn = psycopg2.connect("dbname='postgres' user='postgres' host='db' password='" +
                            os.environ.get('DATABASE_PASSWORD') + "'")
except:
    print("Unexpected error:", sys.exc_info()[0])
    raise


@app.route('/api/v1/user/<int:user_phone>', methods=['GET'])
def get_user(user_phone):
    try:
        cur = conn.cursor()
        cur.execute("""SELECT * FROM test WHERE tel=%s""", [user_phone])
        rows = cur.fetchall()
        rows.append(('status', 'OK'))
        rows.reverse()
        return jsonify(rows)

    except psycopg2.Error as exception:
        return jsonify({
            'status': 'Error',
            'error': exception.pgerror
        })


@app.route('/api/v1/chat/<int:chat_id>/tel/<int:tel>', methods=['POST'])
def set_chat(chat_id, tel):
    try:
        cur = conn.cursor()
        cur.execute("""INSERT INTO chats (chat_id, tel) VALUES ($s, %s) ON CONFLICT (chat_id) DO UPDATE""",
                    [chat_id, tel])
        return jsonify({'status': 'OK'})

    except psycopg2.Error as exception:
        return jsonify({
            'status': 'Error',
            'error': exception.pgerror
        })


@app.route('/api/v1/chat/<int:chat_id>', methods=['GET'])
def get_chat(chat_id):
    try:
        cur = conn.cursor()
        cur.execute("""SELECT chat_id, tel FROM chats WHERE chat_id=%s""", [chat_id])
        rows = cur.fetchall()
        rows.append(('status', 'OK'))
        rows.reverse()
        return jsonify(rows)

    except psycopg2.Error as exception:
        return jsonify({
            'status': 'Error',
            'error': exception.pgerror
        })


@app.route('/', methods=['GET'])
def get_home():
    return jsonify({'status': 'OK'})


@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'status': 'Not Found'}), 404)


if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)
