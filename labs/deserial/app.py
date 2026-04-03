import os
import base64
import pickle
import hmac
import hashlib
import json

from flask import Flask, request, render_template, make_response, redirect, url_for
import yaml

app = Flask(__name__)
app.secret_key = 'neoncache-dev-key'

# ---------------------------------------------------------------------------
# Flag files — written at startup
# ---------------------------------------------------------------------------
FLAGS = {
    '/app/flag.txt':  'FLAG{d3s3r14l_p1ckl3}',
    '/app/flag2.txt': 'FLAG{d3s3r14l_c00k1e_f0rg3}',
    '/app/flag3.txt': 'FLAG{d3s3r14l_y4ml_0bj}',
    '/app/flag4.txt': 'FLAG{d3s3r14l_0bj_1nj3ct}',
    '/app/flag5.txt': 'FLAG{d3s3r14l_t4mp3r}',
}

for path, flag in FLAGS.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(flag)

# ---------------------------------------------------------------------------
# Shared HMAC helpers (Challenge 2)
# ---------------------------------------------------------------------------
COOKIE_SECRET = b'secret'  # intentionally weak


def sign_cookie(data_bytes: bytes) -> str:
    b64 = base64.b64encode(data_bytes).decode()
    sig = hmac.new(COOKIE_SECRET, data_bytes, hashlib.sha256).hexdigest()
    return f'{b64}.{sig}'


def verify_cookie(cookie_value: str):
    try:
        b64, sig = cookie_value.rsplit('.', 1)
        raw = base64.b64decode(b64)
        expected = hmac.new(COOKIE_SECRET, raw, hashlib.sha256).hexdigest()
        if hmac.compare_digest(sig, expected):
            return pickle.loads(raw)
    except Exception:
        pass
    return None


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
# Challenge 2 — Signed Cookie Forgery (GET /dashboard, GET /login)
# ---------------------------------------------------------------------------
@app.route('/login')
def login():
    session_obj = {'username': 'guest', 'role': 'user'}
    cookie_val = sign_cookie(pickle.dumps(session_obj))
    resp = make_response(render_template('login.html', logged_in=True))
    resp.set_cookie('session_data', cookie_val)
    return resp


@app.route('/dashboard')
def dashboard():
    cookie = request.cookies.get('session_data')
    if not cookie:
        return render_template('dashboard.html', error='No session cookie. Visit /login first.')

    session_obj = verify_cookie(cookie)
    if session_obj is None:
        return render_template('dashboard.html', error='Invalid or tampered session cookie.')

    username = session_obj.get('username', '?')
    role = session_obj.get('role', '?')
    flag = None
    if role == 'admin':
        try:
            flag = open('/app/flag2.txt').read()
        except Exception:
            flag = 'Error reading flag.'
    return render_template('dashboard.html', username=username, role=role, flag=flag)


# ---------------------------------------------------------------------------
# Challenge 3 — YAML Unsafe Load (POST /api/restore)
# ---------------------------------------------------------------------------
@app.route('/challenge3')
def challenge3_page():
    return render_template('restore.html')


@app.route('/api/restore', methods=['POST'])
def yaml_restore():
    data = request.form.get('data', '')
    if not data:
        return render_template('restore.html', error='No YAML data provided.')
    try:
        obj = yaml.load(data, Loader=yaml.UnsafeLoader)
        # If the result has a read method (e.g. file/popen object), call it
        if hasattr(obj, 'read'):
            obj = obj.read()
        return render_template('restore.html', result=str(obj))
    except Exception as e:
        return render_template('restore.html', error=str(e))


# ---------------------------------------------------------------------------
# Challenge 4 — Custom Deserializer with eval (POST /import-data)
# ---------------------------------------------------------------------------
@app.route('/challenge4')
def challenge4_page():
    return render_template('import.html')


@app.route('/import-data', methods=['POST'])
def import_data():
    data = request.form.get('data', '')
    if not data:
        return render_template('import.html', error='No JSON data provided.')
    try:
        obj = json.loads(data)
    except json.JSONDecodeError as e:
        return render_template('import.html', error=f'Invalid JSON: {e}')

    try:
        if isinstance(obj, dict) and '__class__' in obj:
            cls = obj['__class__']
            args = obj.get('args', [])
            instance = eval(cls)(*args)  # intentionally vulnerable
            method = obj.get('method')
            if method:
                result = getattr(instance, method)()
            else:
                result = instance
            return render_template('import.html', result=str(result))
        else:
            return render_template('import.html', result=f'Imported object: {obj}')
    except Exception as e:
        return render_template('import.html', error=str(e))


# ---------------------------------------------------------------------------
# Challenge 5 — Pickle Tamper (GET /export, POST /import-pickle)
# ---------------------------------------------------------------------------
@app.route('/challenge5')
def challenge5_page():
    return redirect(url_for('export_data', format='pickle'))


@app.route('/export')
def export_data():
    fmt = request.args.get('format', 'json')
    user_obj = {'username': 'hacker', 'role': 'user', 'credits': 100}
    if fmt == 'pickle':
        raw = pickle.dumps(user_obj)
        b64 = base64.b64encode(raw).decode()
        return render_template('export.html', b64data=b64, user_obj=user_obj)
    return render_template('export.html', user_obj=user_obj)


@app.route('/import-pickle', methods=['POST'])
def import_pickle():
    data = request.form.get('data', '')
    if not data:
        return render_template('export.html', error='No data provided.')
    try:
        raw = base64.b64decode(data)
        obj = pickle.loads(raw)
        username = obj.get('username', '?')
        role = obj.get('role', '?')
        credits_ = obj.get('credits', 0)
        flag = None
        if role == 'admin' and credits_ > 9000:
            try:
                flag = open('/app/flag5.txt').read()
            except Exception:
                flag = 'Error reading flag.'
        return render_template('export.html', imported=True, username=username,
                               role=role, credits=credits_, flag=flag)
    except Exception as e:
        return render_template('export.html', error=str(e))


# ---------------------------------------------------------------------------
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5014, debug=False)
