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
    cur = conn.cursor()
    cur.execute("""SELECT * from test where tel=%s""", [user_phone])
    rows = cur.fetchall()
    return jsonify(rows)


@app.route('/', methods=['GET'])
def get_home():
    return jsonify({'status': 'OK'})


@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Not Found'}), 404)


if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)
