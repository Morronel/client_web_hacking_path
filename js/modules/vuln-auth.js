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

    QuizEngine.init(container, 'vuln-auth', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What is the primary risk of returning different error messages for valid vs invalid usernames?',
          text_uk: 'Який основний ризик повернення різних повідомлень про помилку для дійсних та недійсних імен користувачів?',
          options: [
            { value: 'a', label: 'It makes the site slower', label_uk: 'Сайт працює повільніше' },
            { value: 'b', label: 'It allows username enumeration — attackers can determine which accounts exist', label_uk: 'Це дозволяє перебір імен користувачів — зловмисники можуть визначити, які акаунти існують' },
            { value: 'c', label: 'It violates GDPR', label_uk: 'Це порушує GDPR' },
            { value: 'd', label: 'It causes SQL injection', label_uk: 'Це спричиняє SQL injection' }
          ],
          answer: 'b',
          hint: 'Knowing which usernames exist is the first step to a targeted password attack.',
          hint_uk: 'Знання того, які імена користувачів існують — перший крок до цілеспрямованої атаки на паролі.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Which password attack tries ONE common password against MANY accounts to avoid lockouts?',
          text_uk: 'Яка атака на паролі пробує ОДИН поширений пароль проти БАГАТЬОХ акаунтів, щоб уникнути блокування?',
          options: [
            { value: 'a', label: 'Brute force', label_uk: 'Brute force' },
            { value: 'b', label: 'Credential stuffing', label_uk: 'Credential stuffing' },
            { value: 'c', label: 'Password spraying', label_uk: 'Password spraying' },
            { value: 'd', label: 'Dictionary attack', label_uk: 'Атака за словником' }
          ],
          answer: 'c',
          hint: 'This technique stays under the per-account lockout threshold.',
          hint_uk: 'Ця техніка залишається нижче порогу блокування для кожного акаунту.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'bcrypt is preferred over SHA-256 for password hashing because bcrypt is intentionally slow.',
          text_uk: 'bcrypt є кращим за SHA-256 для хешування паролів, тому що bcrypt навмисно повільний.',
          answer: true,
          hint: 'Slow hashing makes brute force impractical — each guess takes ~250ms instead of nanoseconds.',
          hint_uk: 'Повільне хешування робить brute force непрактичним — кожна спроба займає ~250 мс замість наносекунд.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'Which MFA method is most resistant to phishing attacks?',
          text_uk: 'Який метод MFA найстійкіший до фішингових атак?',
          options: [
            { value: 'a', label: 'SMS codes', label_uk: 'SMS-коди' },
            { value: 'b', label: 'Email codes', label_uk: 'Коди на email' },
            { value: 'c', label: 'TOTP (Google Authenticator)', label_uk: 'TOTP (Google Authenticator)' },
            { value: 'd', label: 'FIDO2/WebAuthn hardware keys', label_uk: 'Апаратні ключі FIDO2/WebAuthn' }
          ],
          answer: 'd',
          hint: 'Hardware keys use cryptographic challenge-response bound to the domain — they cannot be phished.',
          hint_uk: 'Апаратні ключі використовують криптографічний challenge-response, прив\'язаний до домену — їх неможливо зафішити.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'A timing side-channel in login can reveal valid usernames even when error messages are identical.',
          text_uk: 'Часовий побічний канал при логіні може розкрити дійсні імена користувачів, навіть коли повідомлення про помилку ідентичні.',
          answer: true,
          hint: 'If valid usernames trigger a bcrypt hash check (~500ms) but invalid ones return quickly (~10ms), the timing difference leaks information.',
          hint_uk: 'Якщо дійсні імена запускають перевірку bcrypt-хешу (~500 мс), а недійсні повертаються швидко (~10 мс), різниця в часі витікає інформацію.'
        }
      ],
      flags: [
        { id: 'f1', label: 'Flask Lab — Username Enumeration', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10 },
        { id: 'f2', label: 'Flask Lab — Password Reset Poisoning', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15 }
      ]
    });
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
    QuizEngine.cleanup('vuln-auth');
  }

  return { init, cleanup };
})();

window.vulnAuth = vulnAuth;
