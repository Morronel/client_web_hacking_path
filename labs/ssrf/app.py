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
# Internal routes (localhost only) — each gated by source header
# ---------------------------------------------------------------------------

def _is_localhost(addr):
    return addr in ('127.0.0.1', '::1', '::ffff:127.0.0.1')


@app.route('/internal/metadata')
def internal_metadata():
    """Ch1 target — always accessible from localhost."""
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
    """Ch2 target — only responds when X-Internal-Source: webhook is set."""
    if not _is_localhost(request.remote_addr):
        return 'Forbidden — internal access only', 403
    if request.headers.get('X-Internal-Source') != 'webhook':
        return 'Forbidden — this endpoint requires webhook access', 403
    return jsonify({
        'admin_user': 'neo_root',
        'admin_password': 'Neon$up3rAdm1n!',
        'flag': 'FLAG{ssrf_bl1nd_00b}',
    })


@app.route('/internal/flag')
def internal_flag():
    """Ch3 target — only responds when X-Internal-Source: fetch-safe is set."""
    if not _is_localhost(request.remote_addr):
        return 'Forbidden — internal access only', 403
    if request.headers.get('X-Internal-Source') != 'fetch-safe':
        return 'Forbidden — this endpoint requires fetch-safe access', 403
    return 'FLAG{ssrf_f1lt3r_byp4ss}'


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
                req = urllib.request.Request(url, headers={
                    'X-Internal-Source': 'webhook',
                })
                resp = urllib.request.urlopen(req, timeout=5)
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
                req = urllib.request.Request(url, headers={
                    'X-Internal-Source': 'fetch-safe',
                })
                resp = urllib.request.urlopen(req, timeout=5)
                result = resp.read().decode('utf-8', errors='replace')
            except Exception as e:
                error = str(e)
    return render_template('fetch.html', url=url, result=result, error=error,
                           title='Ch3: Filtered Fetch',
                           endpoint='/fetch-safe',
                           description='Fetches a URL but blocks 127.0.0.1 and localhost.')


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
    app.run(host='0.0.0.0', port=5008, debug=False)
