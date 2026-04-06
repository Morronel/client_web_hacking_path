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

    // Unified quiz
    QuizEngine.init(container, 'vuln-xss', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'Which type of XSS is permanently stored on the server and affects every user who views the page?',
          text_uk: 'Який тип XSS постійно зберігається на сервері та впливає на кожного користувача, що переглядає сторінку?',
          options: [
            { value: 'a', label: 'Reflected XSS', label_uk: 'Reflected XSS' },
            { value: 'b', label: 'Stored XSS', label_uk: 'Stored XSS' },
            { value: 'c', label: 'DOM-based XSS', label_uk: 'DOM-based XSS' },
            { value: 'd', label: 'Self-XSS', label_uk: 'Self-XSS' }
          ],
          answer: 'b',
          hint: 'The payload persists in the database and renders for all visitors.',
          hint_uk: 'Пейлоад зберігається в базі даних та рендериться для всіх відвідувачів.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Which defense prevents JavaScript from reading session cookies?',
          text_uk: 'Який захист запобігає читанню сесійних cookies через JavaScript?',
          options: [
            { value: 'a', label: '<code>Secure</code> flag', label_uk: 'Прапорець <code>Secure</code>' },
            { value: 'b', label: '<code>SameSite</code> attribute', label_uk: 'Атрибут <code>SameSite</code>' },
            { value: 'c', label: '<code>HttpOnly</code> flag', label_uk: 'Прапорець <code>HttpOnly</code>' },
            { value: 'd', label: 'Content-Security-Policy', label_uk: 'Content-Security-Policy' }
          ],
          answer: 'c',
          hint: 'This flag makes the cookie invisible to document.cookie.',
          hint_uk: 'Цей прапорець робить cookie невидимим для document.cookie.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'In which context does the payload <code>" onfocus=alert(1) autofocus="</code> work?',
          text_uk: 'В якому контексті працює пейлоад <code>" onfocus=alert(1) autofocus="</code>?',
          options: [
            { value: 'a', label: 'HTML body context', label_uk: 'Контекст тіла HTML' },
            { value: 'b', label: 'HTML attribute context', label_uk: 'Контекст HTML-атрибуту' },
            { value: 'c', label: 'JavaScript string context', label_uk: 'Контекст рядка JavaScript' },
            { value: 'd', label: 'URL context', label_uk: 'Контекст URL' }
          ],
          answer: 'b',
          hint: 'The double-quote breaks out of an attribute value.',
          hint_uk: 'Подвійна лапка виривається зі значення атрибуту.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'A Content Security Policy with <code>unsafe-inline</code> in the <code>script-src</code> directive effectively prevents XSS.',
          text_uk: 'Content Security Policy з <code>unsafe-inline</code> у директиві <code>script-src</code> ефективно запобігає XSS.',
          answer: false,
          hint: 'unsafe-inline is the opposite — it allows inline scripts, defeating CSP\'s purpose.',
          hint_uk: 'unsafe-inline — це протилежність: він дозволяє інлайн-скрипти, зводячи нанівець призначення CSP.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'DOM-based XSS can occur even when the malicious input never reaches the server.',
          text_uk: 'DOM-based XSS може виникнути навіть коли шкідливе введення ніколи не потрапляє на сервер.',
          answer: true,
          hint: 'DOM XSS happens entirely in client-side JavaScript (e.g., location.hash → innerHTML).',
          hint_uk: 'DOM XSS відбувається повністю в клієнтському JavaScript (наприклад, location.hash → innerHTML).'
        }
      ],
      flags: [
        { id: 'f1', label: 'Flask Lab — Reflected XSS', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10 },
        { id: 'f2', label: 'Flask Lab — Stored XSS', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15 },
        { id: 'f3', label: 'Flask Lab — CSP Bypass', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20 }
      ]
    });
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
    if (messageHandler) {
      window.removeEventListener('message', messageHandler);
      messageHandler = null;
    }
    QuizEngine.cleanup('vuln-xss');
  }

  return { init, cleanup };
})();

window.vulnXss = vulnXss;
