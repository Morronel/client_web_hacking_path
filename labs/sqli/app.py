"""
NeonPulse Blog - SQL Injection Practice Lab
=============================================
EDUCATIONAL PURPOSE ONLY - All vulnerabilities are intentional.
This application is designed for authorized security training.

Challenges:
  1. UNION-based SQLi  (/search)       - Flag in flags table
  2. Auth bypass SQLi  (/login)        - Flag in users.secret_note
  3. Blind boolean SQLi (/post/<id>)   - Flag in posts.hidden_content
  4. Time-based blind SQLi (/api/user) - Flag in users.time_flag
"""

import sqlite3
import os
from flask import (
    Flask, request, render_template, redirect,
    url_for, jsonify, g
)

app = Flask(__name__)
app.secret_key = "neonpulse_not_so_secret_key"

DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "neonpulse.db")


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    """Return a database connection stored on the flask g object."""
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create tables and seed data if the database does not exist."""
    if os.path.exists(DATABASE):
        return

    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()

    # ---- Tables ----------------------------------------------------------
    cur.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            secret_note TEXT DEFAULT '',
            time_flag TEXT DEFAULT ''
        )
    """)

    cur.execute("""
        CREATE TABLE posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            category TEXT NOT NULL,
            hidden_content TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cur.execute("""
        CREATE TABLE comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            author TEXT NOT NULL,
            content TEXT NOT NULL
        )
    """)

    cur.execute("""
        CREATE TABLE flags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flag_name TEXT NOT NULL,
            flag_value TEXT NOT NULL
        )
    """)

    # ---- Seed: users -----------------------------------------------------
    # Ch2 flag lives ONLY in admin's secret_note
    # Ch4 flag lives ONLY in admin's time_flag
    cur.execute(
        "INSERT INTO users (username, password, role, secret_note, time_flag) "
        "VALUES ('admin', 'supersecret', 'admin', "
        "'FLAG{4uth_byp4ss_sqli}', 'FLAG{t1m3_b4s3d_bl1nd}')"
    )
    cur.execute(
        "INSERT INTO users (username, password, role, secret_note, time_flag) "
        "VALUES ('guest', 'guest123', 'user', 'Nothing here', '')"
    )

    # ---- Seed: posts -----------------------------------------------------
    # Ch3 flag lives ONLY in hidden_content of post id 3
    posts = [
        (
            "Chrome-Dome Implants: A Buyer's Guide",
            "The latest neural uplink from Arasaka hit the black market last week. "
            "Street docs across Night City are already installing them at half the "
            "corpo price. We break down which firmware version is worth your eddies "
            "and which ones will flatline you in your sleep. Remember: always patch "
            "your wetware before connecting to unknown subnets.",
            "z3r0c00l",
            "cyberware",
            "",
        ),
        (
            "Decking 101: How to Breach ICE Without Dying",
            "Every wannabe netrunner thinks they can crack corporate ICE with a "
            "bargain-bin cyberdeck. Spoiler: you can't. In this guide we walk "
            "through proper daemon sequencing, buffer overflow techniques for "
            "legacy Militech firewalls, and how to build a kill-switch that "
            "actually works when the black ICE bites back.",
            "gh0stwr1t3r",
            "hacking",
            "",
        ),
        (
            "Neon District After Dark: Underground Raves",
            "If you haven't been to a rave in the sub-levels of Sector 7, you "
            "haven't lived. Synth-bass so heavy it rattles your titanium ribs. "
            "Holo-projections painting the walls in fractals. And yes, the rumor "
            "is true - DJ Chromatic is an AI running on a stolen military core.",
            "neonrider",
            "culture",
            "FLAG{bl1nd_sql1_pr0}",
        ),
        (
            "Corp Wars: Militech vs Arasaka - 2087 Update",
            "The cold war between the two mega-corps heated up this quarter when "
            "Militech's R&D subnet was found running Arasaka-signed daemons. "
            "Espionage, counter-intrusion, and a suspicious server farm fire in "
            "New Shanghai. We compile the timeline of events and leaked memos.",
            "dataphr34k",
            "news",
            "",
        ),
        (
            "Building Your First EMP Grenade on a Budget",
            "Disclaimer: possession of unlicensed EMP devices carries a mandatory "
            "five-year sentence in most jurisdictions. That said, here is a "
            "purely theoretical walkthrough using off-the-shelf capacitor banks "
            "and a modified microwave transformer. For educational purposes only. "
            "Seriously. Don't do this. ...Unless you really need to.",
            "z3r0c00l",
            "hardware",
            "",
        ),
    ]
    for title, content, author, category, hidden in posts:
        cur.execute(
            "INSERT INTO posts (title, content, author, category, hidden_content) "
            "VALUES (?, ?, ?, ?, ?)",
            (title, content, author, category, hidden),
        )

    # ---- Seed: flags (Ch1 flag ONLY) -------------------------------------
    cur.execute(
        "INSERT INTO flags (flag_name, flag_value) VALUES (?, ?)",
        ("search_flag", "FLAG{un10n_s3l3ct_m4st3r}"),
    )

    # ---- Seed: comments --------------------------------------------------
    cur.execute(
        "INSERT INTO comments (post_id, author, content) "
        "VALUES (1, 'neonrider', 'Great review! I got mine from a street doc in Kabuki.')"
    )
    cur.execute(
        "INSERT INTO comments (post_id, author, content) "
        "VALUES (2, 'skr1ptk1dd13', 'Tried this on a Militech subnet... almost flatlined.')"
    )

    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    """Homepage - list all posts."""
    db = get_db()
    posts = db.execute("SELECT id, title, content, author, category, created_at FROM posts ORDER BY created_at DESC").fetchall()
    return render_template("index.html", posts=posts)


@app.route("/search")
def search():
    """
    Challenge 1: UNION-based SQL Injection.
    Flag: FLAG{un10n_s3l3ct_m4st3r}  (in flags table)
    Extract via: ' UNION SELECT 1,flag_name,flag_value,4,5,6 FROM flags--
    """
    q = request.args.get("q", "")
    db = get_db()
    results = []
    error = None

    if q:
        query = f"SELECT id, title, content, author, category, created_at FROM posts WHERE title LIKE '%{q}%' OR content LIKE '%{q}%'"
        try:
            results = db.execute(query).fetchall()
        except Exception as e:
            error = str(e)

    return render_template("search.html", query=q, results=results, error=error)


@app.route("/login", methods=["GET", "POST"])
def login():
    """
    Challenge 2: Authentication bypass via SQL Injection.
    Flag: FLAG{4uth_byp4ss_sqli}  (in admin's secret_note column)
    Bypass: username = admin'--   password = anything
    """
    error = None
    success = None
    flag = None

    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")

        query = (
            f"SELECT * FROM users WHERE username='{username}' "
            f"AND password='{password}'"
        )

        db = get_db()
        try:
            user = db.execute(query).fetchone()
            if user:
                if user["role"] == "admin":
                    success = f"Welcome back, {user['username']}! You have admin access."
                    flag = user["secret_note"]
                else:
                    success = f"Welcome, {user['username']}! You are logged in as {user['role']}."
            else:
                error = "Invalid credentials. Access denied."
        except Exception as e:
            error = f"Database error: {e}"

    return render_template("login.html", error=error, success=success, flag=flag)


@app.route("/post/<post_id>")
def view_post(post_id):
    """
    Challenge 3: Blind Boolean-Based SQL Injection.
    Flag: FLAG{bl1nd_sql1_pr0}  (in posts.hidden_content of post id 3)
    The query does NOT return hidden_content, so it must be extracted
    character-by-character via boolean conditions.
    Boolean test: /post/1 AND 1=1  vs  /post/1 AND 1=2
    """
    db = get_db()
    # Note: hidden_content is deliberately excluded from the SELECT
    query = f"SELECT id, title, content, author, category, created_at FROM posts WHERE id = {post_id}"

    try:
        post = db.execute(query).fetchone()
    except Exception:
        post = None

    if post is None:
        return render_template(
            "post.html",
            post=None,
            comments=[],
            not_found=True,
            message="Post not found in the database. The void stares back.",
        ), 404

    comments = db.execute(
        "SELECT * FROM comments WHERE post_id = ?", (post["id"],)
    ).fetchall()

    return render_template("post.html", post=post, comments=comments, not_found=False)


@app.route("/comment", methods=["POST"])
def add_comment():
    """Add a comment to a post (not a challenge, just supporting functionality)."""
    post_id = request.form.get("post_id", "0")
    author = request.form.get("author", "anonymous")
    content = request.form.get("content", "")

    db = get_db()
    error = None

    try:
        db.execute(
            "INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)",
            (post_id, author, content),
        )
        db.commit()
    except Exception as e:
        error = str(e)

    if error:
        return render_template(
            "post.html",
            post=None,
            comments=[],
            not_found=True,
            message=f"Error adding comment: {error}",
        ), 400

    return redirect(url_for("view_post", post_id=post_id))


@app.route("/api/user")
def api_user():
    """
    Challenge 4: Time-based Blind SQL Injection.
    Flag: FLAG{t1m3_b4s3d_bl1nd}  (in admin's time_flag column, id=1)
    The endpoint returns ONLY the username as JSON — the flag is never
    in the response.  Use timing side-channels to extract it:
      /api/user?id=1 AND CASE WHEN (unicode(substr((SELECT time_flag FROM users WHERE id=1),1,1))>64) THEN randomblob(100000000) ELSE 0 END
    """
    user_id = request.args.get("id", "")
    if not user_id:
        return jsonify({"status": "error", "message": "Missing id parameter"}), 400

    db = get_db()

    # Vulnerable: string concatenation
    query = "SELECT id, username FROM users WHERE id = " + user_id

    try:
        user = db.execute(query).fetchone()
        if user:
            return jsonify({
                "status": "success",
                "user": {"id": user["id"], "username": user["username"]},
            })
        else:
            return jsonify({"status": "error", "message": "User not found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

init_db()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=False)
