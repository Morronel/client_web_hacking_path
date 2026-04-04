import os
import base64
import pickle

from flask import Flask, request, render_template

app = Flask(__name__)
app.secret_key = 'neoncache-dev-key'

# ---------------------------------------------------------------------------
# Flag files — written at startup
# ---------------------------------------------------------------------------
FLAGS = {
    '/app/flag.txt': 'FLAG{d3s3r14l_p1ckl3}',
}

for path, flag in FLAGS.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(flag)


# ---------------------------------------------------------------------------
# Homepage
# ---------------------------------------------------------------------------
@app.route('/')
def index():
    return render_template('index.html')


# ---------------------------------------------------------------------------
# Challenge 1 — Pickle Load (POST /load)
# ---------------------------------------------------------------------------
@app.route('/challenge1')
def challenge1_page():
    return render_template('load.html')


@app.route('/load', methods=['POST'])
def pickle_load():
    data = request.form.get('data', '')
    if not data:
        return render_template('load.html', error='No data provided.')
    try:
        raw = base64.b64decode(data)
        obj = pickle.loads(raw)
        return render_template('load.html', result=str(obj))
    except Exception as e:
        return render_template('load.html', error=str(e))


@app.route('/hint1')
def hint1():
    sample = base64.b64encode(pickle.dumps({'status': 'ok', 'value': 42})).decode()
    return render_template('load.html', hint=True, sample=sample)


# ---------------------------------------------------------------------------
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5014, debug=False)
