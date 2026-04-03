"""
Clickjacking Lab - NeonPanel Admin Control Panel
Port 5007 - Intentionally vulnerable to clickjacking attacks
"""

import os
import sqlite3
from flask import (
    Flask, render_template, request, redirect, url_for,
    flash, g, jsonify, session
)

app = Flask(__name__)
app.secret_key = 'neonpanel-clickjack-lab-secret'

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clickjacking.db')

FLAGS = {
    1: 'FLAG{cl1ckj4ck_b4s1c}',
    2: 'FLAG{cl1ckj4ck_f0rm_h1jack}',
    3: 'FLAG{cl1ckj4ck_mult1_st3p}',
    4: 'FLAG{cl1ckj4ck_bust3r_byp4ss}',
    5: 'FLAG{cl1ckj4ck_d4t4_3xf1l}',
}

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
    db.row_factory = sqlite3.Row
    db.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            credits INTEGER NOT NULL DEFAULT 0,
            deleted INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS actions_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT,
            detail TEXT,
            ts DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS flags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            challenge INTEGER UNIQUE,
            flag TEXT,
            solved INTEGER NOT NULL DEFAULT 0
        );
    ''')
    # Seed users if empty
    existing = db.execute('SELECT COUNT(*) as c FROM users').fetchone()['c']
    if existing == 0:
        db.execute("INSERT INTO users (username, role, credits, deleted) VALUES ('admin', 'admin', 5000, 0)")
        db.execute("INSERT INTO users (username, role, credits, deleted) VALUES ('operator', 'user', 1000, 0)")
        db.execute("INSERT INTO users (username, role, credits, deleted) VALUES ('guest', 'user', 500, 0)")
    # Seed flags
    for ch, flag in FLAGS.items():
        row = db.execute('SELECT id FROM flags WHERE challenge=?', (ch,)).fetchone()
        if not row:
            db.execute('INSERT INTO flags (challenge, flag, solved) VALUES (?,?,0)', (ch, flag))
    db.commit()
    db.close()


def reset_db():
    """Reset database to initial state."""
    db = get_db()
    db.executescript('''
        DELETE FROM users;
        DELETE FROM actions_log;
        DELETE FROM flags;
        DELETE FROM sqlite_sequence;
    ''')
    db.execute("INSERT INTO users (username, role, credits, deleted) VALUES ('admin', 'admin', 5000, 0)")
    db.execute("INSERT INTO users (username, role, credits, deleted) VALUES ('operator', 'user', 1000, 0)")
    db.execute("INSERT INTO users (username, role, credits, deleted) VALUES ('guest', 'user', 500, 0)")
    for ch, flag in FLAGS.items():
        db.execute('INSERT INTO flags (challenge, flag, solved) VALUES (?,?,0)', (ch, flag))
    db.commit()


def current_user():
    """Auto-login as operator (user_id=2)."""
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id=2', ).fetchone()
    return user


def log_action(user_id, action, detail=''):
    db = get_db()
    db.execute('INSERT INTO actions_log (user_id, action, detail) VALUES (?,?,?)',
               (user_id, action, detail))
    db.commit()


# ---------------------------------------------------------------------------
# IMPORTANT: No X-Frame-Options or CSP frame-ancestors on ANY response
# This is the core clickjacking vulnerability.
# ---------------------------------------------------------------------------

@app.after_request
def remove_frame_protections(response):
    # Explicitly ensure no framing protections exist
    response.headers.pop('X-Frame-Options', None)
    response.headers.pop('Content-Security-Policy', None)
    return response

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    user = current_user()
    challenges = [
        {
            'num': 1,
            'title': 'Basic Clickjacking - Delete Account',
            'desc': 'The settings page has a "Delete Account" button with no frame protections. Trick the victim into clicking it.',
            'target': '/settings',
            'poc': '/poc/1',
            'bot': '/bot',
        },
        {
            'num': 2,
            'title': 'Form Hijacking - Credit Transfer',
            'desc': 'The transfer form can be framed. Pre-fill hidden fields and trick the victim into submitting.',
            'target': '/transfer',
            'poc': '/poc/2',
            'bot': '/bot2',
        },
        {
            'num': 3,
            'title': 'Multi-Step Clickjacking - Privilege Escalation',
            'desc': 'The promotion flow requires two confirmations. Both pages are frameable.',
            'target': '/admin/promote',
            'poc': '/poc/3',
            'bot': '/bot3',
        },
        {
            'num': 4,
            'title': 'Framebuster Bypass - Sandbox Trick',
            'desc': 'The page has JS framebusting, but sandbox attribute on the iframe can neutralize it.',
            'target': '/settings-js',
            'poc': '/poc/4',
            'bot': '/bot4',
        },
        {
            'num': 5,
            'title': 'Data Exfiltration via Clickjacking',
            'desc': 'The export page returns sensitive data. Frame it and trick the victim into triggering the export.',
            'target': '/export-data',
            'poc': '/poc/5',
            'bot': '/bot5',
        },
    ]
    db = get_db()
    solved = {}
    for row in db.execute('SELECT challenge, solved FROM flags').fetchall():
        solved[row['challenge']] = row['solved']
    return render_template('index.html', user=user, challenges=challenges, solved=solved)


# --- Challenge 1: Delete Account ---

@app.route('/settings')
def settings_page():
    user = current_user()
    return render_template('settings.html', user=user)


@app.route('/settings/delete', methods=['POST'])
def settings_delete():
    db = get_db()
    db.execute('UPDATE users SET deleted=1 WHERE id=2')
    db.commit()
    log_action(2, 'delete_account', 'Operator account deleted via clickjacking')
    # Check if flag should be awarded
    user = db.execute('SELECT * FROM users WHERE id=2').fetchone()
    if user and user['deleted'] == 1:
        db.execute('UPDATE flags SET solved=1 WHERE challenge=1')
        db.commit()
        return render_template('settings.html', user=user,
                               flag=FLAGS[1], message='Account deleted!')
    return redirect(url_for('settings_page'))


@app.route('/bot', methods=['POST'])
def bot1():
    """Simulate victim clicking the Delete Account button inside the iframe."""
    db = get_db()
    db.execute('UPDATE users SET deleted=1 WHERE id=2')
    db.commit()
    log_action(2, 'bot_click_delete', 'Bot simulated click on Delete Account')
    user = db.execute('SELECT * FROM users WHERE id=2').fetchone()
    if user and user['deleted'] == 1:
        db.execute('UPDATE flags SET solved=1 WHERE challenge=1')
        db.commit()
        return jsonify({'success': True, 'flag': FLAGS[1],
                        'message': 'Victim clicked the button! Account deleted.'})
    return jsonify({'success': False, 'message': 'Action failed.'})


# --- Challenge 2: Credit Transfer ---

@app.route('/transfer')
def transfer_page():
    user = current_user()
    return render_template('transfer.html', user=user)


@app.route('/transfer', methods=['POST'])
def transfer_submit():
    db = get_db()
    to_user = request.form.get('to', '')
    amount = int(request.form.get('amount', 0))
    user = current_user()
    if not user or user['deleted']:
        return render_template('transfer.html', user=user, error='Account is deleted.')
    if amount <= 0 or amount > user['credits']:
        return render_template('transfer.html', user=user, error='Invalid amount.')
    target = db.execute('SELECT * FROM users WHERE username=?', (to_user,)).fetchone()
    if not target:
        return render_template('transfer.html', user=user, error='Target user not found.')
    db.execute('UPDATE users SET credits=credits-? WHERE id=2', (amount,))
    db.execute('UPDATE users SET credits=credits+? WHERE id=?', (amount, target['id']))
    db.commit()
    log_action(2, 'transfer', f'{amount} credits to {to_user}')
    db.execute('UPDATE flags SET solved=1 WHERE challenge=2')
    db.commit()
    user = current_user()
    return render_template('transfer.html', user=user, flag=FLAGS[2],
                           message=f'Transferred {amount} credits to {to_user}.')


@app.route('/bot2', methods=['POST'])
def bot2():
    """Simulate victim filling form and submitting transfer."""
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id=2').fetchone()
    if not user or user['deleted']:
        return jsonify({'success': False, 'message': 'Operator account unavailable.'})
    amount = 500
    db.execute('UPDATE users SET credits=credits-? WHERE id=2', (amount,))
    db.execute('UPDATE users SET credits=credits+? WHERE id=1', (amount,))
    db.commit()
    log_action(2, 'bot_transfer', f'{amount} credits to admin')
    db.execute('UPDATE flags SET solved=1 WHERE challenge=2')
    db.commit()
    return jsonify({'success': True, 'flag': FLAGS[2],
                    'message': f'Victim submitted transfer form! {amount} credits sent to admin.'})


# --- Challenge 3: Multi-Step Promotion ---

@app.route('/admin/promote')
def promote_page():
    user = current_user()
    step = request.args.get('step', '1')
    return render_template('promote.html', user=user, step=step)


@app.route('/admin/promote', methods=['POST'])
def promote_submit():
    db = get_db()
    step = request.form.get('step', '1')
    if step == '1':
        user = current_user()
        return render_template('promote.html', user=user, step='2')
    elif step == '2':
        db.execute("UPDATE users SET role='admin' WHERE id=2")
        db.commit()
        log_action(2, 'promote', 'Operator promoted to admin')
        db.execute('UPDATE flags SET solved=1 WHERE challenge=3')
        db.commit()
        user = current_user()
        return render_template('promote.html', user=user, step='done', flag=FLAGS[3],
                               message='Operator promoted to admin!')
    return redirect(url_for('promote_page'))


@app.route('/bot3', methods=['POST'])
def bot3():
    """Simulate victim clicking through two-step confirmation."""
    db = get_db()
    db.execute("UPDATE users SET role='admin' WHERE id=2")
    db.commit()
    log_action(2, 'bot_promote', 'Bot simulated two-step promotion')
    user = db.execute('SELECT * FROM users WHERE id=2').fetchone()
    if user and user['role'] == 'admin':
        db.execute('UPDATE flags SET solved=1 WHERE challenge=3')
        db.commit()
        return jsonify({'success': True, 'flag': FLAGS[3],
                        'message': 'Victim clicked both buttons! Operator promoted to admin.'})
    return jsonify({'success': False, 'message': 'Promotion failed.'})


# --- Challenge 4: Framebuster Bypass ---

@app.route('/settings-js')
def settings_js_page():
    user = current_user()
    return render_template('settings_js.html', user=user)


@app.route('/settings-js/action', methods=['POST'])
def settings_js_action():
    """Change operator role via the settings-js page."""
    db = get_db()
    new_role = request.form.get('role', 'superuser')
    db.execute('UPDATE users SET role=? WHERE id=2', (new_role,))
    db.commit()
    log_action(2, 'role_change', f'Role changed to {new_role}')
    user = db.execute('SELECT * FROM users WHERE id=2').fetchone()
    if user and user['role'] != 'user':
        db.execute('UPDATE flags SET solved=1 WHERE challenge=4')
        db.commit()
        return render_template('settings_js.html', user=user, flag=FLAGS[4],
                               message=f'Role changed to {new_role}!')
    return redirect(url_for('settings_js_page'))


@app.route('/bot4', methods=['POST'])
def bot4():
    """Simulate victim interaction with sandboxed iframe bypassing framebuster."""
    db = get_db()
    db.execute("UPDATE users SET role='superuser' WHERE id=2")
    db.commit()
    log_action(2, 'bot_framebust_bypass', 'Bot bypassed framebuster via sandbox')
    user = db.execute('SELECT * FROM users WHERE id=2').fetchone()
    if user and user['role'] != 'user':
        db.execute('UPDATE flags SET solved=1 WHERE challenge=4')
        db.commit()
        return jsonify({'success': True, 'flag': FLAGS[4],
                        'message': 'Framebuster bypassed with sandbox! Role changed.'})
    return jsonify({'success': False, 'message': 'Bypass failed.'})


# --- Challenge 5: Data Exfiltration ---

@app.route('/export-data')
def export_page():
    user = current_user()
    return render_template('export.html', user=user)


@app.route('/export-data', methods=['POST'])
def export_submit():
    db = get_db()
    users = db.execute('SELECT * FROM users').fetchall()
    log_action(2, 'export', 'Exported all data')
    db.execute('UPDATE flags SET solved=1 WHERE challenge=5')
    db.commit()
    user = current_user()
    export_data = []
    for u in users:
        export_data.append({
            'id': u['id'], 'username': u['username'],
            'role': u['role'], 'credits': u['credits'], 'deleted': u['deleted']
        })
    return render_template('export.html', user=user, flag=FLAGS[5],
                           export_data=export_data,
                           message='Data exported! Sensitive information revealed.')


@app.route('/bot5', methods=['POST'])
def bot5():
    """Simulate victim clicking export button."""
    db = get_db()
    users = db.execute('SELECT * FROM users').fetchall()
    log_action(2, 'bot_export', 'Bot simulated export click')
    db.execute('UPDATE flags SET solved=1 WHERE challenge=5')
    db.commit()
    export_data = []
    for u in users:
        export_data.append({
            'id': u['id'], 'username': u['username'],
            'role': u['role'], 'credits': u['credits'], 'deleted': u['deleted']
        })
    return jsonify({'success': True, 'flag': FLAGS[5],
                    'message': 'Victim clicked export! Data exfiltrated.',
                    'data': export_data})


# --- POC Pages ---

@app.route('/poc/<int:n>')
def poc_page(n):
    if n < 1 or n > 5:
        return redirect(url_for('index'))

    poc_configs = {
        1: {
            'title': 'POC 1 - Basic Clickjacking',
            'target_url': '/settings',
            'description': 'Transparent iframe overlays the "Delete Account" button. The victim thinks they are clicking a decoy button.',
            'iframe_attrs': '',
            'decoy_text': 'Click here to claim your FREE credits!',
            'bot_url': '/bot',
            'sandbox': False,
        },
        2: {
            'title': 'POC 2 - Form Hijacking',
            'target_url': '/transfer',
            'description': 'The transfer form is loaded in a transparent iframe. Hidden fields are pre-filled by the attacker page.',
            'iframe_attrs': '',
            'decoy_text': 'Click here to verify your account!',
            'bot_url': '/bot2',
            'sandbox': False,
        },
        3: {
            'title': 'POC 3 - Multi-Step Clickjacking',
            'target_url': '/admin/promote',
            'description': 'Two overlapping iframes guide the victim through both confirmation steps.',
            'iframe_attrs': '',
            'decoy_text': 'Step 1: Click to accept terms',
            'bot_url': '/bot3',
            'sandbox': False,
        },
        4: {
            'title': 'POC 4 - Framebuster Bypass',
            'target_url': '/settings-js',
            'description': 'The target page uses JavaScript framebusting (if top!==self). The sandbox attribute blocks top.location assignment, neutralizing the defense.',
            'iframe_attrs': 'sandbox="allow-forms allow-scripts"',
            'decoy_text': 'Click here to update your preferences!',
            'bot_url': '/bot4',
            'sandbox': True,
        },
        5: {
            'title': 'POC 5 - Data Exfiltration',
            'target_url': '/export-data',
            'description': 'The export button is overlaid with a transparent iframe. Clicking triggers data export containing sensitive information.',
            'iframe_attrs': '',
            'decoy_text': 'Click here to win a prize!',
            'bot_url': '/bot5',
            'sandbox': False,
        },
    }
    config = poc_configs[n]
    return render_template('poc.html', poc=config, challenge_num=n)


# --- Reset ---

@app.route('/reset')
def reset():
    reset_db()
    flash('Lab reset to initial state.', 'success')
    return redirect(url_for('index'))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5007, debug=False)
