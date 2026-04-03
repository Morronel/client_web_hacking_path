/* ============================================
   Module 5: Cross-Site Scripting (XSS)
   ============================================ */

const vulnXss = (() => {
  let listeners = [];
  let messageHandler = null;

  function listen(el, evt, fn) {
    el.addEventListener(evt, fn);
    listeners.push({ el, evt, fn });
  }

  // Base srcdoc wrapper — overrides alert() to postMessage
  function wrapSrcdoc(bodyHtml, labId) {
    return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: -apple-system, sans-serif; padding: 16px; margin: 0; background: #fff; color: #24292e; font-size: 14px; }
  input { padding: 6px 10px; border: 1px solid #d0d7de; border-radius: 4px; font-size: 14px; }
  h2 { font-size: 18px; color: #24292e; }
  p { color: #57606a; }
</style>
</head>
<body>
<script>
  // Override alert to communicate with parent
  window.alert = function(msg) {
    parent.postMessage({ type: 'xss-success', lab: '${labId}', message: String(msg) }, '*');
  };
  window.confirm = function(msg) {
    parent.postMessage({ type: 'xss-success', lab: '${labId}', message: String(msg) }, '*');
    return true;
  };
  window.prompt = function(msg) {
    parent.postMessage({ type: 'xss-success', lab: '${labId}', message: String(msg) }, '*');
    return '';
  };
</script>
${bodyHtml}
</body>
</html>`;
  }

  function createIframe(container, srcdoc) {
    container.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('srcdoc', srcdoc);
    iframe.style.width = '100%';
    iframe.style.minHeight = '200px';
    iframe.style.border = 'none';
    iframe.style.background = '#fff';
    container.appendChild(iframe);
    return iframe;
  }

  // Lab 1: Reflected XSS — HTML body
  function buildLab1(input) {
    return wrapSrcdoc(`
      <h2>Search Results</h2>
      <p>Showing results for: ${input}</p>
      <p style="color:#8b949e;">No results found.</p>
    `, 'lab1');
  }

  // Lab 2: Attribute context
  function buildLab2(input) {
    return wrapSrcdoc(`
      <h2>User Profile</h2>
      <p>Edit your display name:</p>
      <input type="text" value="${input}" id="display-name">
      <p style="color:#8b949e;margin-top:12px;">Current value is shown in the input field above.</p>
    `, 'lab2');
  }

  // Lab 3: JS string context
  function buildLab3(input) {
    return wrapSrcdoc(`
      <h2>Welcome Page</h2>
      <div id="greeting"></div>
      <script>
        var name = '${input}';
        document.getElementById('greeting').textContent = 'Hello, ' + name + '!';
      </script>
    `, 'lab3');
  }

  // Lab 4: Filter bypass — strip <script> tags
  function buildLab4(input) {
    const filtered = input.replace(/<\/?script[^>]*>/gi, '');
    return wrapSrcdoc(`
      <h2>Comments Section</h2>
      <div class="comment">
        <p><strong>User123:</strong></p>
        <div>${filtered}</div>
      </div>
    `, 'lab4');
  }

  // Lab 5: DOM XSS
  function buildLab5(input) {
    return wrapSrcdoc(`
      <h2>Dashboard</h2>
      <div id="greeting"></div>
      <p style="color:#8b949e;">Your personalized dashboard.</p>
      <script>
        // Simulating: var params = new URLSearchParams(window.location.search);
        // var name = params.get('name') || 'Guest';
        var name = ${JSON.stringify(input || 'Guest')};
        document.getElementById('greeting').innerHTML = 'Welcome, ' + name + '!';
      </script>
    `, 'lab5');
  }

  function init(container) {
    const labBuilders = {
      lab1: { build: buildLab1, input: '#xss1-input', btn: '#xss1-btn', frame: '#xss1-frame-container' },
      lab2: { build: buildLab2, input: '#xss2-input', btn: '#xss2-btn', frame: '#xss2-frame-container' },
      lab3: { build: buildLab3, input: '#xss3-input', btn: '#xss3-btn', frame: '#xss3-frame-container' },
      lab4: { build: buildLab4, input: '#xss4-input', btn: '#xss4-btn', frame: '#xss4-frame-container' },
      lab5: { build: buildLab5, input: '#xss5-input', btn: '#xss5-btn', frame: '#xss5-frame-container' }
    };

    // Setup message listener for XSS success detection
    messageHandler = (event) => {
      if (event.data && event.data.type === 'xss-success') {
        const labId = event.data.lab;
        const banner = Utils.$(`#${labId}-banner`, container);
        const status = Utils.$(`#${labId}-status`, container);
        if (banner) banner.classList.add('visible');
        if (status) {
          status.textContent = '✓ Completed';
          status.classList.add('solved');
        }
        Router.markLabComplete('vuln-xss', labId);
      }
    };
    window.addEventListener('message', messageHandler);

    // Initialize each lab
    for (const [labId, config] of Object.entries(labBuilders)) {
      const inputEl = Utils.$(config.input, container);
      const btnEl = Utils.$(config.btn, container);
      const frameContainer = Utils.$(config.frame, container);
      const statusEl = Utils.$(`#${labId}-status`, container);

      if (Storage.isLabCompleted('vuln-xss', labId)) {
        statusEl.textContent = '✓ Completed';
        statusEl.classList.add('solved');
      }

      // Initial safe iframe
      createIframe(frameContainer, config.build(''));

      listen(btnEl, 'click', () => {
        const srcdoc = config.build(inputEl.value);
        createIframe(frameContainer, srcdoc);
      });

      listen(inputEl, 'keydown', (e) => {
        if (e.key === 'Enter') btnEl.click();
      });
    }
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
    if (messageHandler) {
      window.removeEventListener('message', messageHandler);
      messageHandler = null;
    }
  }

  return { init, cleanup };
})();

window.vulnXss = vulnXss;
