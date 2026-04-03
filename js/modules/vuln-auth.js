/* ============================================
   Module 6: Broken Authentication
   ============================================ */

const vulnAuth = (() => {
  let listeners = [];

  function listen(el, evt, fn) {
    el.addEventListener(evt, fn);
    listeners.push({ el, evt, fn });
  }

  // Simulated user database — valid users with hashed passwords
  const validUsers = {
    admin: { password: 'dragon', role: 'administrator' },
    alice: { password: 'sunshine2024!', role: 'user' },
    charlie: { password: 'Ch@rl!3_s3cure#99', role: 'moderator' },
    manager: { password: 'Q9$kLm2@xR7p!', role: 'manager' }
  };

  const correctEnumAnswers = ['admin', 'alice', 'charlie', 'manager'];

  function simulateLogin(username, password) {
    const user = validUsers[username];
    if (!user) {
      return { success: false, message: 'Error: User not found', type: 'user_not_found' };
    }
    if (user.password !== password) {
      return { success: false, message: 'Error: Incorrect password for this account', type: 'wrong_password' };
    }
    return { success: true, message: `Login successful! Welcome, ${username} (${user.role})`, type: 'success' };
  }

  function initLab1(container) {
    const usernameEl = Utils.$('#auth-username', container);
    const passwordEl = Utils.$('#auth-password', container);
    const loginBtn = Utils.$('#auth-login-btn', container);
    const responseEl = Utils.$('#auth-response', container);
    const answerEl = Utils.$('#enum-answer', container);
    const submitBtn = Utils.$('#enum-submit', container);
    const bannerEl = Utils.$('#lab1-banner', container);
    const errorBanner = Utils.$('#lab1-error-banner', container);
    const statusEl = Utils.$('#lab1-status', container);

    if (Storage.isLabCompleted('vuln-auth', 'lab1')) {
      statusEl.textContent = '✓ Completed';
      statusEl.classList.add('solved');
    }

    listen(loginBtn, 'click', () => {
      const username = usernameEl.value.trim().toLowerCase();
      const password = passwordEl.value;

      if (!username) {
        responseEl.textContent = 'Please enter a username.';
        return;
      }

      const result = simulateLogin(username, password);
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

      if (result.type === 'user_not_found') {
        responseEl.innerHTML = `<span class="prompt-char">[${timestamp}]</span> POST /api/login\n` +
          `<span style="color:var(--accent-red);">HTTP 404: ${result.message}</span>`;
      } else if (result.type === 'wrong_password') {
        responseEl.innerHTML = `<span class="prompt-char">[${timestamp}]</span> POST /api/login\n` +
          `<span style="color:var(--accent-amber);">HTTP 401: ${result.message}</span>`;
      } else {
        responseEl.innerHTML = `<span class="prompt-char">[${timestamp}]</span> POST /api/login\n` +
          `<span style="color:var(--accent-green);">HTTP 200: ${result.message}</span>`;
      }
    });

    listen(usernameEl, 'keydown', (e) => {
      if (e.key === 'Enter') loginBtn.click();
    });

    listen(submitBtn, 'click', () => {
      const userAnswer = answerEl.value.toLowerCase().split(',').map(s => s.trim()).filter(Boolean).sort();
      const expected = [...correctEnumAnswers].sort();

      if (JSON.stringify(userAnswer) === JSON.stringify(expected)) {
        bannerEl.classList.add('visible');
        errorBanner.classList.remove('visible');
        Router.markLabComplete('vuln-auth', 'lab1');
        statusEl.textContent = '✓ Completed';
        statusEl.classList.add('solved');
      } else {
        errorBanner.classList.add('visible');
        bannerEl.classList.remove('visible');
      }
    });
  }

  function initLab2(container) {
    const usernameEl = Utils.$('#stuff-username', container);
    const passwordEl = Utils.$('#stuff-password', container);
    const loginBtn = Utils.$('#stuff-login-btn', container);
    const autoBtn = Utils.$('#stuff-auto-btn', container);
    const responseEl = Utils.$('#stuff-response', container);
    const bannerEl = Utils.$('#lab2-banner', container);
    const statusEl = Utils.$('#lab2-status', container);

    if (Storage.isLabCompleted('vuln-auth', 'lab2')) {
      statusEl.textContent = '✓ Completed';
      statusEl.classList.add('solved');
    }

    const passwords = ['123456', 'password', 'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'qwerty', 'abc123'];

    function checkSuccess(result) {
      if (result.success) {
        bannerEl.classList.add('visible');
        Router.markLabComplete('vuln-auth', 'lab2');
        statusEl.textContent = '✓ Completed';
        statusEl.classList.add('solved');
      }
    }

    listen(loginBtn, 'click', () => {
      const username = usernameEl.value.trim().toLowerCase();
      const password = passwordEl.value;

      if (!username || !password) {
        responseEl.textContent = 'Enter both username and password.';
        return;
      }

      const result = simulateLogin(username, password);
      const color = result.success ? 'var(--accent-green)' : 'var(--accent-red)';
      responseEl.innerHTML = `<span style="color:${color}">${Utils.escapeHtml(username)}:${Utils.escapeHtml(password)} → ${Utils.escapeHtml(result.message)}</span>`;
      checkSuccess(result);
    });

    listen(autoBtn, 'click', () => {
      responseEl.innerHTML = '<span style="color:var(--accent-amber);">Running credential stuffing attack...</span>\n\n';

      let found = false;
      let output = '';
      let delay = 0;

      correctEnumAnswers.forEach(username => {
        passwords.forEach(password => {
          const result = simulateLogin(username, password);
          const symbol = result.success ? '✓' : '✗';
          const color = result.success ? 'var(--accent-green)' : 'var(--text-muted)';

          output += `<span style="color:${color}">[${symbol}] ${username}:${password}`;
          if (result.success) {
            output += ` → LOGIN SUCCESS!`;
            found = true;
          }
          output += '</span>\n';
        });
      });

      output += '\n';
      if (found) {
        output += '<span style="color:var(--accent-green);font-weight:bold;">Credential found! Attack complete.</span>';
      } else {
        output += '<span style="color:var(--accent-red);">No valid credentials found.</span>';
      }

      responseEl.innerHTML = output;
      if (found) checkSuccess({ success: true });
    });
  }

  function init(container) {
    initLab1(container);
    initLab2(container);
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
  }

  return { init, cleanup };
})();

window.vulnAuth = vulnAuth;
