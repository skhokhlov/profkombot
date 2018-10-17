from flask import Flask, jsonify, make_response, abort

app = Flask(__name__)


@app.route('/', methods=['GET'])
def get_tasks():
    return jsonify({'status': 'OK'})


@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Not Found'}), 404)


if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)
