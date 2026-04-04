#!/usr/bin/env python3
"""
NeonGreet - SSTI (Server-Side Template Injection) Practice Lab
==============================================================
A cyberpunk greeting card / profile generator with intentional SSTI vulnerabilities.
This is an EDUCATIONAL lab for authorized security training only.

All vulnerabilities are INTENTIONAL for CTF-style learning.

Port: 5003
"""

from flask import (
    Flask, request, render_template, render_template_string,
    redirect, url_for, flash
)
from markupsafe import Markup

app = Flask(__name__)
app.secret_key = 'FLAG{sst1_s3cr3t_k3y_l34k}'

# Challenge 2 flag stored in a separate config key
app.config['FILTER_FLAG'] = 'FLAG{sst1_f1lt3r_byp4ss}'


# ---------------------------------------------------------------------------
# Route: Homepage
# ---------------------------------------------------------------------------
@app.route('/')
def index():
    """Homepage with links to all challenges."""
    return render_template('index.html')


# ---------------------------------------------------------------------------
# Challenge 1: Basic SSTI — /greeting
# ---------------------------------------------------------------------------
@app.route('/greeting')
def greeting():
    """
    Basic SSTI vulnerability.
    The 'name' parameter is injected directly into a template string.
    Inject {{config.SECRET_KEY}} to retrieve the flag.
    """
    name = request.args.get('name', '')
    output = None

    if name:
        # VULNERABLE: user input directly in template string
        template = f"""
        <div class="output-box">
            <h3>// GREETING GENERATED //</h3>
            <p class="neon-text">Hello <strong>{name}</strong>! Welcome to NeonGreet.</p>
            <p class="dim-text">Your greeting card has been generated in the neon void.</p>
        </div>
        """
        try:
            output = render_template_string(template)
        except Exception as e:
            output = f'<div class="error-box">Template Error: {str(e)}</div>'

    return render_template('greeting.html', output=output, name=name)


# ---------------------------------------------------------------------------
# Challenge 2: Filter Bypass SSTI — /profile
# ---------------------------------------------------------------------------
@app.route('/profile', methods=['GET', 'POST'])
def profile():
    """
    Filter bypass SSTI vulnerability.
    The app strips {{ and }} but allows {% and %}.
    Use {%print(config.FILTER_FLAG)%} to get the flag.
    """
    output = None
    bio = ''

    if request.method == 'POST':
        bio = request.form.get('bio', '')

        # "Security" filter: strip {{ and }} — but not {% %}
        filtered_bio = bio.replace('{{', '').replace('}}', '')

        template = f"""
        <div class="output-box">
            <h3>// PROFILE RENDERED //</h3>
            <div class="profile-card">
                <div class="profile-avatar">&#9733;</div>
                <div class="profile-bio">
                    <p class="label">BIO:</p>
                    <p>{filtered_bio}</p>
                </div>
            </div>
        </div>
        """
        try:
            output = render_template_string(template)
        except Exception as e:
            output = f'<div class="error-box">Template Error: {str(e)}</div>'

    return render_template('profile.html', output=output, bio=bio)


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------
@app.errorhandler(404)
def not_found(e):
    return render_template_string("""
    {% extends "base.html" %}
    {% block title %}404 - Not Found{% endblock %}
    {% block content %}
    <div class="container">
        <div class="panel">
            <h2 class="glitch-text">404 // SIGNAL LOST</h2>
            <p>The requested endpoint does not exist in this sector.</p>
            <a href="/" class="btn">Return to Hub</a>
        </div>
    </div>
    {% endblock %}
    """), 404


@app.errorhandler(500)
def server_error(e):
    return render_template_string("""
    {% extends "base.html" %}
    {% block title %}500 - Server Error{% endblock %}
    {% block content %}
    <div class="container">
        <div class="panel">
            <h2 class="glitch-text">500 // SYSTEM MALFUNCTION</h2>
            <p>An internal error occurred. The neon grid is unstable.</p>
            <a href="/" class="btn">Return to Hub</a>
        </div>
    </div>
    {% endblock %}
    """), 500


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == '__main__':
    print(r"""
    ╔══════════════════════════════════════════════════╗
    ║   _   _                   ____                _  ║
    ║  | \ | | ___  ___  _ __ / ___|_ __ ___  ___| |_ ║
    ║  |  \| |/ _ \/ _ \| '_ | |  _| '__/ _ \/ _ | __| ║
    ║  | |\  |  __| (_) | | || |_| | | |  __/  __| |_  ║
    ║  |_| \_|\___|\___/|_| |_\____|_|  \___|\___|\__| ║
    ║                                                    ║
    ║         SSTI Practice Lab — Port 5003              ║
    ║         [!] All vulnerabilities intentional        ║
    ╚══════════════════════════════════════════════════╝
    """)
    app.run(host='0.0.0.0', port=5003, debug=False)
