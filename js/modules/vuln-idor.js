/* ============================================
   Module 4: Insecure Direct Object Reference
   ============================================ */

const vulnIdor = (() => {
  let listeners = [];

  function listen(el, evt, fn) {
    el.addEventListener(evt, fn);
    listeners.push({ el, evt, fn });
  }

  // Fake user database
  const users = {
    1: { id: 1, username: 'admin', email: 'admin@megacorp.io', role: 'administrator', api_key: 'sk-admin-9f8e7d6c5b4a3210', department: 'IT Security', created: '2022-01-15' },
    2: { id: 2, username: 'jsmith', email: 'j.smith@megacorp.io', role: 'user', api_key: 'sk-user-1a2b3c4d', department: 'Marketing', created: '2023-03-22' },
    3: { id: 3, username: 'alice', email: 'alice@megacorp.io', role: 'user', api_key: 'sk-user-5e6f7g8h', department: 'Engineering', created: '2023-06-10' },
    4: { id: 4, username: 'bob', email: 'bob@megacorp.io', role: 'user', api_key: 'sk-user-9i0j1k2l', department: 'Sales', created: '2023-08-01' },
    5: { id: 5, username: 'charlie', email: 'charlie@megacorp.io', role: 'moderator', api_key: 'sk-mod-3m4n5o6p', department: 'Support', created: '2023-09-14' }
  };

  // Fake order database
  const orders = {
    1001: { id: 1001, user_id: 1, item: 'Enterprise License', amount: 4999.00, status: 'completed', notes: 'Annual renewal' },
    1002: { id: 1002, user_id: 2, item: 'Team Plan', amount: 299.00, status: 'completed', notes: 'Monthly subscription' },
    1003: { id: 1003, user_id: 4, item: 'Premium Bundle', amount: 149.00, status: 'shipped', discount_code: 'SECRETVIP50', notes: 'Applied 50% discount' },
    1004: { id: 1004, user_id: 5, item: 'Moderator Tools', amount: 0.00, status: 'completed', notes: 'Internal comp' },
    1005: { id: 1005, user_id: 3, item: 'Developer Kit', amount: 89.00, status: 'completed', notes: 'Standard purchase' },
    1006: { id: 1006, user_id: 2, item: 'API Access Tier 2', amount: 199.00, status: 'pending', notes: 'Awaiting approval' },
    1007: { id: 1007, user_id: 1, item: 'Security Audit Add-on', amount: 999.00, status: 'completed', notes: 'Q4 purchase' },
    1008: { id: 1008, user_id: 3, item: 'Cloud Storage Upgrade', amount: 49.00, status: 'completed', notes: 'Monthly add-on' }
  };

  function formatResponse(data, status) {
    if (!data) {
      return `<span class="json-key">HTTP/1.1 ${status}</span>\n\n` +
        Utils.highlightJson({ error: 'Not Found', message: 'The requested resource does not exist' });
    }
    return `<span class="json-key">HTTP/1.1 ${status}</span>\n\n` + Utils.highlightJson(data);
  }

  function initLab1(container) {
    const inputEl = Utils.$('#idor-user-id', container);
    const fetchBtn = Utils.$('#idor-fetch-btn', container);
    const responseEl = Utils.$('#idor-response', container);
    const bannerEl = Utils.$('#lab1-banner', container);
    const statusEl = Utils.$('#lab1-status', container);

    if (Storage.isLabCompleted('vuln-idor', 'lab1')) {
      statusEl.textContent = '✓ Completed';
      statusEl.classList.add('solved');
    }

    listen(fetchBtn, 'click', () => {
      const id = parseInt(inputEl.value);
      const user = users[id];

      if (user) {
        responseEl.innerHTML = formatResponse(user, '200 OK');

        // Check if they accessed admin
        if (id === 1) {
          bannerEl.classList.add('visible');
          Router.markLabComplete('vuln-idor', 'lab1');
          statusEl.textContent = '✓ Completed';
          statusEl.classList.add('solved');
        }
      } else {
        responseEl.innerHTML = formatResponse(null, '404 Not Found');
      }
    });

    listen(inputEl, 'keydown', (e) => {
      if (e.key === 'Enter') fetchBtn.click();
    });
  }

  function initLab2(container) {
    const inputEl = Utils.$('#idor-order-id', container);
    const fetchBtn = Utils.$('#idor-order-btn', container);
    const responseEl = Utils.$('#idor-order-response', container);
    const bannerEl = Utils.$('#lab2-banner', container);
    const statusEl = Utils.$('#lab2-status', container);

    if (Storage.isLabCompleted('vuln-idor', 'lab2')) {
      statusEl.textContent = '✓ Completed';
      statusEl.classList.add('solved');
    }

    listen(fetchBtn, 'click', () => {
      const id = parseInt(inputEl.value);
      const order = orders[id];

      if (order) {
        responseEl.innerHTML = formatResponse(order, '200 OK');

        // Check if they found the discount code
        if (order.discount_code) {
          bannerEl.classList.add('visible');
          Router.markLabComplete('vuln-idor', 'lab2');
          statusEl.textContent = '✓ Completed';
          statusEl.classList.add('solved');
        }
      } else {
        responseEl.innerHTML = formatResponse(null, '404 Not Found');
      }
    });

    listen(inputEl, 'keydown', (e) => {
      if (e.key === 'Enter') fetchBtn.click();
    });
  }

  function init(container) {
    initLab1(container);
    initLab2(container);

    QuizEngine.init(container, 'vuln-idor', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What is the difference between authentication and authorization?',
          text_uk: 'Яка різниця між автентифікацією та авторизацією?',
          options: [
            { value: 'a', label: 'Authentication checks permissions; authorization verifies identity', label_uk: 'Автентифікація перевіряє дозволи; авторизація підтверджує особу' },
            { value: 'b', label: 'Authentication verifies identity; authorization checks what you can access', label_uk: 'Автентифікація підтверджує особу; авторизація перевіряє, до чого ти маєш доступ' },
            { value: 'c', label: 'They are the same thing', label_uk: 'Це одне й те саме' },
            { value: 'd', label: 'Authentication uses cookies; authorization uses tokens', label_uk: 'Автентифікація використовує cookies; авторизація використовує токени' }
          ],
          answer: 'b',
          hint: 'AuthN = who are you? AuthZ = what can you do?',
          hint_uk: 'AuthN = хто ти? AuthZ = що ти можеш робити?'
        },
        {
          type: 'mc', id: 'q2',
          text: 'A regular user accessing another regular user\'s profile is an example of:',
          text_uk: 'Звичайний користувач, що отримує доступ до профілю іншого звичайного користувача — це приклад:',
          options: [
            { value: 'a', label: 'Vertical privilege escalation', label_uk: 'Вертикальне підвищення привілеїв' },
            { value: 'b', label: 'Horizontal privilege escalation', label_uk: 'Горизонтальне підвищення привілеїв' },
            { value: 'c', label: 'SQL injection', label_uk: 'SQL injection' },
            { value: 'd', label: 'Cross-site scripting', label_uk: 'Cross-site scripting' }
          ],
          answer: 'b',
          hint: 'Same privilege level, different user\'s data.',
          hint_uk: 'Той самий рівень привілеїв, дані іншого користувача.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'Using UUIDs instead of sequential integers fully prevents IDOR vulnerabilities.',
          text_uk: 'Використання UUID замість послідовних цілих чисел повністю запобігає вразливостям IDOR.',
          answer: false,
          hint: 'UUIDs make enumeration harder but don\'t fix the root cause — missing authorization checks.',
          hint_uk: 'UUID ускладнюють перебір, але не виправляють основну причину — відсутність перевірок авторизації.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'Which testing approach is most effective for finding IDORs?',
          text_uk: 'Який підхід до тестування є найефективнішим для знаходження IDOR?',
          options: [
            { value: 'a', label: 'Run an automated vulnerability scanner', label_uk: 'Запустити автоматичний сканер вразливостей' },
            { value: 'b', label: 'Create two accounts, note the IDs, and try accessing each other\'s resources', label_uk: 'Створити два акаунти, записати ID та спробувати отримати доступ до ресурсів один одного' },
            { value: 'c', label: 'Check if the site uses HTTPS', label_uk: 'Перевірити, чи сайт використовує HTTPS' },
            { value: 'd', label: 'Review the HTML source code', label_uk: 'Переглянути HTML-код сторінки' }
          ],
          answer: 'b',
          hint: 'The two-account cross-reference technique is the standard IDOR testing methodology.',
          hint_uk: 'Техніка перехресної перевірки двох акаунтів — стандартна методологія тестування IDOR.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'An endpoint that properly checks authorization on GET requests is guaranteed to also check it on PUT and DELETE.',
          text_uk: 'Ендпоінт, що правильно перевіряє авторизацію на GET-запитах, гарантовано перевіряє її і на PUT та DELETE.',
          answer: false,
          hint: 'Authorization must be checked on EVERY HTTP method separately — developers often forget non-GET methods.',
          hint_uk: 'Авторизацію потрібно перевіряти на КОЖНОМУ HTTP-методі окремо — розробники часто забувають про не-GET методи.'
        }
      ],
      flags: [
        { id: 'f1', label: 'Flask Lab — User Profile IDOR', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10 },
        { id: 'f2', label: 'Flask Lab — Order IDOR', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15 }
      ]
    });
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
    QuizEngine.cleanup('vuln-idor');
  }

  return { init, cleanup };
})();

window.vulnIdor = vulnIdor;
