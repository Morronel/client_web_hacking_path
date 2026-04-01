/* ============================================
   Module 7: Cookie Inspection & Manipulation
   ============================================ */

const m7Cookies = (() => {
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

    if (Storage.isLabCompleted('m7', 'lab1')) {
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
        Router.markLabComplete('m7', 'lab1');
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

    if (Storage.isLabCompleted('m7', 'lab2')) {
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
          Router.markLabComplete('m7', 'lab2');
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
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
    sessionData = null;
  }

  return { init, cleanup };
})();

window.m7Cookies = m7Cookies;
