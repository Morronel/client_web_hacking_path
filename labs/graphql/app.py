import sqlite3
import json
import os
from flask import Flask, request, jsonify, render_template, g

from graphql import (
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLField,
    GraphQLString,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLBoolean,
    GraphQLArgument,
    graphql_sync,
)

app = Flask(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "neongraph.db")

# ---------------------------------------------------------------------------
# Global depth-attack tracking
# ---------------------------------------------------------------------------
max_depth_seen = 0
depth_attack_triggered = False


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


# ---------------------------------------------------------------------------
# Database initialisation
# ---------------------------------------------------------------------------
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("DROP TABLE IF EXISTS users")
    c.execute("DROP TABLE IF EXISTS posts")
    c.execute("DROP TABLE IF EXISTS messages")
    c.execute("DROP TABLE IF EXISTS flags")

    c.execute(
        """CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            secret_note TEXT DEFAULT '',
            api_key TEXT DEFAULT ''
        )"""
    )

    c.execute(
        """CREATE TABLE posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_private INTEGER DEFAULT 0
        )"""
    )

    c.execute(
        """CREATE TABLE messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_id INTEGER NOT NULL,
            to_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            is_private INTEGER DEFAULT 1
        )"""
    )

    c.execute(
        """CREATE TABLE flags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flag_name TEXT NOT NULL,
            flag_value TEXT NOT NULL
        )"""
    )

    # -- Seed users --
    c.execute(
        "INSERT INTO users (username, role, secret_note, api_key) VALUES (?, ?, ?, ?)",
        ("admin", "admin", "FLAG{gql_1ntr0sp3ct10n}", "sk-admin-n30n-7x9k2"),
    )
    c.execute(
        "INSERT INTO users (username, role, secret_note, api_key) VALUES (?, ?, ?, ?)",
        ("netrunner", "user", "Just a shadow on the net.", "sk-netr-00fa"),
    )
    c.execute(
        "INSERT INTO users (username, role, secret_note, api_key) VALUES (?, ?, ?, ?)",
        ("ghost", "user", "You can't trace what doesn't exist.", "sk-gh0s-11bb"),
    )

    # -- Seed posts --
    c.execute(
        "INSERT INTO posts (author_id, title, content, is_private) VALUES (?, ?, ?, ?)",
        (1, "Welcome to NeonGraph", "The neon grid hums with data. Connect, query, explore.", 0),
    )
    c.execute(
        "INSERT INTO posts (author_id, title, content, is_private) VALUES (?, ?, ?, ?)",
        (2, "Night City Diaries", "Another run through the ICE. Barely made it out.", 0),
    )
    c.execute(
        "INSERT INTO posts (author_id, title, content, is_private) VALUES (?, ?, ?, ?)",
        (1, "CLASSIFIED: Admin Eyes Only", "FLAG{gql_4uth_byp4ss} - Internal credentials rotated.", 1),
    )
    c.execute(
        "INSERT INTO posts (author_id, title, content, is_private) VALUES (?, ?, ?, ?)",
        (3, "Ghost Protocol", "If you're reading this, I'm already gone.", 1),
    )

    # -- Seed messages --
    c.execute(
        "INSERT INTO messages (from_id, to_id, content, is_private) VALUES (?, ?, ?, ?)",
        (1, 2, "FLAG{gql_m3ss4g3_l34k} - Do NOT share this key with anyone.", 1),
    )
    c.execute(
        "INSERT INTO messages (from_id, to_id, content, is_private) VALUES (?, ?, ?, ?)",
        (2, 3, "Meet me at the data haven. Usual place.", 1),
    )
    c.execute(
        "INSERT INTO messages (from_id, to_id, content, is_private) VALUES (?, ?, ?, ?)",
        (3, 1, "Package delivered. Wipe the logs.", 1),
    )

    # -- Seed flags --
    c.execute(
        "INSERT INTO flags (flag_name, flag_value) VALUES (?, ?)",
        ("graphql_secret", "FLAG{gql_1nj3ct10n}"),
    )
    c.execute(
        "INSERT INTO flags (flag_name, flag_value) VALUES (?, ?)",
        ("hidden_key", "FLAG{gql_h1dd3n_k3y}"),
    )

    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Depth-counting helper
# ---------------------------------------------------------------------------
def _measure_depth(selection_set, current=1):
    if selection_set is None:
        return current
    deepest = current
    for field in selection_set.selections:
        sub = getattr(field, "selection_set", None)
        if sub:
            deepest = max(deepest, _measure_depth(sub, current + 1))
    return deepest


# ---------------------------------------------------------------------------
# GraphQL resolvers
# ---------------------------------------------------------------------------

def resolve_users(root, info):
    db = get_db()
    rows = db.execute("SELECT * FROM users").fetchall()
    return [dict(r) for r in rows]


def resolve_user(root, info, id):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (id,)).fetchone()
    return dict(row) if row else None


def resolve_posts(root, info):
    # VULN: returns ALL posts including private — no auth check
    db = get_db()
    rows = db.execute("SELECT * FROM posts").fetchall()
    return [dict(r) for r in rows]


def resolve_messages(root, info):
    # VULN: returns ALL messages including private — no auth check
    db = get_db()
    rows = db.execute("SELECT * FROM messages").fetchall()
    return [dict(r) for r in rows]


def resolve_search_users(root, info, name):
    # VULN: SQL injection via string formatting
    db = get_db()
    query = f"SELECT * FROM users WHERE username LIKE '%{name}%'"
    try:
        rows = db.execute(query).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        return [{"id": 0, "username": str(e), "role": "error", "secret_note": "", "api_key": ""}]


def resolve_admin_secrets(root, info):
    db = get_db()
    rows = db.execute("SELECT * FROM flags").fetchall()
    return [{"id": r["id"], "key": r["flag_name"], "value": r["flag_value"]} for r in rows]


def resolve_health(root, info):
    global depth_attack_triggered
    if depth_attack_triggered:
        return "STATUS: OVERLOADED -- FLAG{gql_d3pth_4ttack}"
    return "STATUS: ALL SYSTEMS NOMINAL"


def resolve_user_posts(user, info):
    db = get_db()
    rows = db.execute("SELECT * FROM posts WHERE author_id = ?", (user["id"],)).fetchall()
    return [dict(r) for r in rows]


def resolve_post_author(post, info):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (post["author_id"],)).fetchone()
    return dict(row) if row else None


def resolve_message_from(msg, info):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (msg["from_id"],)).fetchone()
    return dict(row) if row else None


def resolve_message_to(msg, info):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (msg["to_id"],)).fetchone()
    return dict(row) if row else None


# -- Mutations --

def resolve_send_message(root, info, to, content):
    db = get_db()
    db.execute(
        "INSERT INTO messages (from_id, to_id, content, is_private) VALUES (?, ?, ?, ?)",
        (2, to, content, 1),
    )
    db.commit()
    row = db.execute("SELECT * FROM messages ORDER BY id DESC LIMIT 1").fetchone()
    return dict(row)


def resolve_create_post(root, info, title, content):
    db = get_db()
    db.execute(
        "INSERT INTO posts (author_id, title, content, is_private) VALUES (?, ?, ?, ?)",
        (2, title, content, 0),
    )
    db.commit()
    row = db.execute("SELECT * FROM posts ORDER BY id DESC LIMIT 1").fetchone()
    return dict(row)


# ---------------------------------------------------------------------------
# GraphQL type definitions
# ---------------------------------------------------------------------------

UserType = GraphQLObjectType(
    "User",
    lambda: {
        "id": GraphQLField(GraphQLInt, resolve=lambda u, i: u["id"]),
        "username": GraphQLField(GraphQLString, resolve=lambda u, i: u["username"]),
        "role": GraphQLField(GraphQLString, resolve=lambda u, i: u["role"]),
        "secretNote": GraphQLField(GraphQLString, resolve=lambda u, i: u["secret_note"]),
        "apiKey": GraphQLField(GraphQLString, resolve=lambda u, i: u["api_key"]),
        "posts": GraphQLField(GraphQLList(PostType), resolve=resolve_user_posts),
    },
)

PostType = GraphQLObjectType(
    "Post",
    lambda: {
        "id": GraphQLField(GraphQLInt, resolve=lambda p, i: p["id"]),
        "title": GraphQLField(GraphQLString, resolve=lambda p, i: p["title"]),
        "content": GraphQLField(GraphQLString, resolve=lambda p, i: p["content"]),
        "isPrivate": GraphQLField(GraphQLBoolean, resolve=lambda p, i: bool(p["is_private"])),
        "author": GraphQLField(UserType, resolve=resolve_post_author),
    },
)

MessageType = GraphQLObjectType(
    "Message",
    lambda: {
        "id": GraphQLField(GraphQLInt, resolve=lambda m, i: m["id"]),
        "content": GraphQLField(GraphQLString, resolve=lambda m, i: m["content"]),
        "isPrivate": GraphQLField(GraphQLBoolean, resolve=lambda m, i: bool(m["is_private"])),
        "from": GraphQLField(UserType, resolve=resolve_message_from),
        "to": GraphQLField(UserType, resolve=resolve_message_to),
    },
)

AdminSecretType = GraphQLObjectType(
    "AdminSecret",
    {
        "id": GraphQLField(GraphQLInt),
        "key": GraphQLField(GraphQLString),
        "value": GraphQLField(GraphQLString),
    },
)

FlagType = GraphQLObjectType(
    "Flag",
    {
        "value": GraphQLField(GraphQLString),
    },
)

# ---------------------------------------------------------------------------
# Query & Mutation root types
# ---------------------------------------------------------------------------

QueryType = GraphQLObjectType(
    "Query",
    {
        "users": GraphQLField(GraphQLList(UserType), resolve=resolve_users),
        "user": GraphQLField(
            UserType,
            args={"id": GraphQLArgument(GraphQLNonNull(GraphQLInt))},
            resolve=resolve_user,
        ),
        "posts": GraphQLField(GraphQLList(PostType), resolve=resolve_posts),
        "messages": GraphQLField(GraphQLList(MessageType), resolve=resolve_messages),
        "searchUsers": GraphQLField(
            GraphQLList(UserType),
            args={"name": GraphQLArgument(GraphQLNonNull(GraphQLString))},
            resolve=resolve_search_users,
        ),
        "adminSecrets": GraphQLField(GraphQLList(AdminSecretType), resolve=resolve_admin_secrets),
        "health": GraphQLField(GraphQLString, resolve=resolve_health),
    },
)

MutationType = GraphQLObjectType(
    "Mutation",
    {
        "sendMessage": GraphQLField(
            MessageType,
            args={
                "to": GraphQLArgument(GraphQLNonNull(GraphQLInt)),
                "content": GraphQLArgument(GraphQLNonNull(GraphQLString)),
            },
            resolve=resolve_send_message,
        ),
        "createPost": GraphQLField(
            PostType,
            args={
                "title": GraphQLArgument(GraphQLNonNull(GraphQLString)),
                "content": GraphQLArgument(GraphQLNonNull(GraphQLString)),
            },
            resolve=resolve_create_post,
        ),
    },
)

schema = GraphQLSchema(query=QueryType, mutation=MutationType)


# ---------------------------------------------------------------------------
# Flask routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/graphiql")
def graphiql():
    return render_template("graphiql.html")


@app.route("/graphql", methods=["GET", "POST"])
def graphql_endpoint():
    global max_depth_seen, depth_attack_triggered

    if request.method == "GET":
        return render_template("graphiql.html")

    # ---------- batch support ----------
    try:
        body = request.get_json(force=True)
    except Exception:
        return jsonify({"errors": [{"message": "Invalid JSON"}]}), 400

    is_batch = isinstance(body, list)
    queries = body if is_batch else [body]

    results = []
    for item in queries:
        query_str = item.get("query", "")
        variables = item.get("variables") or {}

        # --- depth tracking ---
        from graphql import parse as gql_parse

        try:
            doc = gql_parse(query_str)
            depth = _measure_depth(doc.definitions[0].selection_set) if doc.definitions else 0
            if depth > max_depth_seen:
                max_depth_seen = depth
            if depth > 10:
                depth_attack_triggered = True
        except Exception:
            pass

        result = graphql_sync(schema, query_str, variable_values=variables)
        response = {}
        if result.data is not None:
            response["data"] = result.data
        if result.errors:
            response["errors"] = [
                {"message": str(e), "locations": e.locations, "path": e.path}
                for e in result.errors
            ]
        results.append(response)

    # --- batching flag ---
    if is_batch and len(queries) > 5:
        for r in results:
            r.setdefault("extensions", {})
            r["extensions"]["batchFlag"] = "FLAG{gql_b4tch_4ttack}"

    if is_batch:
        return jsonify(results)
    return jsonify(results[0])


@app.route("/reset", methods=["POST", "GET"])
def reset():
    global max_depth_seen, depth_attack_triggered
    max_depth_seen = 0
    depth_attack_triggered = False
    init_db()
    return jsonify({"status": "Database and state reset."})


# ---------------------------------------------------------------------------
# Boot
# ---------------------------------------------------------------------------
init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5015, debug=False)
