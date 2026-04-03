import os
import sys
import io
import re
import sqlite3
import time
from flask import Flask, request, redirect, url_for, render_template, jsonify, g
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB global max

BASE_UPLOAD = '/app/uploads'
DB_PATH = '/app/neongallery.db'

FLAGS = {
    1: ('FLAG{upl04d_unr3str1ct3d}', '/app/flag.txt'),
    2: ('FLAG{upl04d_3xt_byp4ss}', '/app/flag2.txt'),
    3: ('FLAG{upl04d_ct_byp4ss}', '/app/flag3.txt'),
    4: ('FLAG{upl04d_m4g1c_byt3s}', '/app/flag4.txt'),
    5: ('FLAG{upl04d_s1z3_l1m1t}', '/app/flag5.txt'),
}

BLOCKED_EXTENSIONS = {'.py', '.sh', '.php', '.jsp', '.exe', '.bat'}

IMAGE_MAGIC = [
    b'\x89PNG',
    b'\xff\xd8\xff\xe0',
    b'GIF8',
]


def init_dirs():
    for i in range(1, 6):
        os.makedirs(os.path.join(BASE_UPLOAD, f'ch{i}'), exist_ok=True)
    for ch, (flag_val, flag_path) in FLAGS.items():
        with open(flag_path, 'w') as f:
            f.write(flag_val + '\n')


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.execute('''CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        content_type TEXT,
        challenge INTEGER NOT NULL,
        timestamp REAL NOT NULL
    )''')
    db.execute('''CREATE TABLE IF NOT EXISTS flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        value TEXT NOT NULL
    )''')
    db.execute('DELETE FROM flags')
    for ch, (flag_val, _) in FLAGS.items():
        db.execute('INSERT INTO flags (name, value) VALUES (?, ?)',
                   (f'challenge_{ch}', flag_val))
    db.commit()
    db.close()


def save_upload(file_storage, challenge, filename_override=None):
    original = file_storage.filename
    if filename_override:
        fname = filename_override
    else:
        fname = original
    fname = fname.replace('/', '_').replace('\\', '_')
    dest_dir = os.path.join(BASE_UPLOAD, f'ch{challenge}')
    dest = os.path.join(dest_dir, fname)
    file_storage.save(dest)
    db = get_db()
    db.execute(
        'INSERT INTO uploads (filename, original_name, content_type, challenge, timestamp) VALUES (?, ?, ?, ?, ?)',
        (fname, original, file_storage.content_type, challenge, time.time())
    )
    db.commit()
    return fname, dest


# ---------- Routes ----------

@app.route('/')
def index():
    files = {}
    for i in range(1, 6):
        ch_dir = os.path.join(BASE_UPLOAD, f'ch{i}')
        if os.path.isdir(ch_dir):
            files[i] = os.listdir(ch_dir)
        else:
            files[i] = []
    return render_template('index.html', files=files)


@app.route('/files')
def list_files():
    ch = request.args.get('ch', '1')
    try:
        ch = int(ch)
    except ValueError:
        ch = 1
    ch_dir = os.path.join(BASE_UPLOAD, f'ch{ch}')
    if os.path.isdir(ch_dir):
        listing = os.listdir(ch_dir)
    else:
        listing = []
    return jsonify(challenge=ch, files=listing)


# ===== Challenge 1: No validation =====
@app.route('/upload', methods=['POST'])
def upload_ch1():
    f = request.files.get('file')
    if not f or f.filename == '':
        return render_template('result.html', title='Challenge 1', success=False,
                               message='No file selected.')
    fname, dest = save_upload(f, 1)
    return render_template('result.html', title='Challenge 1', success=True,
                           message=f'File uploaded: {fname}', challenge=1, filename=fname)


# ===== Challenge 2: Extension blacklist (bypassable) =====
@app.route('/upload-filtered', methods=['POST'])
def upload_ch2():
    f = request.files.get('file')
    if not f or f.filename == '':
        return render_template('result.html', title='Challenge 2', success=False,
                               message='No file selected.')
    original = f.filename
    _, ext = os.path.splitext(original)
    # Vulnerability: only checks lowercase exact match of final extension
    if ext.lower() in BLOCKED_EXTENSIONS:
        return render_template('result.html', title='Challenge 2', success=False,
                               message=f'Extension "{ext}" is blocked! Nice try.')
    fname, dest = save_upload(f, 2)
    return render_template('result.html', title='Challenge 2', success=True,
                           message=f'File uploaded: {fname}', challenge=2, filename=fname)


# ===== Challenge 3: Content-Type check (bypassable) =====
@app.route('/upload-ct', methods=['POST'])
def upload_ch3():
    f = request.files.get('file')
    if not f or f.filename == '':
        return render_template('result.html', title='Challenge 3', success=False,
                               message='No file selected.')
    ct = f.content_type or ''
    if not ct.startswith('image/'):
        return render_template('result.html', title='Challenge 3', success=False,
                               message=f'Only image uploads allowed. Got Content-Type: {ct}')
    fname, dest = save_upload(f, 3)
    return render_template('result.html', title='Challenge 3', success=True,
                           message=f'File uploaded: {fname}', challenge=3, filename=fname)


# ===== Challenge 4: Magic bytes check (bypassable) =====
@app.route('/upload-magic', methods=['POST'])
def upload_ch4():
    f = request.files.get('file')
    if not f or f.filename == '':
        return render_template('result.html', title='Challenge 4', success=False,
                               message='No file selected.')
    header = f.read(4)
    f.seek(0)
    valid = any(header.startswith(m) for m in IMAGE_MAGIC)
    if not valid:
        return render_template('result.html', title='Challenge 4', success=False,
                               message=f'Invalid magic bytes. File does not appear to be an image.')
    fname, dest = save_upload(f, 4)
    return render_template('result.html', title='Challenge 4', success=True,
                           message=f'File uploaded: {fname}', challenge=4, filename=fname)


# ===== Challenge 5: Size limit (bypassable) =====
@app.route('/upload-size', methods=['POST'])
def upload_ch5():
    f = request.files.get('file')
    if not f or f.filename == '':
        return render_template('result.html', title='Challenge 5', success=False,
                               message='No file selected.')
    data = f.read()
    if len(data) > 100:
        return render_template('result.html', title='Challenge 5', success=False,
                               message=f'File too large ({len(data)} bytes). Max 100 bytes.')
    f.seek(0)
    fname, dest = save_upload(f, 5)
    return render_template('result.html', title='Challenge 5', success=True,
                           message=f'File uploaded: {fname} ({len(data)} bytes)', challenge=5, filename=fname)


# ===== /run — Execute uploaded Python file =====
@app.route('/run')
def run_file():
    fname = request.args.get('file', '')
    ch = request.args.get('ch', '1')
    try:
        ch = int(ch)
    except ValueError:
        ch = 1
    if not fname:
        return render_template('result.html', title='Run', success=False,
                               message='No file specified.')

    # For ch2, also accept .py3, .Py, .PY etc.
    allowed_run_ext = {'.py', '.py3'}
    _, ext = os.path.splitext(fname)
    if ext.lower() not in allowed_run_ext:
        return render_template('result.html', title='Run', success=False,
                               message=f'Cannot execute files with extension "{ext}". Only Python files.')

    fpath = os.path.join(BASE_UPLOAD, f'ch{ch}', fname)
    if not os.path.isfile(fpath):
        return render_template('result.html', title='Run', success=False,
                               message=f'File not found: {fname}')

    try:
        with open(fpath, 'rb') as fp:
            raw = fp.read()

        # Strip leading non-ASCII bytes (for magic byte bypass in ch4)
        text = raw.decode('utf-8', errors='ignore')
        # Remove any leading non-printable / non-ASCII characters before first valid Python
        cleaned = re.sub(r'^[^\x20-\x7e\n\r\t]+', '', text)

        old_stdout = sys.stdout
        sys.stdout = captured = io.StringIO()
        try:
            exec(cleaned, {'__builtins__': __builtins__})
        except Exception as e:
            captured.write(f'Error: {e}\n')
        finally:
            sys.stdout = old_stdout

        output = captured.getvalue()
    except Exception as e:
        output = f'Execution error: {e}'

    return render_template('result.html', title='Run Output', success=True,
                           message=f'Executed {fname}', output=output, challenge=ch, filename=fname)


# ---------- Startup ----------
init_dirs()
init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5010, debug=False)
