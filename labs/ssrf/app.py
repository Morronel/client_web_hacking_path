"""
NeonFetch — SSRF Vulnerability Lab
Port 5008 | Educational use only
"""

import os
import re
import socket
import sqlite3
import struct
import urllib.request
import urllib.error
from datetime import datetime
from flask import Flask, request, render_template, redirect, jsonify, g

app = Flask(__name__)
DATABASE = os.path.join(os.path.dirname(__file__), 'fetch_log.db')
FLAG_FILE = '/app/flag.txt'

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

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
    conn = sqlite3.connect(DATABASE)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS fetch_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            status_code INTEGER,
            response_length INTEGER,
            timestamp TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Startup: write flag file for challenge 4
# ---------------------------------------------------------------------------

def write_flag_file():
    flag_dir = os.path.dirname(FLAG_FILE)
    os.makedirs(flag_dir, exist_ok=True)
    with open(FLAG_FILE, 'w') as f:
        f.write('FLAG{ssrf_pr0t0c0l_smuggl3}')


# ---------------------------------------------------------------------------
# Internal routes (localhost only)
# ---------------------------------------------------------------------------

def _is_localhost(addr):
    return addr in ('127.0.0.1', '::1', '::ffff:127.0.0.1')


@app.route('/internal/metadata')
def internal_metadata():
    if not _is_localhost(request.remote_addr):
        return 'Forbidden — internal access only', 403
    return jsonify({
        'cloud': 'NeonCloud',
        'instance-id': 'i-0x7f00deadbeef',
        'region': 'neon-east-1',
        'credentials': {
            'access_key': 'AKIA_NEON_FAKE_KEY',
            'secret_key': 'sUp3rS3cr3tK3y_NEON',
        },
        'flag': 'FLAG{ssrf_m3t4d4ta_l34k}',
    })


@app.route('/internal/admin-api')
def internal_admin_api():
    if not _is_localhost(request.remote_addr):
        return 'Forbidden — internal access only', 403
    return jsonify({
        'admin_user': 'neo_root',
        'admin_password': 'Neon$up3rAdm1n!',
        'flag': 'FLAG{ssrf_bl1nd_00b}',
    })


@app.route('/internal/flag')
def internal_flag():
    if not _is_localhost(request.remote_addr):
        return 'Forbidden — internal access only', 403
    return 'FLAG{ssrf_f1lt3r_byp4ss}'


@app.route('/internal/dns-secret')
def internal_dns_secret():
    if not _is_localhost(request.remote_addr):
        return 'Forbidden — internal access only', 403
    return 'FLAG{ssrf_dns_r3b1nd}'


@app.route('/internal/db-backup')
def internal_db_backup():
    if not _is_localhost(request.remote_addr):
        return 'Forbidden — internal access only', 403
    return jsonify({
        'tables': ['users', 'sessions', 'transactions'],
        'dump': [
            {'user': 'admin', 'hash': '$2b$12$fakehashadmin'},
            {'user': 'operator', 'hash': '$2b$12$fakehashoper'},
        ],
        'flag': 'FLAG{ssrf_r3d1r3ct_byp4ss}',
    })


# ---------------------------------------------------------------------------
# Helper: redirect-to endpoint (used by challenge 5)
# ---------------------------------------------------------------------------

@app.route('/redirect-to')
def redirect_to():
    target = request.args.get('url', '/')
    return redirect(target)


# ---------------------------------------------------------------------------
# Challenge 1 — Basic SSRF (no filtering)
# ---------------------------------------------------------------------------

@app.route('/fetch')
def fetch_url():
    url = request.args.get('url', '')
    result = None
    error = None
    if url:
        try:
            resp = urllib.request.urlopen(url, timeout=5)
            result = resp.read().decode('utf-8', errors='replace')
        except Exception as e:
            error = str(e)
    return render_template('fetch.html', url=url, result=result, error=error,
                           title='Ch1: Basic Fetch', endpoint='/fetch',
                           description='Fetch any URL. No restrictions.')


# ---------------------------------------------------------------------------
# Challenge 2 — Blind SSRF (webhook)
# ---------------------------------------------------------------------------

@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    message = None
    if request.method == 'POST':
        url = request.form.get('url', '')
        if url:
            status_code = 0
            response_length = 0
            try:
                resp = urllib.request.urlopen(url, timeout=5)
                body = resp.read()
                status_code = resp.getcode()
                response_length = len(body)
            except urllib.error.HTTPError as e:
                status_code = e.code
                response_length = 0
            except Exception:
                status_code = 0
                response_length = 0
            db = get_db()
            db.execute(
                'INSERT INTO fetch_log (url, status_code, response_length, timestamp) VALUES (?, ?, ?, ?)',
                (url, status_code, response_length, datetime.utcnow().isoformat())
            )
            db.commit()
            message = f'Webhook registered. URL fetched (status {status_code}).'
    return render_template('webhook.html', message=message)


@app.route('/check-log')
def check_log():
    db = get_db()
    rows = db.execute('SELECT * FROM fetch_log ORDER BY id DESC LIMIT 50').fetchall()
    return render_template('log.html', rows=rows)


# ---------------------------------------------------------------------------
# Challenge 3 — Filtered SSRF (bypass with alternative IP representations)
# ---------------------------------------------------------------------------

@app.route('/fetch-safe')
def fetch_safe():
    url = request.args.get('url', '')
    result = None
    error = None
    if url:
        lower = url.lower()
        if '127.0.0.1' in lower or 'localhost' in lower:
            error = 'Blocked: localhost addresses are not allowed.'
        else:
            try:
                resp = urllib.request.urlopen(url, timeout=5)
                result = resp.read().decode('utf-8', errors='replace')
            except Exception as e:
                error = str(e)
    return render_template('fetch.html', url=url, result=result, error=error,
                           title='Ch3: Filtered Fetch',
                           endpoint='/fetch-safe',
                           description='Fetches a URL but blocks 127.0.0.1 and localhost.')


# ---------------------------------------------------------------------------
# Challenge 4 — Protocol smuggling (file://)
# ---------------------------------------------------------------------------

@app.route('/proxy')
def proxy():
    url = request.args.get('url', '')
    result = None
    error = None
    if url:
        if not url[:4].lower().startswith('http'):
            # Only allow http(s) ... or so we think
            pass  # intentionally weak: only checks first 4 chars
        try:
            resp = urllib.request.urlopen(url, timeout=5)
            result = resp.read().decode('utf-8', errors='replace')
        except Exception as e:
            error = str(e)
    return render_template('fetch.html', url=url, result=result, error=error,
                           title='Ch4: Proxy',
                           endpoint='/proxy',
                           description='Proxy fetcher. Only HTTP/HTTPS allowed (we think).')


# ---------------------------------------------------------------------------
# Challenge 5 — Redirect-based SSRF bypass
# ---------------------------------------------------------------------------

@app.route('/fetch-redirect', methods=['GET', 'POST'])
def fetch_redirect():
    url = ''
    result = None
    error = None
    if request.method == 'POST':
        url = request.form.get('url', '')
        if url:
            lower = url.lower()
            if '127.0.0.1' in lower or 'localhost' in lower or '[::1]' in lower or '0.0.0.0' in lower:
                error = 'Blocked: localhost addresses are not allowed in target URL.'
            else:
                try:
                    resp = urllib.request.urlopen(url, timeout=5)
                    result = resp.read().decode('utf-8', errors='replace')
                except Exception as e:
                    error = str(e)
    return render_template('fetch.html', url=url, result=result, error=error,
                           title='Ch5: Redirect Fetch',
                           endpoint='/fetch-redirect',
                           description='Fetches a URL but blocks localhost. Follows redirects.',
                           method='POST')


# ---------------------------------------------------------------------------
# Challenge 6 — DNS rebinding / TOCTOU
# ---------------------------------------------------------------------------

@app.route('/fetch-dns')
def fetch_dns():
    url = request.args.get('url', '')
    result = None
    error = None
    if url:
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            hostname = parsed.hostname
            if hostname:
                resolved = socket.gethostbyname(hostname)
                octets = resolved.split('.')
                if octets[0] == '127':
                    error = f'Blocked: {hostname} resolves to {resolved} (loopback).'
                else:
                    # TOCTOU: DNS could return a different address on second lookup
                    resp = urllib.request.urlopen(url, timeout=5)
                    result = resp.read().decode('utf-8', errors='replace')
            else:
                error = 'Could not parse hostname from URL.'
        except socket.gaierror as e:
            error = f'DNS resolution failed: {e}'
        except Exception as e:
            error = str(e)
    return render_template('fetch.html', url=url, result=result, error=error,
                           title='Ch6: DNS-Checked Fetch',
                           endpoint='/fetch-dns',
                           description='Resolves hostname first and blocks 127.0.0.0/8. But timing is everything...')


# ---------------------------------------------------------------------------
# Homepage & Hints
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/hints')
def hints():
    return render_template('hints.html')


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    init_db()
    write_flag_file()
    app.run(host='0.0.0.0', port=5008, debug=False)
