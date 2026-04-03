"""
NeonShop - IDOR (Insecure Direct Object Reference) Vulnerable Lab
Educational CTF-style application. All vulnerabilities are INTENTIONAL.
Port: 5004
"""

import sqlite3
import os
from flask import (
    Flask, render_template, request, session, jsonify,
    redirect, url_for, flash, g
)

app = Flask(__name__)
app.secret_key = 'neonshop-idor-lab-secret-key-not-secure'
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'neonshop.db')


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    """Get a database connection for the current request."""
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
    """Create tables and seed data if the database does not exist."""
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    cur = db.cursor()

    # ---- Tables ----------------------------------------------------------
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            api_key TEXT,
            secret_note TEXT
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item TEXT NOT NULL,
            total REAL NOT NULL,
            notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            subject TEXT NOT NULL,
            content TEXT NOT NULL,
            is_private INTEGER DEFAULT 0,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id)
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            content TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # ---- Seed data (only if tables are empty) ----------------------------
    if cur.execute('SELECT COUNT(*) FROM users').fetchone()[0] == 0:
        users = [
            (1, 'admin', 'admin123', 'admin',
             'FLAG{1d0r_4p1_k3y_l34k}',
             'FLAG{1d0r_pr0f1l3_4cc3ss}'),
            (2, 'user', 'user123', 'user',
             'user-api-key-normal',
             'Nothing special'),
            (3, 'guest', 'guest', 'guest',
             'guest-key',
             'Just browsing'),
        ]
        cur.executemany(
            'INSERT INTO users (id, username, password, role, api_key, secret_note) '
            'VALUES (?, ?, ?, ?, ?, ?)', users
        )

    if cur.execute('SELECT COUNT(*) FROM orders').fetchone()[0] == 0:
        orders = [
            (1, 1, 'Classified Neural Implant', 99999,
             'FLAG{1d0r_0rd3r_l34k}'),
            (2, 2, 'Basic Cyberdeck', 500, 'Standard order'),
            (3, 2, 'Neon Jacket', 150, 'Express shipping'),
        ]
        cur.executemany(
            'INSERT INTO orders (id, user_id, item, total, notes) '
            'VALUES (?, ?, ?, ?, ?)', orders
        )

    if cur.execute('SELECT COUNT(*) FROM messages').fetchone()[0] == 0:
        messages = [
            (1, 1, 1, 'Admin Credentials',
             'FLAG{1d0r_m3ss4g3_r34d}', 1),
            (2, 2, 1, 'Hello Admin',
             'Can I get access?', 0),
            (3, 1, 2, 'Welcome',
             'Welcome to NeonShop!', 0),
        ]
        cur.executemany(
            'INSERT INTO messages (id, sender_id, receiver_id, subject, content, is_private) '
            'VALUES (?, ?, ?, ?, ?, ?)', messages
        )

    if cur.execute('SELECT COUNT(*) FROM files').fetchone()[0] == 0:
        files = [
            (1, 1, 'admin_report.txt',
             'CONFIDENTIAL REPORT\n\nFLAG{1d0r_f1l3_d0wnl04d}\n\nEnd of report.'),
            (2, 2, 'receipt.txt',
             'Thank you for your purchase!'),
        ]
        cur.executemany(
            'INSERT INTO files (id, user_id, filename, content) '
            'VALUES (?, ?, ?, ?)', files
        )

    db.commit()
    db.close()


# ---------------------------------------------------------------------------
# Web routes
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    """Dashboard. Auto-login as user id=2 if not already logged in."""
    if 'user_id' not in session:
        session['user_id'] = 2
        session['username'] = 'user'
        session['role'] = 'user'
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login form."""
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        db = get_db()
        user = db.execute(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            (username, password)
        ).fetchone()
        if user:
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            flash(f'Logged in as {user["username"]}', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid credentials', 'error')
    return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out', 'info')
    return redirect(url_for('login'))


@app.route('/profile')
def profile_page():
    """Profile page - shows API URL for current user."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('profile.html')


@app.route('/orders')
def orders_page():
    """Orders page - shows API URL for current user's orders."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('orders.html')


@app.route('/messages')
def messages_page():
    """Messages page - shows API URL for messages."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('messages.html')


@app.route('/files')
def files_page():
    """Files page - shows download URLs."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('files.html')


@app.route('/settings')
def settings_page():
    """Settings page - shows API URL for user settings."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('settings.html')


# ---------------------------------------------------------------------------
# Vulnerable API endpoints - NO authorization checks (intentional)
# ---------------------------------------------------------------------------

@app.route('/api/user/<int:user_id>')
def api_user(user_id):
    """
    VULNERABLE: User Profile IDOR
    No check that the requested user_id matches the logged-in user.
    Accessing /api/user/1 reveals admin's secret_note flag.
    """
    db = get_db()
    user = db.execute(
        'SELECT id, username, role, secret_note FROM users WHERE id = ?',
        (user_id,)
    ).fetchone()
    if user is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'role': user['role'],
        'secret_note': user['secret_note'],
    })


@app.route('/api/order/<int:order_id>')
def api_order(order_id):
    """
    VULNERABLE: Order IDOR
    No check that the order belongs to the logged-in user.
    Accessing /api/order/1 reveals admin's order with flag.
    """
    db = get_db()
    order = db.execute(
        'SELECT o.id, o.user_id, o.item, o.total, o.notes, u.username '
        'FROM orders o JOIN users u ON o.user_id = u.id '
        'WHERE o.id = ?',
        (order_id,)
    ).fetchone()
    if order is None:
        return jsonify({'error': 'Order not found'}), 404
    return jsonify({
        'order_id': order['id'],
        'user_id': order['user_id'],
        'username': order['username'],
        'item': order['item'],
        'total': order['total'],
        'notes': order['notes'],
    })


@app.route('/api/message/<int:message_id>')
def api_message(message_id):
    """
    VULNERABLE: Message IDOR
    No check on ownership or privacy flag.
    Accessing /api/message/1 reveals admin's private message with flag.
    """
    db = get_db()
    msg = db.execute(
        'SELECT m.id, m.sender_id, m.receiver_id, m.subject, m.content, '
        'm.is_private, s.username AS sender_name, r.username AS receiver_name '
        'FROM messages m '
        'JOIN users s ON m.sender_id = s.id '
        'JOIN users r ON m.receiver_id = r.id '
        'WHERE m.id = ?',
        (message_id,)
    ).fetchone()
    if msg is None:
        return jsonify({'error': 'Message not found'}), 404
    return jsonify({
        'message_id': msg['id'],
        'sender': msg['sender_name'],
        'receiver': msg['receiver_name'],
        'subject': msg['subject'],
        'content': msg['content'],
        'is_private': bool(msg['is_private']),
    })


@app.route('/download')
def download_file():
    """
    VULNERABLE: File Download IDOR
    No check that the file belongs to the logged-in user.
    Downloading file=admin_report.txt reveals the flag.
    """
    filename = request.args.get('file', '')
    if not filename:
        return jsonify({'error': 'No file specified'}), 400
    db = get_db()
    f = db.execute(
        'SELECT id, user_id, filename, content FROM files WHERE filename = ?',
        (filename,)
    ).fetchone()
    if f is None:
        return jsonify({'error': 'File not found'}), 404
    return jsonify({
        'file_id': f['id'],
        'owner_user_id': f['user_id'],
        'filename': f['filename'],
        'content': f['content'],
    })


@app.route('/api/settings')
def api_settings():
    """
    VULNERABLE: API Key IDOR via query parameter
    No check that the user_id param matches the session.
    Accessing /api/settings?user_id=1 reveals admin's API key flag.
    """
    user_id = request.args.get('user_id', type=int)
    if user_id is None:
        return jsonify({'error': 'user_id parameter required'}), 400
    db = get_db()
    user = db.execute(
        'SELECT id, username, role, api_key FROM users WHERE id = ?',
        (user_id,)
    ).fetchone()
    if user is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'user_id': user['id'],
        'username': user['username'],
        'role': user['role'],
        'api_key': user['api_key'],
    })


@app.route('/api/users')
def api_users_list():
    """List all users (id and username only) - helps with enumeration."""
    db = get_db()
    users = db.execute('SELECT id, username, role FROM users').fetchall()
    return jsonify([
        {'id': u['id'], 'username': u['username'], 'role': u['role']}
        for u in users
    ])


@app.route('/api/files')
def api_files_list():
    """List all files - helps with enumeration."""
    db = get_db()
    files = db.execute('SELECT id, user_id, filename FROM files').fetchall()
    return jsonify([
        {'id': f['id'], 'user_id': f['user_id'], 'filename': f['filename']}
        for f in files
    ])


# ---------------------------------------------------------------------------
# Hints / guide endpoint
# ---------------------------------------------------------------------------

@app.route('/hints')
def hints():
    """Provide hints for solving the IDOR challenges."""
    return jsonify({
        'lab': 'NeonShop IDOR Lab',
        'description': 'Find all 5 flags by exploiting Insecure Direct Object References',
        'challenges': [
            {
                'name': 'Profile IDOR',
                'hint': 'The API returns user profiles by ID. What if you change the ID?',
                'endpoint': '/api/user/<id>',
                'your_url': '/api/user/2',
            },
            {
                'name': 'Order IDOR',
                'hint': 'Orders are fetched by order ID. Are there orders you cannot see?',
                'endpoint': '/api/order/<id>',
                'your_url': '/api/order/2',
            },
            {
                'name': 'Message IDOR',
                'hint': 'Messages have IDs too. Some are marked private...',
                'endpoint': '/api/message/<id>',
                'your_url': '/api/message/3',
            },
            {
                'name': 'File Download IDOR',
                'hint': 'Files are downloaded by filename. Can you guess other filenames?',
                'endpoint': '/download?file=<filename>',
                'your_url': '/download?file=receipt.txt',
            },
            {
                'name': 'Settings / API Key IDOR',
                'hint': 'Settings use a user_id query parameter. Try a different one.',
                'endpoint': '/api/settings?user_id=<id>',
                'your_url': '/api/settings?user_id=2',
            },
        ],
        'total_flags': 5,
    })


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    init_db()
    print('\n' + '=' * 60)
    print('  NeonShop - IDOR Vulnerability Lab')
    print('  Running on http://127.0.0.1:5004')
    print('  Auto-login as: user (id=2)')
    print('  Flags to find: 5')
    print('=' * 60 + '\n')
    app.run(host='0.0.0.0', port=5004, debug=True)
