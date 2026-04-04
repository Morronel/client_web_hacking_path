"""
NeonAuth - Broken Authentication Practice Lab
Port 5005

INTENTIONALLY VULNERABLE - For authorized educational use only.
All vulnerabilities are deliberate for CTF-style learning.
"""

import sqlite3
import uuid
import os
from flask import (
    Flask, request, render_template, redirect, url_for,
    jsonify, make_response, g
)

app = Flask(__name__)
app.secret_key = "neonauth-insecure-key-12345"

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "neonauth.db")

# ---------------------------------------------------------------------------
# In-memory session store
# ---------------------------------------------------------------------------
SESSION_STORE: dict = {}


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create tables and seed data if they don't exist."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'guest',
            flag_note TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS login_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            ip TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            success INTEGER DEFAULT 0
        );
    """)

    # Seed users if table is empty
    cur.execute("SELECT COUNT(*) as cnt FROM users")
    if cur.fetchone()["cnt"] == 0:
        seed_users = [
            (1, "admin", "sunshine", "admin", "FLAG{4uth_4dm1n_br34ch}"),
            (2, "operator", "password123", "operator", "FLAG{w34k_p4ss_0p3r4t0r}"),
            (3, "guest", "guest", "guest", "Welcome to NeonAuth"),
        ]
        cur.executemany(
            "INSERT INTO users (id, username, password, role, flag_note) VALUES (?, ?, ?, ?, ?)",
            seed_users,
        )

    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Session helpers
# ---------------------------------------------------------------------------
def get_session_id():
    """Return the current neonauth_session cookie value, or None."""
    return request.cookies.get("neonauth_session")


def ensure_session(response):
    """If the visitor has no session cookie yet, set one."""
    sid = get_session_id()
    if not sid:
        sid = str(uuid.uuid4())
        response.set_cookie("neonauth_session", sid, httponly=False, samesite="Lax")
    return sid, response


def get_current_user():
    """Look up the authenticated user from the session store."""
    sid = get_session_id()
    if sid and sid in SESSION_STORE:
        return SESSION_STORE[sid]
    return None


@app.after_request
def after_request(response):
    """Ensure every response carries a session cookie."""
    ensure_session(response)
    return response


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    user = get_current_user()
    return render_template("index.html", user=user)


# ---------- LOGIN (Username Enumeration) ----------

@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    flag = None

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()

        db = get_db()

        # Log the attempt
        db.execute(
            "INSERT INTO login_attempts (username, ip, success) VALUES (?, ?, 0)",
            (username, request.remote_addr),
        )
        db.commit()

        user = db.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()

        # VULN: Different error messages -> username enumeration
        if user is None:
            error = "User not found in the system"
        elif user["password"] != password:
            error = "Invalid password for this account"
        else:
            # Successful login — update attempt record
            db.execute(
                "UPDATE login_attempts SET success = 1 WHERE id = (SELECT MAX(id) FROM login_attempts WHERE username = ?)",
                (username,),
            )
            db.commit()

            sid = get_session_id() or str(uuid.uuid4())
            SESSION_STORE[sid] = {
                "user_id": user["id"],
                "username": user["username"],
                "role": user["role"],
            }

            resp = make_response(redirect(url_for("dashboard")))
            resp.set_cookie("neonauth_session", sid, httponly=False, samesite="Lax")
            return resp

    user = get_current_user()
    return render_template("login.html", error=error, flag=flag, user=user)


# ---------- REGISTER (Weak Password Policy) ----------

@app.route("/register", methods=["GET", "POST"])
def register():
    message = None
    error = None

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()

        if not username:
            error = "Username is required"
        elif not password:
            error = "Password is required"
        else:
            db = get_db()
            existing = db.execute(
                "SELECT id FROM users WHERE username = ?", (username,)
            ).fetchone()
            if existing:
                error = "Username already taken"
            else:
                # VULN: No password complexity check — accepts anything
                db.execute(
                    "INSERT INTO users (username, password, role, flag_note) VALUES (?, ?, 'guest', 'New user')",
                    (username, password),
                )
                db.commit()
                message = f"Account '{username}' created successfully! You can now log in."

    user = get_current_user()
    return render_template("register.html", message=message, error=error, user=user)


# ---------- USERS LIST (Enumeration helper) ----------

@app.route("/users")
def users_list():
    db = get_db()
    users = db.execute("SELECT id, username, role FROM users ORDER BY id").fetchall()
    user = get_current_user()
    return render_template("users.html", users=users, user=user)


# ---------- WEAK PASSWORD CHALLENGE ----------

@app.route("/challenge/weak-password", methods=["GET", "POST"])
def weak_password():
    error = None
    flag = None

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()

        db = get_db()
        user_row = db.execute(
            "SELECT * FROM users WHERE username = ? AND password = ?",
            (username, password),
        ).fetchone()

        if user_row and user_row["username"] == "operator":
            flag = user_row["flag_note"]
        elif user_row:
            error = "Logged in, but this challenge requires the operator account."
        else:
            error = "Invalid credentials"

    user = get_current_user()
    return render_template("weak.html", error=error, flag=flag, user=user)


# ---------- DASHBOARD ----------

@app.route("/dashboard")
def dashboard():
    user = get_current_user()
    return render_template("dashboard.html", user=user)


# ---------- BRUTE FORCE (No Rate Limiting) ----------

@app.route("/brute", methods=["GET", "POST"])
def brute():
    if request.method == "POST":
        # Accept both JSON and form data
        if request.is_json:
            data = request.get_json()
            username = data.get("username", "").strip()
            password = data.get("password", "").strip()
        else:
            username = request.form.get("username", "").strip()
            password = request.form.get("password", "").strip()

        db = get_db()

        # Log attempt — VULN: no rate limiting, no lockout
        db.execute(
            "INSERT INTO login_attempts (username, ip, success) VALUES (?, ?, 0)",
            (username, request.remote_addr),
        )
        db.commit()

        user_row = db.execute(
            "SELECT * FROM users WHERE username = ? AND password = ?",
            (username, password),
        ).fetchone()

        if user_row:
            db.execute(
                "UPDATE login_attempts SET success = 1 WHERE id = (SELECT MAX(id) FROM login_attempts WHERE username = ?)",
                (username,),
            )
            db.commit()

            result = {
                "success": True,
                "message": f"Login successful! Flag: {user_row['flag_note']}",
                "flag": user_row["flag_note"],
            }
        else:
            result = {"success": False, "message": "Invalid credentials"}

        # Always return JSON for POST
        return jsonify(result)

    user = get_current_user()
    return render_template("brute.html", user=user)


# ---------- LOGOUT ----------

@app.route("/logout")
def logout():
    sid = get_session_id()
    if sid and sid in SESSION_STORE:
        del SESSION_STORE[sid]
    resp = make_response(redirect(url_for("index")))
    resp.delete_cookie("neonauth_session")
    return resp


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    init_db()
    print("[*] NeonAuth lab running on http://0.0.0.0:5005")
    app.run(host="0.0.0.0", port=5005, debug=True)
