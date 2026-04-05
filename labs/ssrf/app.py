"""
NeonFetch — SSRF Vulnerability Lab
Port 5008 | Educational use only
"""

import os
import urllib.request
import urllib.error
from flask import Flask, request, render_template, jsonify

app = Flask(__name__)


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


@app.route('/internal/flag')
def internal_flag():
    """Ch2 target — only responds when X-Internal-Source: fetch-safe is set."""
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
# Challenge 2 — Filtered SSRF (bypass with alternative IP representations)
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
                           title='Ch2: Filtered Fetch',
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
    app.run(host='0.0.0.0', port=5008, debug=False)
