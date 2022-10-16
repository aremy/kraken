import requests
from flask import Flask, render_template, request as flask_request

app = Flask(__name__)


@app.route("/", methods=['GET'])
def index():
    return render_template("index.html")


@app.route("/trades", methods=['GET'])
def trades():
    args = flask_request.args
    return requests.get(f"https://api.kraken.com/0/public/Trades?pair={args.get('pair')}").json()


if __name__ == '__main__':
   app.run()