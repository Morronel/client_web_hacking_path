#!/usr/bin/env python3
"""NeonBank CSRF Lab - Educational CSRF Vulnerability Platform (Port 5006)"""

import os
import sqlite3
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

    # Seed flag
    existing_flag = db.execute('SELECT id FROM flags WHERE name = ?', ('csrf_basic',)).fetchone()
    if not existing_flag:
        db.execute("INSERT INTO flags (name, value) VALUES (?, ?)",
                   ('csrf_basic', 'FLAG{csrf_b4s1c_f0rg3ry}'))

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


def simulate_bot_request(html_content, admin_user_id=1):
    """Simulate the admin bot visiting a page and submitting any forms found."""
    parser = FormParser()
    parser.feed(html_content)

    results = []
    for form in parser.forms:
        action = form['action']
        method = form['method']
        data = form['inputs']

        # Resolve relative URLs
        if not action.startswith('http'):
            action = f'http://localhost:5006{action}'

        parsed = urlparse(action)
        path = parsed.path
        query = parse_qs(parsed.query)
        flat_query = {k: v[0] for k, v in query.items()}

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
                        headers={'Referer': 'http://evil.attacker.com/exploit.html'}
                    )
                else:
                    resp = client.get(
                        f'{path}?{urlencode(data)}',
                        headers={'Referer': 'http://evil.attacker.com/exploit.html'}
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
# Routes
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    db = get_db()
    hacker = db.execute('SELECT balance FROM users WHERE username = ?', ('hacker',)).fetchone()
    return render_template('index.html', hacker_balance=hacker['balance'])


@app.route('/reset')
def reset():
    reset_db()
    flash('Database reset to initial state.', 'success')
    return redirect('/')


# ---------------------------------------------------------------------------
# Challenge 1: Basic CSRF - No Token
# ---------------------------------------------------------------------------

@app.route('/challenge/1')
def challenge():
    db = get_db()
    hacker = db.execute('SELECT balance FROM users WHERE username = ?', ('hacker',)).fetchone()
    transfers = db.execute('SELECT * FROM transfers ORDER BY id DESC LIMIT 10').fetchall()
    return render_template('transfer.html', balance=hacker['balance'], transfers=transfers)


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
def bot():
    html_content = request.form.get('html', '') or ''
    if not html_content:
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
# Main
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5006, debug=False)
