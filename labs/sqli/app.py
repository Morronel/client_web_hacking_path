"""
NeonPulse Blog - SQL Injection Practice Lab
=============================================
EDUCATIONAL PURPOSE ONLY - All vulnerabilities are intentional.
This application is designed for authorized security training.
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
        # Enable executing multiple statements (needed for stacked queries)
        g.db.execute("PRAGMA journal_mode=WAL")
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
            secret_note TEXT DEFAULT ''
        )
    """)

    cur.execute("""
        CREATE TABLE posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            category TEXT NOT NULL,
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

    cur.execute("""
        CREATE TABLE admin_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_admin_visible INTEGER DEFAULT 1
        )
    """)

    # ---- Seed: users -----------------------------------------------------
    cur.execute(
        "INSERT INTO users (username, password, role, secret_note) "
        "VALUES ('admin', 'supersecret', 'admin', 'FLAG{sqli_profile_idor_4dm1n}')"
    )
    cur.execute(
        "INSERT INTO users (username, password, role, secret_note) "
        "VALUES ('guest', 'guest123', 'user', 'Nothing here')"
    )

    # ---- Seed: posts -----------------------------------------------------
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
        ),
        (
            "Neon District After Dark: Underground Raves",
            "If you haven't been to a rave in the sub-levels of Sector 7, you "
            "haven't lived. Synth-bass so heavy it rattles your titanium ribs. "
            "Holo-projections painting the walls in fractals. And yes, the rumor "
            "is true - DJ Chromatic is an AI running on a stolen military core.",
            "neonrider",
            "culture",
        ),
        (
            "Corp Wars: Militech vs Arasaka - 2087 Update",
            "The cold war between the two mega-corps heated up this quarter when "
            "Militech's R&D subnet was found running Arasaka-signed daemons. "
            "Espionage, counter-intrusion, and a suspicious server farm fire in "
            "New Shanghai. We compile the timeline of events and leaked memos.",
            "dataphr34k",
            "news",
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
        ),
    ]
    for title, content, author, category in posts:
        cur.execute(
            "INSERT INTO posts (title, content, author, category) "
            "VALUES (?, ?, ?, ?)",
            (title, content, author, category),
        )

    # ---- Seed: flags -----------------------------------------------------
    flags = [
        ("search_flag", "FLAG{un10n_s3l3ct_m4st3r}"),
        ("blind_flag", "FLAG{bl1nd_sql1_pr0}"),
        ("api_flag", "FLAG{3rr0r_b4s3d_l34k}"),
        ("stacked_flag", "FLAG{st4ck3d_qu3ry_h4ck}"),
    ]
    for name, value in flags:
        cur.execute(
            "INSERT INTO flags (flag_name, flag_value) VALUES (?, ?)",
            (name, value),
        )

    # ---- Seed: admin_logs ------------------------------------------------
    cur.execute(
        "INSERT INTO admin_logs (action, timestamp, is_admin_visible) "
        "VALUES ('System boot sequence completed', '2087-01-15 03:22:11', 1)"
    )
    cur.execute(
        "INSERT INTO admin_logs (action, timestamp, is_admin_visible) "
        "VALUES ('Firewall rule #47 updated by admin', '2087-02-20 14:05:33', 1)"
    )
    cur.execute(
        "INSERT INTO admin_logs (action, timestamp, is_admin_visible) "
        "VALUES ('SECRET: FLAG{st4ck3d_qu3ry_h4ck} - hidden log entry', "
        "'2087-03-01 00:00:00', 0)"
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
    posts = db.execute("SELECT * FROM posts ORDER BY created_at DESC").fetchall()
    return render_template("index.html", posts=posts)


@app.route("/search")
def search():
    """
    Search posts.
    VULN: UNION-based SQL Injection.
    Extract flags via: ' UNION SELECT 1,flag_name,flag_value,4,5,6 FROM flags--
    """
    q = request.args.get("q", "")
    db = get_db()
    results = []
    error = None

    if q:
        query = f"SELECT * FROM posts WHERE title LIKE '%{q}%' OR content LIKE '%{q}%'"
        try:
            results = db.execute(query).fetchall()
        except Exception as e:
            error = str(e)

    return render_template("search.html", query=q, results=results, error=error)


@app.route("/login", methods=["GET", "POST"])
def login():
    """
    Login form.
    VULN: Authentication bypass via SQL Injection.
    Bypass: username = admin'--  password = anything
    Or:     username = ' OR 1=1--  password = anything
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
                    flag = "FLAG{4uth_byp4ss_sqli}"
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
    View a single post.
    VULN: Blind SQL Injection via post_id.
    Boolean-based: /post/1 AND 1=1  vs  /post/1 AND 1=2
    Extract flag char by char from flags table.
    """
    db = get_db()
    query = f"SELECT * FROM posts WHERE id = {post_id}"

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


@app.route("/profile")
def profile():
    """
    User profile page.
    VULN: Integer-based injection on id parameter.
    /profile?id=1  shows admin profile with secret flag in secret_note.
    Also injectable: /profile?id=1 UNION SELECT 1,2,3,4,5 FROM flags--
    """
    user_id = request.args.get("id", "1")
    db = get_db()
    error = None
    user = None

    query = f"SELECT * FROM users WHERE id = {user_id}"
    try:
        user = db.execute(query).fetchone()
    except Exception as e:
        error = f"Database error: {e}"

    return render_template("profile.html", user=user, error=error)


@app.route("/comment", methods=["POST"])
def add_comment():
    """
    Add a comment to a post.
    VULN: Second-order SQL Injection via author field in INSERT.
    The author value is concatenated directly into the INSERT statement.
    """
    post_id = request.form.get("post_id", "0")
    author = request.form.get("author", "anonymous")
    content = request.form.get("content", "")

    db = get_db()
    error = None

    query = (
        f"INSERT INTO comments (post_id, author, content) "
        f"VALUES ({post_id}, '{author}', '{content}')"
    )

    try:
        db.execute(query)
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


@app.route("/admin/logs")
def admin_logs():
    """
    Admin logs page.
    VULN: Stacked queries via sort parameter.
    Inject: ;UPDATE admin_logs SET is_admin_visible=1 WHERE 1=1--
    to reveal hidden log containing the flag.
    """
    sort = request.args.get("sort", "id")
    db = get_db()
    logs = []
    error = None

    query = f"SELECT * FROM admin_logs WHERE is_admin_visible = 1 ORDER BY {sort}"

    try:
        # executescript allows multiple statements (stacked queries)
        # We need a workaround: use the raw connection to allow multi-statement
        raw_conn = db.connection if hasattr(db, "connection") else None

        # For stacked queries to work we execute via the underlying connection
        cursor = db.cursor()
        # Split on semicolons and execute each statement
        statements = query.split(";")
        for stmt in statements[:-1]:
            stmt = stmt.strip()
            if stmt:
                cursor.execute(stmt)
                db.commit()
        # The last statement is the SELECT (or the only statement)
        last = statements[-1].strip()
        if last:
            cursor.execute(last)
            logs = cursor.fetchall()
    except Exception as e:
        error = str(e)
        # If error, try just the basic query
        try:
            logs = db.execute(
                "SELECT * FROM admin_logs WHERE is_admin_visible = 1 ORDER BY id"
            ).fetchall()
        except Exception:
            pass

    return render_template("admin.html", logs=logs, error=error, sort=sort)


@app.route("/api/posts")
def api_posts():
    """
    JSON API for posts.
    VULN: Error-based SQL Injection via category parameter.
    Errors returned in JSON with full SQL error message.
    Extractable via: ' AND 1=CAST((SELECT flag_value FROM flags LIMIT 1) AS INT)--
    """
    category = request.args.get("category", "")
    db = get_db()

    if not category:
        try:
            posts = db.execute("SELECT * FROM posts").fetchall()
            return jsonify({
                "status": "success",
                "count": len(posts),
                "posts": [
                    {
                        "id": p["id"],
                        "title": p["title"],
                        "content": p["content"],
                        "author": p["author"],
                        "category": p["category"],
                        "created_at": p["created_at"],
                    }
                    for p in posts
                ],
            })
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    query = f"SELECT * FROM posts WHERE category = '{category}'"

    try:
        posts = db.execute(query).fetchall()
        return jsonify({
            "status": "success",
            "count": len(posts),
            "posts": [
                {
                    "id": p["id"],
                    "title": p["title"],
                    "content": p["content"],
                    "author": p["author"],
                    "category": p["category"],
                    "created_at": p["created_at"],
                }
                for p in posts
            ],
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e),
            "query": query,
        }), 500


@app.route("/api/docs")
def api_docs():
    """API documentation page."""
    return render_template("api.html")


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

init_db()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=False)
