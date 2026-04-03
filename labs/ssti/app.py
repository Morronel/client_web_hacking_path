#!/usr/bin/env python3
"""
NeonGreet - SSTI (Server-Side Template Injection) Practice Lab
==============================================================
A cyberpunk greeting card / profile generator with intentional SSTI vulnerabilities.
This is an EDUCATIONAL lab for authorized security training only.

All vulnerabilities are INTENTIONAL for CTF-style learning.

Port: 5003
"""

import os
import traceback

# Set environment variable before app creation
os.environ['SSTI_FLAG'] = 'FLAG{sst1_3nv_l34k_d3bug}'

from flask import (
    Flask, request, render_template, render_template_string,
    redirect, url_for, flash
)
from markupsafe import Markup

app = Flask(__name__)
app.secret_key = 'FLAG{sst1_s3cr3t_k3y_l34k}'

# Challenge flags stored in config
app.config['FILTER_FLAG'] = 'FLAG{sst1_f1lt3r_byp4ss}'
app.config['BLIND_FLAG'] = 'FLAG{bl1nd_sst1_ch3ck}'
app.config['SANDBOX_FLAG'] = 'FLAG{sst1_0bj3ct_tr4v3rs4l}'
app.config['DEBUG_FLAG'] = 'FLAG{sst1_d3bug_m0d3}'


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
# Challenge 3: Blind SSTI — /feedback
# ---------------------------------------------------------------------------
@app.route('/feedback', methods=['GET', 'POST'])
def feedback():
    """
    Blind SSTI vulnerability.
    The rendered output is NOT shown to the user.
    Use /feedback/check?guess= to brute-force the flag character by character.
    """
    message = None
    error = False

    if request.method == 'POST':
        text = request.form.get('text', '')

        # VULNERABLE: renders user input but does NOT display the result
        template = f"""
        <div>
            Feedback received: {text}
        </div>
        """
        try:
            # Render it (side effects happen) but discard the output
            render_template_string(template)
            message = "Thank you for your feedback! Your message has been processed."
        except Exception as e:
            message = "Error processing feedback."
            error = True

    return render_template('feedback.html', message=message, error=error)


@app.route('/feedback/check')
def feedback_check():
    """
    Blind SSTI oracle endpoint.
    Accepts a 'guess' parameter and checks it against BLIND_FLAG.
    Also vulnerable to SSTI in the guess parameter itself.
    """
    guess = request.args.get('guess', '')

    # VULNERABLE: guess is injected into a template that compares against the flag
    template = (
        "{%- if config.BLIND_FLAG == '"
        + guess
        + "' -%}correct{%- else -%}wrong{%- endif -%}"
    )
    try:
        result = render_template_string(template)
        return f"""
        <div class="output-box">
            <h3>// FLAG CHECK //</h3>
            <p class="neon-text">Result: <strong>{result}</strong></p>
        </div>
        """
    except Exception as e:
        return f'<div class="error-box">Template Error: {str(e)}</div>', 500


# ---------------------------------------------------------------------------
# Challenge 4: Object Traversal SSTI — /sandbox
# ---------------------------------------------------------------------------
@app.route('/sandbox')
def sandbox():
    """
    Object traversal SSTI vulnerability.
    The word 'config' is blocked (case-insensitive), but Jinja2 object
    traversal via __class__.__mro__ or lipsum.__globals__ still works.
    """
    expr = request.args.get('expr', '')
    output = None

    if expr:
        # "Security" filter: block the word 'config'
        import re
        sanitized = re.sub(r'config', '', expr, flags=re.IGNORECASE)

        template = f"""
        <div class="output-box">
            <h3>// SANDBOX RESULT //</h3>
            <p class="neon-text">Expression evaluated:</p>
            <pre class="result-pre">{sanitized}</pre>
        </div>
        """
        try:
            output = render_template_string(template)
        except Exception as e:
            output = f'<div class="error-box">Template Error: {str(e)}</div>'

    return render_template('sandbox.html', output=output, expr=expr)


# ---------------------------------------------------------------------------
# Challenge 5: Debug Mode Leak — /debug
# ---------------------------------------------------------------------------
@app.route('/debug')
def debug_page():
    """
    Debug mode leak vulnerability.
    Intentionally triggers a Jinja2 error and displays detailed traceback
    information including environment variables and config values.
    """
    error_info = None
    config_dump = {}
    env_dump = {}

    try:
        # Intentionally trigger a Jinja2 UndefinedError
        render_template_string("{{ undefined_var.bad_attr }}")
    except Exception as e:
        # Capture full traceback
        tb = traceback.format_exc()

        # Intentionally leak config and environment
        config_dump = {
            'SECRET_KEY': app.secret_key,
            'DEBUG_FLAG': app.config.get('DEBUG_FLAG', 'N/A'),
            'FILTER_FLAG': app.config.get('FILTER_FLAG', 'N/A'),
            'BLIND_FLAG': app.config.get('BLIND_FLAG', 'N/A'),
            'SANDBOX_FLAG': app.config.get('SANDBOX_FLAG', 'N/A'),
            'SERVER_NAME': app.config.get('SERVER_NAME', 'localhost:5003'),
            'ENV': app.config.get('ENV', 'production'),
        }

        env_dump = {
            'SSTI_FLAG': os.environ.get('SSTI_FLAG', 'N/A'),
            'PATH': os.environ.get('PATH', 'N/A'),
            'HOME': os.environ.get('HOME', 'N/A'),
            'USER': os.environ.get('USER', 'N/A'),
        }

        error_info = {
            'type': type(e).__name__,
            'message': str(e),
            'traceback': tb,
        }

    return render_template(
        'debug.html',
        error_info=error_info,
        config_dump=config_dump,
        env_dump=env_dump,
    )


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
