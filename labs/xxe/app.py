from flask import Flask, request, render_template, jsonify
from lxml import etree
import os

app = Flask(__name__)

# In-memory log storage for OOB exfiltration
oob_logs = []

# Create flag files at startup
FLAGS = {
    '/app/flag.txt': 'FLAG{xx3_f1l3_r34d}',
    '/app/flag2.txt': 'FLAG{xx3_bl1nd_00b}',
    '/app/flag3.txt': 'FLAG{xx3_ssrf_ch41n}',
    '/app/flag4.txt': 'FLAG{xx3_f1lt3r_byp4ss}',
    '/app/flag5.txt': 'FLAG{xx3_svg_1nj3ct}',
}

for path, flag in FLAGS.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(flag)


# ---------------------------------------------------------------------------
# Homepage
# ---------------------------------------------------------------------------
@app.route('/')
def index():
    return render_template('index.html')


# ---------------------------------------------------------------------------
# Internal secret (localhost only) — used for SSRF challenge
# ---------------------------------------------------------------------------
@app.route('/internal/secret')
def internal_secret():
    if request.remote_addr not in ('127.0.0.1', '::1'):
        return jsonify({'error': 'Access denied — internal only'}), 403
    return jsonify({'secret': 'FLAG{xx3_ssrf_ch41n}', 'message': 'Internal API reached via SSRF'})


# ---------------------------------------------------------------------------
# OOB Log endpoints
# ---------------------------------------------------------------------------
@app.route('/log')
def log_data():
    data = request.args.get('data', '')
    if data:
        oob_logs.append(data)
    return 'OK', 200


@app.route('/log-view')
def log_view():
    return render_template('log.html', logs=oob_logs)


# ---------------------------------------------------------------------------
# Evil DTD endpoint — serves a DTD for the filter-bypass challenge
# ---------------------------------------------------------------------------
@app.route('/evil-dtd')
def evil_dtd():
    dtd = '<!ENTITY xxe SYSTEM "file:///app/flag4.txt">\n'
    return dtd, 200, {'Content-Type': 'application/xml-dtd'}


# ---------------------------------------------------------------------------
# Challenge 1: Basic XXE — /parse
# ---------------------------------------------------------------------------
@app.route('/parse', methods=['GET', 'POST'])
def parse_xml():
    result = None
    error = None
    if request.method == 'POST':
        try:
            xml_data = request.data
            parser = etree.XMLParser(resolve_entities=True, load_dtd=True, no_network=False)
            doc = etree.fromstring(xml_data, parser)
            result = doc.text or etree.tostring(doc, method='text', encoding='unicode')
        except Exception as e:
            error = str(e)
    return render_template('parse.html', result=result, error=error)


# ---------------------------------------------------------------------------
# Challenge 2: Blind XXE — /import (error-based exfiltration)
# ---------------------------------------------------------------------------
@app.route('/import', methods=['GET', 'POST'])
def import_xml():
    status = None
    error = None
    if request.method == 'POST':
        try:
            xml_data = request.data
            parser = etree.XMLParser(resolve_entities=True, load_dtd=True, no_network=False)
            doc = etree.fromstring(xml_data, parser)
            # Only show the tag name, NOT the text content (blind)
            status = f'Import successful — processed root element &lt;{doc.tag}&gt; with {len(doc)} children.'
        except Exception as e:
            # Error messages may leak entity content! (error-based XXE)
            error = str(e)
    return render_template('import.html', status=status, error=error)


# ---------------------------------------------------------------------------
# Challenge 3: XXE File Read — /validate (different file path)
# ---------------------------------------------------------------------------
@app.route('/validate', methods=['GET', 'POST'])
def validate_xml():
    """Validates XML structure and displays content. Entity resolution enabled.
    The flag is in /app/flag3.txt — a file simulating internal service data.
    Unlike ch1 which reads /app/flag.txt, this requires finding the right file."""
    result = None
    error = None
    if request.method == 'POST':
        try:
            xml_data = request.data
            parser = etree.XMLParser(resolve_entities=True, load_dtd=True, no_network=False)
            doc = etree.fromstring(xml_data, parser)
            result = doc.text or etree.tostring(doc, method='text', encoding='unicode')
        except Exception as e:
            error = str(e)
    return render_template('validate.html', result=result, error=error)


# ---------------------------------------------------------------------------
# Challenge 4: Filtered XXE — /parse-filtered
# ---------------------------------------------------------------------------
@app.route('/parse-filtered', methods=['GET', 'POST'])
def parse_filtered():
    result = None
    error = None
    if request.method == 'POST':
        try:
            xml_data = request.data
            raw_text = xml_data.decode('utf-8', errors='ignore')
            # "Security" filter: block direct /app/ path access and traversal
            # Bypass: use /proc/self/cwd/ symlink to reach /app/ indirectly
            if '/app/' in raw_text or '../' in raw_text:
                error = 'Blocked: direct /app/ paths and traversal sequences not allowed.'
            else:
                parser = etree.XMLParser(resolve_entities=True, load_dtd=True, no_network=False)
                doc = etree.fromstring(xml_data, parser)
                result = doc.text or etree.tostring(doc, method='text', encoding='unicode')
        except Exception as e:
            error = str(e)
    return render_template('filter.html', result=result, error=error)


# ---------------------------------------------------------------------------
# Challenge 5: SVG Upload XXE — /svg-upload
# ---------------------------------------------------------------------------
@app.route('/svg-upload', methods=['GET', 'POST'])
def svg_upload():
    result = None
    error = None
    if request.method == 'POST':
        try:
            uploaded = request.files.get('svg')
            if not uploaded:
                error = 'No file uploaded.'
            else:
                xml_data = uploaded.read()
                parser = etree.XMLParser(resolve_entities=True, load_dtd=True, no_network=False)
                doc = etree.fromstring(xml_data, parser)
                # Extract text content from SVG <text> elements
                ns = {'svg': 'http://www.w3.org/2000/svg'}
                texts = doc.findall('.//svg:text', ns)
                if texts:
                    result = ' '.join(t.text or '' for t in texts)
                else:
                    # Fallback: all text content
                    result = etree.tostring(doc, method='text', encoding='unicode')
        except Exception as e:
            error = str(e)
    return render_template('svg.html', result=result, error=error)


# ---------------------------------------------------------------------------
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5012, debug=False)
