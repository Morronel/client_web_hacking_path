import sqlite3
import time
import os
from flask import Flask, request, render_template, g, jsonify

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'race.db')

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
    """Create tables and seed initial data."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('DROP TABLE IF EXISTS accounts')
    c.execute('DROP TABLE IF EXISTS vouchers')
    c.execute('DROP TABLE IF EXISTS flags')

    c.execute('''CREATE TABLE accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        balance REAL DEFAULT 0
    )''')

    c.execute('''CREATE TABLE vouchers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        value REAL NOT NULL,
        redeemed INTEGER DEFAULT 0
    )''')

    c.execute('''CREATE TABLE flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL
    )''')

    # Seed data
    c.execute("INSERT INTO accounts (username, balance) VALUES ('hacker', 100)")
    c.execute("INSERT INTO vouchers (code, value, redeemed) VALUES ('NEON-GIFT-2024', 500, 0)")

    c.execute("INSERT INTO flags (name, value) VALUES ('redeem',   'FLAG{r4c3_d0ubl3_sp3nd}')")
    c.execute("INSERT INTO flags (name, value) VALUES ('withdraw', 'FLAG{r4c3_n3g4t1v3_bal}')")

    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Homepage
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    db = get_db()
    acct = db.execute("SELECT balance FROM accounts WHERE username='hacker'").fetchone()
    balance = acct['balance'] if acct else 0

    voucher = db.execute("SELECT redeemed FROM vouchers WHERE code='NEON-GIFT-2024'").fetchone()
    voucher_status = 'Redeemed' if (voucher and voucher['redeemed']) else 'Available'

    return render_template('index.html',
                           balance=balance,
                           voucher_status=voucher_status)


# ---------------------------------------------------------------------------
# Challenge 1 -- Voucher Redeem (Double Spend)
# ---------------------------------------------------------------------------

@app.route('/redeem', methods=['POST'])
def redeem():
    code = request.form.get('code', '')
    db = get_db()

    # CHECK -- read current state
    row = db.execute("SELECT id, value, redeemed FROM vouchers WHERE code=? AND redeemed=0", (code,)).fetchone()
    if not row:
        return render_template('result.html', title='Redeem Voucher',
                               message='Voucher not found or already redeemed.', success=False)

    voucher_id = row['id']
    value = row['value']

    # --- TOCTOU gap ---
    time.sleep(0.1)

    # UPDATE -- mark redeemed and credit balance
    db.execute("UPDATE vouchers SET redeemed=1 WHERE id=?", (voucher_id,))
    db.execute("UPDATE accounts SET balance = balance + ? WHERE username='hacker'", (value,))
    db.commit()

    return render_template('result.html', title='Redeem Voucher',
                           message=f'Voucher {code} redeemed! +{value} credits added.', success=True)


@app.route('/check-balance')
def check_balance():
    db = get_db()
    row = db.execute("SELECT balance FROM accounts WHERE username='hacker'").fetchone()
    balance = row['balance'] if row else 0
    if balance > 600:
        flag = db.execute("SELECT value FROM flags WHERE name='redeem'").fetchone()['value']
        return render_template('result.html', title='Balance Check',
                               message=f'Balance is {balance}. Double-spend detected!', success=True, flag=flag)
    return render_template('result.html', title='Balance Check',
                           message=f'Balance is {balance}. Need > 600 to prove double-spend.', success=False)


# ---------------------------------------------------------------------------
# Challenge 2 -- Overdraft / Negative Balance
# ---------------------------------------------------------------------------

@app.route('/withdraw', methods=['POST'])
def withdraw():
    try:
        amount = float(request.form.get('amount', 0))
    except (ValueError, TypeError):
        return render_template('result.html', title='Withdraw',
                               message='Invalid amount.', success=False)
    if amount <= 0:
        return render_template('result.html', title='Withdraw',
                               message='Amount must be positive.', success=False)

    db = get_db()

    # CHECK -- sufficient funds?
    row = db.execute("SELECT balance FROM accounts WHERE username='hacker'").fetchone()
    balance = row['balance'] if row else 0
    if balance < amount:
        return render_template('result.html', title='Withdraw',
                               message=f'Insufficient funds. Balance: {balance}', success=False)

    # --- TOCTOU gap ---
    time.sleep(0.1)

    # UPDATE -- deduct
    db.execute("UPDATE accounts SET balance = balance - ? WHERE username='hacker'", (amount,))
    db.commit()

    new_balance = db.execute("SELECT balance FROM accounts WHERE username='hacker'").fetchone()['balance']
    return render_template('result.html', title='Withdraw',
                           message=f'Withdrew {amount} credits. New balance: {new_balance}', success=True)


@app.route('/check-negative')
def check_negative():
    db = get_db()
    row = db.execute("SELECT balance FROM accounts WHERE username='hacker'").fetchone()
    balance = row['balance'] if row else 0
    if balance < 0:
        flag = db.execute("SELECT value FROM flags WHERE name='withdraw'").fetchone()['value']
        return render_template('result.html', title='Negative Balance Check',
                               message=f'Balance is {balance}. Overdraft achieved!', success=True, flag=flag)
    return render_template('result.html', title='Negative Balance Check',
                           message=f'Balance is {balance}. Need negative balance.', success=False)


# ---------------------------------------------------------------------------
# Reset
# ---------------------------------------------------------------------------

@app.route('/reset', methods=['GET', 'POST'])
def reset():
    init_db()
    return render_template('result.html', title='Reset',
                           message='All data has been reset to initial state.', success=True)


# ---------------------------------------------------------------------------
# Boot
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5013, debug=False, threaded=True)
