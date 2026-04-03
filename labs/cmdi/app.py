import os
import re
import sqlite3
import subprocess
from datetime import datetime
from flask import Flask, request, render_template, g

app = Flask(__name__)

DATABASE = '/tmp/cmdi_lab.db'

# --- Flag setup ---
FLAGS = {
    '/app/flag.txt':  'FLAG{cmd1_b4s1c_1nj3ct}',
    '/app/flag2.txt': 'FLAG{cmd1_bl1nd_t1m3}',
    '/app/flag3.txt': 'FLAG{cmd1_f1lt3r_byp4ss}',
    '/app/flag4.txt': 'FLAG{cmd1_1fs_byp4ss}',
    '/app/flag5.txt': 'FLAG{cmd1_sp4c3_byp4ss}',
}


def init_flags():
    os.makedirs('/app', exist_ok=True)
    os.makedirs('/app/static', exist_ok=True)
    # Also ensure local static dir exists for blind exfiltration
    os.makedirs(os.path.join(app.root_path, 'static'), exist_ok=True)
    for path, flag in FLAGS.items():
        with open(path, 'w') as f:
            f.write(flag)


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DATABASE)
    db.execute('''
        CREATE TABLE IF NOT EXISTS command_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            user_input TEXT NOT NULL,
            command TEXT NOT NULL,
            output TEXT
        )
    ''')
    db.commit()
    db.close()


def log_command(endpoint, user_input, command, output=None):
    db = get_db()
    db.execute(
        'INSERT INTO command_log (timestamp, endpoint, user_input, command, output) VALUES (?, ?, ?, ?, ?)',
        (datetime.now().isoformat(), endpoint, user_input, command, output)
    )
    db.commit()


# -------------------------------------------------------
# Routes
# -------------------------------------------------------

@app.route('/')
def index():
    return render_template('index.html')


# --- Challenge 1: Basic command injection via os.popen ---
@app.route('/ping')
def ping():
    host = request.args.get('host', '')
    output = ''
    if host:
        cmd = f"ping -c 1 {host}"
        try:
            output = os.popen(cmd).read()
        except Exception as e:
            output = str(e)
        log_command('/ping', host, cmd, output)
    return render_template('ping.html', host=host, output=output, challenge=1)


# --- Challenge 2: Blind command injection ---
@app.route('/dns-check', methods=['GET', 'POST'])
def dns_check():
    domain = ''
    status = ''
    if request.method == 'POST':
        domain = request.form.get('domain', '')
        cmd = f"nslookup {domain}"
        try:
            result = os.popen(cmd).read()
            if 'Address' in result or 'Name' in result:
                status = 'success'
            else:
                status = 'failed'
        except Exception:
            status = 'failed'
        log_command('/dns-check', domain, cmd, status)
    return render_template('dns.html', domain=domain, status=status, challenge=2)


# --- Challenge 3: Filtered injection (bypass with $() or newline) ---
@app.route('/ping-safe')
def ping_safe():
    host = request.args.get('host', '')
    output = ''
    error = ''
    if host:
        # Block some dangerous characters but NOT $() or newline
        blocked = [';', '|', '&', '`']
        for ch in blocked:
            if ch in host:
                error = f"Blocked character detected: {ch}"
                log_command('/ping-safe', host, 'BLOCKED', error)
                return render_template('ping.html', host=host, output='', error=error, challenge=3)
        cmd = f"ping -c 1 {host}"
        try:
            output = os.popen(cmd).read()
        except Exception as e:
            output = str(e)
        log_command('/ping-safe', host, cmd, output)
    return render_template('ping.html', host=host, output=output, error=error, challenge=3)


# --- Challenge 4: Traceroute with $IFS bypass ---
@app.route('/traceroute', methods=['GET', 'POST'])
def traceroute():
    host = ''
    output = ''
    error = ''
    if request.method == 'POST':
        host = request.form.get('host', '')
        # Block ; and | but not $IFS
        blocked = [';', '|']
        for ch in blocked:
            if ch in host:
                error = f"Blocked character detected: {ch}"
                log_command('/traceroute', host, 'BLOCKED', error)
                return render_template('traceroute.html', host=host, output='', error=error, challenge=4)
        cmd = f"traceroute {host}"
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            output = result.stdout + result.stderr
        except subprocess.TimeoutExpired:
            output = "Command timed out."
        except Exception as e:
            output = str(e)
        log_command('/traceroute', host, cmd, output)
    return render_template('traceroute.html', host=host, output=output, error=error, challenge=4)


# --- Challenge 5: Whois with space blocking (bypass with brace expansion / $IFS) ---
@app.route('/whois')
def whois():
    domain = request.args.get('domain', '')
    output = ''
    error = ''
    if domain:
        # Block spaces
        if re.search(r'\s', domain):
            error = "Spaces are not allowed in domain names."
            log_command('/whois', domain, 'BLOCKED', error)
            return render_template('whois.html', domain=domain, output='', error=error, challenge=5)
        cmd = f"whois {domain}"
        try:
            output = os.popen(cmd).read()
        except Exception as e:
            output = str(e)
        log_command('/whois', domain, cmd, output)
    return render_template('whois.html', domain=domain, output=output, error=error, challenge=5)


# --- Command log viewer ---
@app.route('/logs')
def logs():
    db = get_db()
    rows = db.execute('SELECT * FROM command_log ORDER BY id DESC LIMIT 50').fetchall()
    return render_template('logs.html', logs=rows)


# -------------------------------------------------------
if __name__ == '__main__':
    init_flags()
    init_db()
    app.run(host='0.0.0.0', port=5011, debug=False)
