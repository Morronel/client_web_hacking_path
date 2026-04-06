/* ============================================
   Module 7: Cookie Inspection & Manipulation
   ============================================ */

const introCookies = (() => {
  let listeners = [];
  let sessionData = null;

  function listen(el, evt, fn) {
    el.addEventListener(evt, fn);
    listeners.push({ el, evt, fn });
  }

  // Simulated cookie — we use an in-memory object since document.cookie
  // has limitations on file:// and sandbox contexts
  const simulatedCookie = {
    name: 'session',
    value: '', // set on login
    domain: '.webapp.local',
    path: '/',
    expires: 'Session',
    secure: false,
    httpOnly: false,
    sameSite: 'None'
  };

  const defaultSession = { user: 'guest', role: 'user', id: 42 };

  function initLab1(container) {
    const loginBtn = Utils.$('#cookie-login-btn', container);
    const inspectorEl = Utils.$('#cookie-inspector', container);
    const detailsEl = Utils.$('#cookie-details', container);
    const decodedEl = Utils.$('#cookie-decoded', container);
    const flagsInput = Utils.$('#cookie-flags-answer', container);
    const flagsSubmit = Utils.$('#cookie-flags-submit', container);
    const bannerEl = Utils.$('#lab1-banner', container);
    const errorBanner = Utils.$('#lab1-error-banner', container);
    const statusEl = Utils.$('#lab1-status', container);

    if (Storage.isLabCompleted('intro-cookies', 'lab1')) {
      statusEl.textContent = '✓ Completed';
      statusEl.classList.add('solved');
    }

    listen(loginBtn, 'click', () => {
      // Set the simulated cookie
      sessionData = { ...defaultSession };
      simulatedCookie.value = Utils.base64Encode(JSON.stringify(sessionData));

      inspectorEl.style.display = 'block';
      loginBtn.textContent = 'Cookie Set ✓';
      loginBtn.disabled = true;

      // Render cookie details
      const attrs = [
        ['Name', simulatedCookie.name, '<span class="text-muted">—</span>'],
        ['Value', `<code style="word-break:break-all;">${Utils.escapeHtml(simulatedCookie.value)}</code>`, '<span class="text-amber">Base64 encoded (not encrypted!)</span>'],
        ['Domain', simulatedCookie.domain, '<span class="text-muted">OK</span>'],
        ['Path', simulatedCookie.path, '<span class="text-muted">OK</span>'],
        ['Expires', simulatedCookie.expires, '<span class="text-muted">Session cookie</span>'],
        ['Secure', `<span class="cookie-flag missing">Not Set</span>`, '<span class="text-red">Cookie sent over HTTP — vulnerable to interception</span>'],
        ['HttpOnly', `<span class="cookie-flag missing">Not Set</span>`, '<span class="text-red">Accessible via JavaScript — vulnerable to XSS theft</span>'],
        ['SameSite', simulatedCookie.sameSite, '<span class="text-amber">None without Secure — CSRF vulnerable</span>']
      ];

      detailsEl.innerHTML = attrs.map(([attr, val, assessment]) =>
        `<tr><td><strong>${attr}</strong></td><td>${val}</td><td>${assessment}</td></tr>`
      ).join('');

      // Show decoded value
      decodedEl.innerHTML = Utils.highlightJson(sessionData);
    });

    listen(flagsSubmit, 'click', () => {
      const answer = flagsInput.value.toLowerCase().replace(/\s+/g, '').split(',').filter(Boolean).sort();
      const expected = ['httponly', 'secure'];

      if (JSON.stringify(answer) === JSON.stringify(expected)) {
        bannerEl.classList.add('visible');
        errorBanner.classList.remove('visible');
        Router.markLabComplete('intro-cookies', 'lab1');
        statusEl.textContent = '✓ Completed';
        statusEl.classList.add('solved');
      } else {
        errorBanner.classList.add('visible');
        bannerEl.classList.remove('visible');
      }
    });
  }

  function initLab2(container) {
    const cookieValueEl = Utils.$('#current-cookie-value', container);
    const jsonEditor = Utils.$('#cookie-edit-json', container);
    const b64Output = Utils.$('#cookie-edit-b64', container);
    const encodeBtn = Utils.$('#cookie-encode-btn', container);
    const setBtn = Utils.$('#cookie-set-btn', container);
    const adminPanel = Utils.$('#admin-panel', container);
    const bannerEl = Utils.$('#lab2-banner', container);
    const statusEl = Utils.$('#lab2-status', container);

    if (Storage.isLabCompleted('intro-cookies', 'lab2')) {
      statusEl.textContent = '✓ Completed';
      statusEl.classList.add('solved');
    }

    // Initialize with guest session
    const guestSession = { user: 'guest', role: 'user' };
    const cookieB64 = Utils.base64Encode(JSON.stringify(guestSession));
    cookieValueEl.textContent = cookieB64;
    jsonEditor.value = JSON.stringify(guestSession, null, 2);

    listen(encodeBtn, 'click', () => {
      try {
        const parsed = JSON.parse(jsonEditor.value);
        const encoded = Utils.base64Encode(JSON.stringify(parsed));
        b64Output.value = encoded;
      } catch (err) {
        b64Output.value = 'Invalid JSON!';
      }
    });

    listen(setBtn, 'click', () => {
      const b64 = b64Output.value;
      if (!b64) {
        adminPanel.innerHTML = '<span style="color:var(--accent-red);">Encode your JSON first (Step 2).</span>';
        return;
      }

      try {
        const decoded = JSON.parse(Utils.base64Decode(b64));
        cookieValueEl.textContent = b64;

        if (decoded.role === 'admin') {
          adminPanel.innerHTML =
            '<span style="color:var(--accent-green);font-weight:bold;">&#9989; ACCESS GRANTED</span>\n\n' +
            '<span style="color:var(--accent-green);">Welcome to the Admin Panel</span>\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            'Total Users: 1,247\n' +
            'Active Sessions: 89\n' +
            'Server Status: Online\n' +
            'Admin API Key: sk-admin-9f8e7d6c5b4a\n' +
            '\nFlag: COOKIE{r0l3_3sc4l4t10n_v1a_b64}';
          bannerEl.classList.add('visible');
          Router.markLabComplete('intro-cookies', 'lab2');
          statusEl.textContent = '✓ Completed';
          statusEl.classList.add('solved');
        } else {
          adminPanel.innerHTML =
            `<span style="color:var(--accent-red);">Access Denied</span>\n` +
            `Current role: "${Utils.escapeHtml(decoded.role || 'unknown')}"\n` +
            'You must be an admin to view this panel.';
        }
      } catch (err) {
        adminPanel.innerHTML = '<span style="color:var(--accent-red);">Error decoding cookie: ' +
          Utils.escapeHtml(err.message) + '</span>';
      }
    });

    // Auto-decode on JSON edit
    listen(jsonEditor, 'input', () => {
      try {
        JSON.parse(jsonEditor.value);
        jsonEditor.style.borderColor = 'var(--accent-green)';
      } catch {
        jsonEditor.style.borderColor = 'var(--accent-red)';
      }
    });
  }

  function init(container) {
    initLab1(container);
    initLab2(container);

    QuizEngine.init(container, 'intro-cookies', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What does the HttpOnly cookie flag prevent?',
          text_uk: 'Чому запобігає прапорець HttpOnly у cookie?',
          options: [
            { value: 'a', label: 'The cookie from being sent over HTTP', label_uk: 'Надсиланню cookie через HTTP' },
            { value: 'b', label: 'JavaScript from accessing the cookie via document.cookie', label_uk: 'Доступу JavaScript до cookie через document.cookie' },
            { value: 'c', label: 'The cookie from being stored on disk', label_uk: 'Збереженню cookie на диску' },
            { value: 'd', label: 'Cross-site requests from including the cookie', label_uk: 'Включенню cookie в міжсайтові запити' }
          ],
          answer: 'b',
          hint: 'This flag is specifically about restricting client-side script access.',
          hint_uk: 'Цей прапорець саме про обмеження доступу клієнтських скриптів.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'What does the Secure flag on a cookie do?',
          text_uk: 'Що робить прапорець Secure на cookie?',
          options: [
            { value: 'a', label: 'Encrypts the cookie value', label_uk: 'Шифрує значення cookie' },
            { value: 'b', label: 'Prevents JavaScript access to the cookie', label_uk: 'Запобігає доступу JavaScript до cookie' },
            { value: 'c', label: 'Ensures the cookie is only sent over HTTPS connections', label_uk: 'Забезпечує, що cookie надсилається тільки через HTTPS-з\'єднання' },
            { value: 'd', label: 'Makes the cookie expire after the session ends', label_uk: 'Робить cookie протухлим після завершення сесії' }
          ],
          answer: 'c',
          hint: 'This flag controls the transport channel, not the cookie contents.',
          hint_uk: 'Цей прапорець контролює канал передачі, а не вміст cookie.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'Setting SameSite=Strict on a cookie prevents it from being sent with any cross-site requests.',
          text_uk: 'Встановлення SameSite=Strict на cookie запобігає його надсиланню з будь-якими міжсайтовими запитами.',
          answer: true,
          hint: 'Strict mode blocks the cookie on all cross-site navigations.',
          hint_uk: 'Режим Strict блокує cookie при всіх міжсайтових навігаціях.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'Why is storing session data in a Base64-encoded cookie (without server-side validation) dangerous?',
          text_uk: 'Чому зберігання даних сесії в Base64-кодованому cookie (без серверної валідації) є небезпечним?',
          options: [
            { value: 'a', label: 'Base64 is too slow for real-time decoding', label_uk: 'Base64 занадто повільний для декодування в реальному часі' },
            { value: 'b', label: 'Attackers can decode, modify, and re-encode the cookie to escalate privileges', label_uk: 'Зловмисники можуть декодувати, змінити та перекодувати cookie для підвищення привілеїв' },
            { value: 'c', label: 'Base64 cookies are too large for browsers to store', label_uk: 'Base64 cookies занадто великі для зберігання в браузері' },
            { value: 'd', label: 'It violates the HTTP specification', label_uk: 'Це порушує специфікацію HTTP' }
          ],
          answer: 'b',
          hint: 'Base64 is encoding, not encryption — anyone can decode and tamper with it.',
          hint_uk: 'Base64 — це кодування, а не шифрування — будь-хто може декодувати та змінити його.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'A session cookie (one without an explicit Expires or Max-Age) is deleted when the browser is closed.',
          text_uk: 'Сесійний cookie (без явного Expires або Max-Age) видаляється при закритті браузера.',
          answer: true,
          hint: 'Without an expiration directive, cookies only persist for the browser session.',
          hint_uk: 'Без директиви закінчення терміну дії cookies зберігаються тільки протягом сесії браузера.'
        }
      ]
    });
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
    sessionData = null;
    QuizEngine.cleanup('intro-cookies');
  }

  return { init, cleanup };
})();

window.introCookies = introCookies;
