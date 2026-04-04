from flask import Flask, request, render_template, jsonify
from lxml import etree
import os

app = Flask(__name__)

# Create flag files at startup
FLAGS = {
    '/app/flag.txt': 'FLAG{xx3_f1l3_r34d}',
    '/app/flag2.txt': 'FLAG{xx3_svg_1nj3ct}',
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
# Challenge 2: SVG Upload XXE — /svg-upload
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
