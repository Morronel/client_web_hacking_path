"""
NeonDocs - Corporate Document Viewer
Path Traversal Vulnerability Lab (Port 5009)

A cyberpunk-themed Flask application with 3 intentional path traversal
vulnerabilities for security education purposes.
"""

import os
import urllib.parse
from flask import Flask, request, render_template, jsonify

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Startup: create directory structure and flag files
# ---------------------------------------------------------------------------
BASE = "/app"

DIRS = [
    f"{BASE}/documents/public",
    f"{BASE}/documents/shared",
    f"{BASE}/documents/archive",
    f"{BASE}/documents/private",
    f"{BASE}/secret",
]

FILES = {
    # Public documents (used by ch1)
    f"{BASE}/documents/public/readme.txt": (
        "=== NeonDocs README ===\n"
        "Welcome to NeonDocs v3.7 - MegaCorp's internal document viewer.\n"
        "All employees are required to use this portal for file access.\n"
        "Unauthorized access to classified sectors will be logged.\n"
        "-- SysAdmin Division, Neo-Tokyo Branch\n"
    ),
    f"{BASE}/documents/public/report.txt": (
        "=== Q4 Revenue Report ===\n"
        "Sector 7-G cybernetic implant sales: +340%\n"
        "Neural link subscriptions: 12.4 million active users\n"
        "Black-market suppression ops budget: [REDACTED]\n"
        "Net profit: 8.7 billion credits\n"
    ),
    f"{BASE}/documents/public/manual.txt": (
        "=== NeonDocs User Manual ===\n"
        "1. Browse documents using the /view endpoint.\n"
        "2. Download files via /download.\n"
        "3. Do NOT attempt to access restricted sectors.\n"
        "4. Violators will be reported to CorpSec.\n"
    ),
    # Shared documents (used by ch2 /view-filtered)
    f"{BASE}/documents/shared/memo.txt": (
        "=== SHARED MEMO ===\n"
        "Team sync scheduled for Friday 1400h.\n"
        "All clearance-level-3 personnel must attend.\n"
    ),
    # Archive documents (used by ch3 /download)
    f"{BASE}/documents/archive/changelog.txt": (
        "=== NeonDocs Changelog ===\n"
        "v3.7 - Added download endpoint\n"
        "v3.6 - Fixed XSS in viewer\n"
        "v3.5 - Initial deployment\n"
    ),
    # Private documents
    f"{BASE}/documents/private/internal.txt": (
        "=== INTERNAL MEMO ===\n"
        "Project Chimera status: Phase 3 initiated.\n"
        "All neural implant test subjects show 97% compatibility.\n"
        "Side effects deemed 'acceptable' by ethics board.\n"
        "Continue deployment in Sector 9.\n"
    ),
    f"{BASE}/documents/private/credentials.txt": (
        "=== SERVICE CREDENTIALS ===\n"
        "Database: neo_mainframe // Pass: Neur0L1nk!2087\n"
        "Admin Panel: admin@megacorp // Pass: Ch1m3r4_Pr0j3ct\n"
        "Backup Server: bkp-node-7 // Key: xK9#mZ2$vQ8\n"
    ),
    # Flags at different paths
    f"{BASE}/secret/flag.txt": "FLAG{tr4v3rs4l_b4s1c}",
    f"{BASE}/secret/flag2.txt": "FLAG{tr4v3rs4l_3nc0d1ng}",
    f"{BASE}/secret/flag3.txt": "FLAG{tr4v3rs4l_3v4s10n}",
}


def setup_files():
    """Create lab directory structure and populate files."""
    for d in DIRS:
        os.makedirs(d, exist_ok=True)
    for path, content in FILES.items():
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(content)


setup_files()

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/hints")
def hints():
    return render_template("hints.html")


# ---- Challenge 1: Basic Path Traversal ------------------------------------
@app.route("/view")
def view_file():
    file = request.args.get("file", "")
    if not file:
        return render_template("view.html", challenge=1, error="No file parameter provided.")
    try:
        path = f"documents/public/{file}"
        with open(path, "r") as f:
            content = f.read()
        return render_template("view.html", challenge=1, filename=file, content=content)
    except Exception as e:
        return render_template("view.html", challenge=1, error=f"Could not read file: {e}")


# ---- Challenge 2: Single-Pass Filter Bypass (was Ch3) ---------------------
@app.route("/view-filtered")
def view_filtered():
    file = request.args.get("file", "")
    if not file:
        return render_template("view.html", challenge=2, error="No file parameter provided.")
    try:
        # "Security" filter: strip ../ (single pass only!)
        sanitized = file.replace("../", "")
        path = f"documents/shared/{sanitized}"
        with open(path, "r") as f:
            content = f.read()
        return render_template("view.html", challenge=2, filename=file, content=content)
    except Exception as e:
        return render_template("view.html", challenge=2, error=f"Could not read file: {e}")


# ---- Challenge 3: URL-Encoding Evasion (was Ch4) --------------------------
@app.route("/download")
def download():
    path_param = request.args.get("path", "")
    if not path_param:
        return render_template("view.html", challenge=3, error="No path parameter provided.")

    # "Security" check on the raw parameter BEFORE decoding
    if ".." in path_param or "/etc" in path_param:
        return render_template("view.html", challenge=3,
                               error="Blocked: path traversal characters detected!")

    # Decode AFTER the check -- the vulnerability
    decoded = urllib.parse.unquote(path_param)
    try:
        full_path = f"documents/archive/{decoded}"
        with open(full_path, "r") as f:
            content = f.read()
        return render_template("view.html", challenge=3, filename=decoded, content=content)
    except Exception as e:
        return render_template("view.html", challenge=3, error=f"Could not read file: {e}")


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5009, debug=False)
