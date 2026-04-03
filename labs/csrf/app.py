#!/usr/bin/env python3
"""NeonBank CSRF Lab - Educational CSRF Vulnerability Platform (Port 5006)"""

import os
import re
import json
import sqlite3
import secrets
from datetime import datetime
from html.parser import HTMLParser
from urllib.parse import urlencode, urlparse, parse_qs

from flask import (
    Flask, request, session, render_template, redirect, url_for,
    flash, jsonify, make_response, g
)

app = Flask(__name__)
app.secret_key = 'neonbank-csrf-lab-secret-key-2026'
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'csrf_lab.db')

# Store leaked tokens globally (simulates attacker server)
leaked_tokens = []

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

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
    db.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        balance REAL DEFAULT 0,
        email TEXT DEFAULT ''
    )''')
    db.execute('''CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user TEXT NOT NULL,
        to_user TEXT NOT NULL,
        amount REAL NOT NULL,
        timestamp TEXT NOT NULL
    )''')
    db.execute('''CREATE TABLE IF NOT EXISTS flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL
    )''')

    # Seed users
    existing = db.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    if existing == 0:
        db.execute("INSERT INTO users (username, password, balance, email) VALUES (?, ?, ?, ?)",
                   ('admin', 'admin_neon_pass', 10000, 'admin@neonbank.net'))
        db.execute("INSERT INTO users (username, password, balance, email) VALUES (?, ?, ?, ?)",
                   ('hacker', 'hack3r_pass', 100, 'hacker@darknet.io'))
        db.execute("INSERT INTO users (username, password, balance, email) VALUES (?, ?, ?, ?)",
                   ('guest', 'guest_pass', 500, 'guest@neonbank.net'))

    # Seed flags
    flags = [
        ('csrf_basic', 'FLAG{csrf_b4s1c_f0rg3ry}'),
        ('csrf_json', 'FLAG{csrf_js0n_byp4ss}'),
        ('csrf_referer', 'FLAG{csrf_r3f3r3r_3v4d3}'),
        ('csrf_token_leak', 'FLAG{csrf_t0k3n_l34k}'),
        ('csrf_cors', 'FLAG{csrf_c0rs_m1sc0nf1g}'),
    ]
    for name, value in flags:
        existing_flag = db.execute('SELECT id FROM flags WHERE name = ?', (name,)).fetchone()
        if not existing_flag:
            db.execute("INSERT INTO flags (name, value) VALUES (?, ?)", (name, value))

    db.commit()
    db.close()


def reset_db():
    """Reset database to initial state."""
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    init_db()


# ---------------------------------------------------------------------------
# Auto-login as hacker
# ---------------------------------------------------------------------------

@app.before_request
def auto_login():
    if 'user_id' not in session:
        session['user_id'] = 2  # hacker
        session['username'] = 'hacker'


# ---------------------------------------------------------------------------
# HTML Form Parser for Bot simulation
# ---------------------------------------------------------------------------

class FormParser(HTMLParser):
    """Parse HTML to extract form actions and inputs."""

    def __init__(self):
        super().__init__()
        self.forms = []
        self._current_form = None

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == 'form':
            self._current_form = {
                'action': attrs_dict.get('action', ''),
                'method': attrs_dict.get('method', 'GET').upper(),
                'enctype': attrs_dict.get('enctype', 'application/x-www-form-urlencoded'),
                'inputs': {}
            }
        elif tag == 'input' and self._current_form is not None:
            name = attrs_dict.get('name', '')
            value = attrs_dict.get('value', '')
            if name:
                self._current_form['inputs'][name] = value
        elif tag == 'textarea' and self._current_form is not None:
            self._textarea_name = attrs_dict.get('name', '')
            self._textarea_value = ''

    def handle_data(self, data):
        if hasattr(self, '_textarea_name') and self._textarea_name and self._current_form:
            self._textarea_value = data.strip()

    def handle_endtag(self, tag):
        if tag == 'textarea' and hasattr(self, '_textarea_name') and self._textarea_name and self._current_form:
            self._current_form['inputs'][self._textarea_name] = self._textarea_value
            self._textarea_name = ''
        if tag == 'form' and self._current_form is not None:
            self.forms.append(self._current_form)
            self._current_form = None


def simulate_bot_request(html_content, admin_user_id=1, referer=None):
    """Simulate the admin bot visiting a page and submitting any forms found."""
    parser = FormParser()
    parser.feed(html_content)

    results = []
    for form in parser.forms:
        action = form['action']
        method = form['method']
        enctype = form['enctype']
        data = form['inputs']

        # Resolve relative URLs
        if not action.startswith('http'):
            action = f'http://localhost:5006{action}'

        parsed = urlparse(action)
        path = parsed.path
        query = parse_qs(parsed.query)
        # Flatten query params
        flat_query = {k: v[0] for k, v in query.items()}

        # Execute the request internally with admin session
        with app.test_request_context(
            path,
            method=method,
            data=data if enctype == 'application/x-www-form-urlencoded' else None,
            content_type=enctype if enctype != 'application/x-www-form-urlencoded' else None,
            query_string=flat_query,
            headers={'Referer': referer or 'http://evil.attacker.com/exploit.html'}
        ):
            # Handle text/plain enctype: body is the raw form data
            if enctype == 'text/plain':
                body_parts = []
                for k, v in data.items():
                    body_parts.append(f'{k}={v}')
                raw_body = '\r\n'.join(body_parts)
                with app.test_request_context(
                    path,
                    method=method,
                    data=raw_body,
                    content_type='text/plain',
                    query_string=flat_query,
                    headers={'Referer': referer or 'http://evil.attacker.com/exploit.html'}
                ):
                    session['user_id'] = admin_user_id
                    session['username'] = 'admin'
                    try:
                        from flask import current_app
                        with current_app.test_client() as client:
                            with client.session_transaction() as sess:
                                sess['user_id'] = admin_user_id
                                sess['username'] = 'admin'
                            resp = client.post(
                                f'{path}?{urlencode(flat_query)}' if flat_query else path,
                                data=raw_body,
                                content_type='text/plain',
                                headers={'Referer': referer or 'http://evil.attacker.com/exploit.html'}
                            )
                            results.append({
                                'action': action,
                                'status': resp.status_code,
                                'response': resp.get_data(as_text=True)[:500]
                            })
                    except Exception as e:
                        results.append({'action': action, 'error': str(e)})
                continue

            # Standard form submission
            try:
                with app.test_client() as client:
                    with client.session_transaction() as sess:
                        sess['user_id'] = admin_user_id
                        sess['username'] = 'admin'
                    if method == 'POST':
                        resp = client.post(
                            f'{path}?{urlencode(flat_query)}' if flat_query else path,
                            data=data,
                            content_type='application/x-www-form-urlencoded',
                            headers={'Referer': referer or 'http://evil.attacker.com/exploit.html'}
                        )
                    else:
                        resp = client.get(
                            f'{path}?{urlencode(data)}',
                            headers={'Referer': referer or 'http://evil.attacker.com/exploit.html'}
                        )
                    results.append({
                        'action': action,
                        'status': resp.status_code,
                        'response': resp.get_data(as_text=True)[:500]
                    })
            except Exception as e:
                results.append({'action': action, 'error': str(e)})

    return results


# ---------------------------------------------------------------------------
# Routes - Homepage
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    db = get_db()
    hacker = db.execute('SELECT balance FROM users WHERE username = ?', ('hacker',)).fetchone()
    return render_template('index.html', hacker_balance=hacker['balance'])


@app.route('/reset')
def reset():
    reset_db()
    leaked_tokens.clear()
    flash('Database reset to initial state.', 'success')
    return redirect('/')


# ---------------------------------------------------------------------------
# Challenge router
# ---------------------------------------------------------------------------

@app.route('/challenge/<int:num>')
def challenge(num):
    db = get_db()
    if num == 1:
        hacker = db.execute('SELECT balance FROM users WHERE username = ?', ('hacker',)).fetchone()
        transfers = db.execute('SELECT * FROM transfers ORDER BY id DESC LIMIT 10').fetchall()
        return render_template('transfer.html', balance=hacker['balance'], transfers=transfers)
    elif num == 2:
        user = db.execute('SELECT email FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        admin = db.execute('SELECT email FROM users WHERE username = ?', ('admin',)).fetchone()
        return render_template('settings.html', email=user['email'], admin_email=admin['email'])
    elif num == 3:
        hacker = db.execute('SELECT balance FROM users WHERE username = ?', ('hacker',)).fetchone()
        admin = db.execute('SELECT balance FROM users WHERE username = ?', ('admin',)).fetchone()
        transfers = db.execute('SELECT * FROM transfers ORDER BY id DESC LIMIT 10').fetchall()
        return render_template('referer.html', balance=hacker['balance'],
                               admin_balance=admin['balance'], transfers=transfers)
    elif num == 4:
        user = db.execute('SELECT email FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        admin = db.execute('SELECT email FROM users WHERE username = ?', ('admin',)).fetchone()
        csrf_token = secrets.token_hex(16)
        session['csrf_token'] = csrf_token
        # Also generate admin's token and store it
        admin_token = secrets.token_hex(16)
        session['admin_csrf_token'] = admin_token
        return render_template('token_leak.html', email=user['email'],
                               admin_email=admin['email'], csrf_token=csrf_token)
    elif num == 5:
        hacker = db.execute('SELECT balance FROM users WHERE username = ?', ('hacker',)).fetchone()
        admin = db.execute('SELECT balance FROM users WHERE username = ?', ('admin',)).fetchone()
        transfers = db.execute('SELECT * FROM transfers ORDER BY id DESC LIMIT 10').fetchall()
        return render_template('cors.html', balance=hacker['balance'],
                               admin_balance=admin['balance'], transfers=transfers)
    return redirect('/')


# ---------------------------------------------------------------------------
# Challenge 1: Basic CSRF - No Token
# ---------------------------------------------------------------------------

@app.route('/transfer', methods=['POST'])
def transfer():
    db = get_db()
    user_id = session.get('user_id', 2)
    from_user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    if not from_user:
        flash('User not found.', 'error')
        return redirect('/challenge/1')

    to_username = request.form.get('to_user', '')
    amount = float(request.form.get('amount', 0))

    to_user = db.execute('SELECT * FROM users WHERE username = ?', (to_username,)).fetchone()
    if not to_user:
        flash(f'Recipient "{to_username}" not found.', 'error')
        return redirect('/challenge/1')

    if amount <= 0:
        flash('Invalid amount.', 'error')
        return redirect('/challenge/1')

    if from_user['balance'] < amount:
        flash('Insufficient funds.', 'error')
        return redirect('/challenge/1')

    # Execute transfer - NO CSRF PROTECTION
    db.execute('UPDATE users SET balance = balance - ? WHERE id = ?', (amount, from_user['id']))
    db.execute('UPDATE users SET balance = balance + ? WHERE id = ?', (amount, to_user['id']))
    db.execute('INSERT INTO transfers (from_user, to_user, amount, timestamp) VALUES (?, ?, ?, ?)',
               (from_user['username'], to_username, amount, datetime.now().isoformat()))
    db.commit()

    flash(f'Transferred {amount} credits to {to_username}.', 'success')
    return redirect('/challenge/1')


@app.route('/bot', methods=['POST'])
def bot1():
    html_content = request.form.get('html', '') or ''
    if not html_content:
        # Try JSON body
        try:
            data = request.get_json(force=True)
            html_content = data.get('html', '')
        except Exception:
            pass

    if not html_content:
        flash('No HTML content provided.', 'error')
        return redirect('/challenge/1')

    results = simulate_bot_request(html_content)

    db = get_db()
    admin = db.execute('SELECT balance FROM users WHERE username = ?', ('admin',)).fetchone()
    flag = None
    if admin['balance'] < 10000:
        flag_row = db.execute('SELECT value FROM flags WHERE name = ?', ('csrf_basic',)).fetchone()
        flag = flag_row['value']

    bot_result = f'Bot visited page and found {len(results)} form(s). '
    for r in results:
        bot_result += f"Submitted to {r.get('action', '?')} -> Status {r.get('status', '?')}. "

    if flag:
        bot_result += f' Admin balance changed! '

    hacker = db.execute('SELECT balance FROM users WHERE username = ?', ('hacker',)).fetchone()
    transfers = db.execute('SELECT * FROM transfers ORDER BY id DESC LIMIT 10').fetchall()
    return render_template('transfer.html', balance=hacker['balance'], transfers=transfers,
                           flag=flag, bot_result=bot_result)


# ---------------------------------------------------------------------------
# Challenge 2: JSON API CSRF
# ---------------------------------------------------------------------------

@app.route('/api/settings', methods=['POST'])
def api_settings():
    user_id = session.get('user_id', 2)

    # Accept both JSON and text/plain content types - INTENTIONAL VULNERABILITY
    content_type = request.content_type or ''
    if 'json' in content_type:
        data = request.get_json(force=True)
    elif 'text/plain' in content_type:
        try:
            data = json.loads(request.get_data(as_text=True))
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid JSON'}), 400
    else:
        try:
            data = request.get_json(force=True)
        except Exception:
            return jsonify({'error': 'Invalid request'}), 400

    new_email = data.get('email', '')
    if not new_email:
        return jsonify({'error': 'Email is required'}), 400

    db = get_db()
    db.execute('UPDATE users SET email = ? WHERE id = ?', (new_email, user_id))
    db.commit()

    return jsonify({'message': f'Email updated to {new_email}'})


@app.route('/bot2', methods=['POST'])
def bot2():
    html_content = request.form.get('html', '') or ''
    if not html_content:
        try:
            data = request.get_json(force=True)
            html_content = data.get('html', '')
        except Exception:
            pass

    if not html_content:
        flash('No HTML content provided.', 'error')
        return redirect('/challenge/2')

    results = simulate_bot_request(html_content)

    db = get_db()
    admin = db.execute('SELECT email FROM users WHERE username = ?', ('admin',)).fetchone()
    flag = None
    if admin['email'] != 'admin@neonbank.net':
        flag_row = db.execute('SELECT value FROM flags WHERE name = ?', ('csrf_json',)).fetchone()
        flag = flag_row['value']

    bot_result = f'Bot visited page and found {len(results)} form(s). '
    for r in results:
        bot_result += f"Submitted to {r.get('action', '?')} -> Status {r.get('status', '?')}. "

    if flag:
        bot_result += f" Admin email changed to: {admin['email']}! "

    user = db.execute('SELECT email FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    return render_template('settings.html', email=user['email'], admin_email=admin['email'],
                           flag=flag, bot_result=bot_result)


# ---------------------------------------------------------------------------
# Challenge 3: Referer Check Bypass
# ---------------------------------------------------------------------------

@app.route('/transfer-protected', methods=['POST'])
def transfer_protected():
    db = get_db()
    user_id = session.get('user_id', 2)

    # Flawed Referer check - INTENTIONAL VULNERABILITY (substring match)
    referer = request.headers.get('Referer', '')
    if 'localhost:5006' not in referer:
        flash('Invalid request origin. Referer check failed.', 'error')
        return redirect('/challenge/3')

    from_user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    if not from_user:
        flash('User not found.', 'error')
        return redirect('/challenge/3')

    to_username = request.form.get('to_user', '')
    amount = float(request.form.get('amount', 0))

    to_user = db.execute('SELECT * FROM users WHERE username = ?', (to_username,)).fetchone()
    if not to_user:
        flash(f'Recipient "{to_username}" not found.', 'error')
        return redirect('/challenge/3')

    if amount <= 0:
        flash('Invalid amount.', 'error')
        return redirect('/challenge/3')

    if from_user['balance'] < amount:
        flash('Insufficient funds.', 'error')
        return redirect('/challenge/3')

    db.execute('UPDATE users SET balance = balance - ? WHERE id = ?', (amount, from_user['id']))
    db.execute('UPDATE users SET balance = balance + ? WHERE id = ?', (amount, to_user['id']))
    db.execute('INSERT INTO transfers (from_user, to_user, amount, timestamp) VALUES (?, ?, ?, ?)',
               (from_user['username'], to_username, amount, datetime.now().isoformat()))
    db.commit()

    flash(f'Transferred {amount} credits to {to_username}.', 'success')
    return redirect('/challenge/3')


@app.route('/bot3', methods=['POST'])
def bot3():
    html_content = request.form.get('html', '') or ''
    spoofed_referer = request.form.get('referer', '') or ''

    if not html_content:
        try:
            data = request.get_json(force=True)
            html_content = data.get('html', '')
            spoofed_referer = data.get('referer', '')
        except Exception:
            pass

    if not html_content:
        flash('No HTML content provided.', 'error')
        return redirect('/challenge/3')

    # Use the spoofed referer if provided
    referer = spoofed_referer if spoofed_referer else 'http://evil.attacker.com/exploit.html'
    results = simulate_bot_request(html_content, referer=referer)

    db = get_db()
    admin = db.execute('SELECT balance FROM users WHERE username = ?', ('admin',)).fetchone()
    flag = None
    if admin['balance'] < 10000:
        flag_row = db.execute('SELECT value FROM flags WHERE name = ?', ('csrf_referer',)).fetchone()
        flag = flag_row['value']

    bot_result = f'Bot visited page with Referer: {referer}. Found {len(results)} form(s). '
    for r in results:
        bot_result += f"Submitted to {r.get('action', '?')} -> Status {r.get('status', '?')}. "

    if flag:
        bot_result += f' Admin balance changed! '

    hacker = db.execute('SELECT balance FROM users WHERE username = ?', ('hacker',)).fetchone()
    transfers = db.execute('SELECT * FROM transfers ORDER BY id DESC LIMIT 10').fetchall()
    return render_template('referer.html', balance=hacker['balance'],
                           admin_balance=admin['balance'], transfers=transfers,
                           flag=flag, bot_result=bot_result)


# ---------------------------------------------------------------------------
# Challenge 4: CSRF Token Leak via Referer
# ---------------------------------------------------------------------------

@app.route('/change-email', methods=['POST'])
def change_email():
    db = get_db()
    user_id = session.get('user_id', 2)

    # Token is in URL query parameter - INTENTIONAL VULNERABILITY
    csrf_token = request.args.get('csrf_token', '')
    expected_token = session.get('csrf_token', '')

    if not csrf_token or csrf_token != expected_token:
        flash('Invalid CSRF token.', 'error')
        return redirect('/challenge/4')

    new_email = request.form.get('new_email', '')
    if not new_email:
        flash('Email is required.', 'error')
        return redirect('/challenge/4')

    db.execute('UPDATE users SET email = ? WHERE id = ?', (new_email, user_id))
    db.commit()

    flash(f'Email changed to {new_email}.', 'success')
    return redirect('/challenge/4')


@app.route('/page-with-image')
def page_with_image():
    return render_template('page_with_image.html')


@app.route('/token-leak')
def token_leak():
    """Simulates attacker server that captures leaked Referer headers."""
    capture = request.args.get('capture', '')

    if capture:
        # This is the image request - capture the Referer
        referer = request.headers.get('Referer', '')
        if referer and 'csrf_token' in referer:
            parsed = urlparse(referer)
            query = parse_qs(parsed.query)
            token = query.get('csrf_token', [''])[0]
            if token:
                leaked_tokens.append({
                    'token': token,
                    'referer': referer,
                    'timestamp': datetime.now().isoformat()
                })
        # Return a 1x1 pixel PNG
        pixel = (b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
                 b'\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00'
                 b'\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00'
                 b'\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82')
        resp = make_response(pixel)
        resp.headers['Content-Type'] = 'image/png'
        return resp

    # Display leaked tokens
    return jsonify({
        'leaked_tokens': leaked_tokens,
        'count': len(leaked_tokens)
    })


@app.route('/bot4', methods=['POST'])
def bot4():
    new_email = request.form.get('new_email', 'hacked@evil.com')

    # Step 1: Generate admin's CSRF token and simulate visiting /page-with-image
    admin_csrf_token = secrets.token_hex(16)

    # Step 2: Simulate the token being leaked via image load (Referer)
    leaked_tokens.append({
        'token': admin_csrf_token,
        'referer': f'http://localhost:5006/page-with-image?csrf_token={admin_csrf_token}',
        'timestamp': datetime.now().isoformat()
    })

    # Step 3: Use the leaked token to change admin's email
    with app.test_client() as client:
        with client.session_transaction() as sess:
            sess['user_id'] = 1
            sess['username'] = 'admin'
            sess['csrf_token'] = admin_csrf_token

        resp = client.post(
            f'/change-email?csrf_token={admin_csrf_token}',
            data={'new_email': new_email},
            content_type='application/x-www-form-urlencoded'
        )

    db = get_db()
    admin = db.execute('SELECT email FROM users WHERE username = ?', ('admin',)).fetchone()
    flag = None
    if admin['email'] != 'admin@neonbank.net':
        flag_row = db.execute('SELECT value FROM flags WHERE name = ?', ('csrf_token_leak',)).fetchone()
        flag = flag_row['value']

    bot_result = f'Bot visited /page-with-image, leaking CSRF token via Referer. '
    bot_result += f'Leaked token: {admin_csrf_token}. '
    bot_result += f'Used leaked token to change admin email to: {new_email}. '
    if flag:
        bot_result += 'Admin email successfully changed! '

    user = db.execute('SELECT email FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    csrf_token = session.get('csrf_token', secrets.token_hex(16))
    return render_template('token_leak.html', email=user['email'], admin_email=admin['email'],
                           csrf_token=csrf_token, flag=flag, bot_result=bot_result)


# ---------------------------------------------------------------------------
# Challenge 5: CORS Misconfiguration
# ---------------------------------------------------------------------------

@app.route('/api/transfer', methods=['POST', 'OPTIONS'])
def api_transfer():
    # Misconfigured CORS - INTENTIONAL VULNERABILITY
    if request.method == 'OPTIONS':
        resp = make_response()
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        resp.headers['Access-Control-Allow-Credentials'] = 'true'
        return resp

    user_id = session.get('user_id', 2)

    # Accept both JSON and text/plain - no CSRF protection
    content_type = request.content_type or ''
    if 'json' in content_type:
        data = request.get_json(force=True)
    elif 'text/plain' in content_type:
        try:
            raw = request.get_data(as_text=True)
            data = json.loads(raw)
        except json.JSONDecodeError:
            # Try to parse form-style text/plain (key=value)
            # Handle the case where form enctype=text/plain sends "key=value"
            try:
                # text/plain forms send data like: {"to_user":"hacker","amount":1000}=
                # or name=value pairs
                raw = raw.strip()
                if raw.endswith('='):
                    raw = raw[:-1]
                data = json.loads(raw)
            except json.JSONDecodeError:
                return jsonify({'error': 'Invalid data format'}), 400
    else:
        try:
            data = request.get_json(force=True)
        except Exception:
            return jsonify({'error': 'Invalid request'}), 400

    db = get_db()
    from_user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    if not from_user:
        return jsonify({'error': 'User not found'}), 404

    to_username = data.get('to_user', '')
    amount = float(data.get('amount', 0))

    to_user = db.execute('SELECT * FROM users WHERE username = ?', (to_username,)).fetchone()
    if not to_user:
        return jsonify({'error': f'Recipient "{to_username}" not found'}), 404

    if amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400

    if from_user['balance'] < amount:
        return jsonify({'error': 'Insufficient funds'}), 400

    db.execute('UPDATE users SET balance = balance - ? WHERE id = ?', (amount, from_user['id']))
    db.execute('UPDATE users SET balance = balance + ? WHERE id = ?', (amount, to_user['id']))
    db.execute('INSERT INTO transfers (from_user, to_user, amount, timestamp) VALUES (?, ?, ?, ?)',
               (from_user['username'], to_username, amount, datetime.now().isoformat()))
    db.commit()

    resp = jsonify({'message': f'Transferred {amount} credits to {to_username}'})
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Credentials'] = 'true'
    return resp


@app.route('/bot5', methods=['POST'])
def bot5():
    html_content = request.form.get('html', '') or ''
    if not html_content:
        try:
            data = request.get_json(force=True)
            html_content = data.get('html', '')
        except Exception:
            pass

    if not html_content:
        flash('No HTML content provided.', 'error')
        return redirect('/challenge/5')

    results = simulate_bot_request(html_content)

    db = get_db()
    admin = db.execute('SELECT balance FROM users WHERE username = ?', ('admin',)).fetchone()
    flag = None
    if admin['balance'] < 10000:
        flag_row = db.execute('SELECT value FROM flags WHERE name = ?', ('csrf_cors',)).fetchone()
        flag = flag_row['value']

    bot_result = f'Bot visited page and found {len(results)} form(s). '
    for r in results:
        bot_result += f"Submitted to {r.get('action', '?')} -> Status {r.get('status', '?')}. "

    if flag:
        bot_result += f' Admin balance changed! '

    hacker = db.execute('SELECT balance FROM users WHERE username = ?', ('hacker',)).fetchone()
    transfers = db.execute('SELECT * FROM transfers ORDER BY id DESC LIMIT 10').fetchall()
    return render_template('cors.html', balance=hacker['balance'],
                           admin_balance=admin['balance'], transfers=transfers,
                           flag=flag, bot_result=bot_result)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5006, debug=False)
