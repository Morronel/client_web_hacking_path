/* ============================================
   Module 2 — SQL Injection
   ============================================ */

window.vulnSqli = (() => {
  const { $, $$, escapeHtml } = Utils;

  let listeners = [];
  let container = null;
  const queryLogs = { lab1: [], lab2: [], lab3: [], lab4: [] };
  const FLAG = 'CTF{sql_1nj3ct10n_m4st3r_2024}';
  const MAX_LOG_ENTRIES = 10;

  // --- Helpers ---

  function listen(el, event, handler) {
    if (!el) return;
    el.addEventListener(event, handler);
    listeners.push({ el, event, handler });
  }

  function showBanner(labNum) {
    const banner = $(`#lab${labNum}-banner`, container);
    if (banner) banner.classList.add('visible');
  }

  function syncLabStatus(labNum) {
    const statusEl = $(`#lab${labNum}-status`, container);
    if (statusEl && Storage.isLabCompleted('vuln-sqli', `lab${labNum}`)) {
      statusEl.textContent = 'Completed';
      statusEl.classList.add('completed');
    }
  }

  function completeLab(labNum) {
    if (!Storage.isLabCompleted('vuln-sqli', `lab${labNum}`)) {
      Router.markLabComplete('vuln-sqli', `lab${labNum}`);
      showBanner(labNum);
      syncLabStatus(labNum);
    }
  }

  // Render the live query display with injected parts highlighted
  function updateQueryDisplay(labId, template, ...injectedParts) {
    const display = $(`#${labId}-query`, container);
    if (!display) return;
    const spans = $$('.injected', display);
    injectedParts.forEach((part, i) => {
      if (spans[i]) spans[i].textContent = part;
    });
  }

  // Add an entry to a lab's query log
  function addLogEntry(labId, sql, success, errorMsg) {
    const log = queryLogs[labId];
    log.push({ sql, success, errorMsg, time: new Date() });
    if (log.length > MAX_LOG_ENTRIES) log.shift();
    renderQueryLog(labId);
  }

  function renderQueryLog(labId) {
    const logEl = $(`#${labId}-log`, container);
    if (!logEl) return;
    // Keep the title element
    const titleEl = $('.query-log-title', logEl);
    logEl.innerHTML = '';
    if (titleEl) logEl.appendChild(titleEl);
    else {
      const t = document.createElement('div');
      t.className = 'query-log-title';
      t.textContent = 'Query Log';
      logEl.appendChild(t);
    }

    const entries = queryLogs[labId];
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      const div = document.createElement('div');
      div.className = 'query-log-entry' + (entry.success ? '' : ' error');
      const statusIcon = entry.success ? '&#10003;' : '&#10007;';
      const statusClass = entry.success ? 'log-success' : 'log-error';
      div.innerHTML =
        `<span class="${statusClass}">${statusIcon}</span> ` +
        `<code>${escapeHtml(entry.sql)}</code>` +
        (entry.errorMsg ? `<div class="log-error-msg">${escapeHtml(entry.errorMsg)}</div>` : '');
      logEl.appendChild(div);
    }
  }

  // Render query results as an HTML table
  function renderResultTable(targetId, columns, values) {
    const el = $(`#${targetId}`, container);
    if (!el) return;
    if (!columns.length && !values.length) {
      el.innerHTML = '<p class="text-muted">No results returned.</p>';
      return;
    }
    let html = '<table><thead><tr>';
    for (const col of columns) {
      html += `<th>${escapeHtml(String(col))}</th>`;
    }
    html += '</tr></thead><tbody>';
    for (const row of values) {
      html += '<tr>';
      for (const val of row) {
        html += `<td>${escapeHtml(String(val === null ? 'NULL' : val))}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    el.innerHTML = html;
  }

  // Show an error message
  function showError(labId, msg) {
    const errEl = $(`#${labId}-error`, container);
    const resEl = $(`#${labId}-result`, container);
    if (resEl) resEl.innerHTML = '';
    if (errEl) {
      errEl.style.display = '';
      errEl.textContent = msg;
    }
  }

  // Hide error
  function hideError(labId) {
    const errEl = $(`#${labId}-error`, container);
    if (errEl) errEl.style.display = 'none';
  }

  // Check if any result value contains a string (deep search)
  function resultContains(values, needle) {
    for (const row of values) {
      for (const val of row) {
        if (val !== null && String(val).indexOf(needle) !== -1) return true;
      }
    }
    return false;
  }

  // --- Lab 1: Authentication Bypass ---

  function initLab1() {
    const usernameEl = $('#lab1-username', container);
    const passwordEl = $('#lab1-password', container);
    const loginBtn = $('#lab1-login', container);
    const resetBtn = $('#lab1-reset', container);

    // Update live query display as user types
    function updateLab1Display() {
      const u = usernameEl ? usernameEl.value : '';
      const p = passwordEl ? passwordEl.value : '';
      updateQueryDisplay('lab1', null, u, p);
    }

    listen(usernameEl, 'input', updateLab1Display);
    listen(passwordEl, 'input', updateLab1Display);

    listen(loginBtn, 'click', () => {
      const user = usernameEl ? usernameEl.value : '';
      const pass = passwordEl ? passwordEl.value : '';
      const sql = `SELECT * FROM users WHERE username='${user}' AND password_hash='${pass}'`;

      updateQueryDisplay('lab1', null, user, pass);
      hideError('lab1');

      const result = DB.executeQuery(sql);

      if (result.error) {
        showError('lab1', result.error);
        addLogEntry('lab1', sql, false, result.error);
        return;
      }

      if (result.values.length > 0) {
        renderResultTable('lab1-result', result.columns, result.values);
        addLogEntry('lab1', sql, true, null);

        // Login succeeded — check if it was an injection (not just valid creds)
        const resultEl = $('#lab1-result', container);
        if (resultEl) {
          const banner = document.createElement('div');
          banner.className = 'result-success';
          banner.innerHTML = '<strong>Login successful!</strong> Authenticated as: ' +
            escapeHtml(String(result.values[0][1])) + ' (' + escapeHtml(String(result.values[0][3])) + ')';
          resultEl.prepend(banner);
        }

        completeLab(1);
      } else {
        const resEl = $('#lab1-result', container);
        if (resEl) resEl.innerHTML = '<p class="text-red">Login failed. No matching user found.</p>';
        addLogEntry('lab1', sql, false, 'No rows returned');
      }
    });

    listen(resetBtn, 'click', () => {
      if (usernameEl) usernameEl.value = '';
      if (passwordEl) passwordEl.value = '';
      updateQueryDisplay('lab1', null, '', '');
      hideError('lab1');
      const resEl = $('#lab1-result', container);
      if (resEl) resEl.innerHTML = '';
    });

    syncLabStatus(1);
    if (Storage.isLabCompleted('vuln-sqli', 'lab1')) showBanner(1);
  }

  // --- Lab 2: Column Count Discovery ---

  function initLab2() {
    const searchEl = $('#lab2-search', container);
    const runBtn = $('#lab2-run', container);
    const resetBtn = $('#lab2-reset', container);

    listen(searchEl, 'input', () => {
      updateQueryDisplay('lab2', null, searchEl ? searchEl.value : '');
    });

    listen(runBtn, 'click', () => {
      const input = searchEl ? searchEl.value : '';
      const sql = `SELECT * FROM products WHERE name LIKE '%${input}%'`;

      updateQueryDisplay('lab2', null, input);
      hideError('lab2');

      const result = DB.executeQuery(sql);

      if (result.error) {
        showError('lab2', result.error);
        addLogEntry('lab2', sql, false, result.error);
        return;
      }

      renderResultTable('lab2-result', result.columns, result.values);
      addLogEntry('lab2', sql, true, null);

      // Detect column count discovery via ORDER BY or UNION SELECT NULL
      const upper = input.toUpperCase();
      const orderByMatch = upper.match(/ORDER\s+BY\s+(\d+)/);
      const unionNullMatch = upper.match(/UNION\s+SELECT\s+(NULL\s*,?\s*)+/i);

      if (orderByMatch) {
        const colNum = parseInt(orderByMatch[1], 10);
        // If they successfully ran ORDER BY 4 (no error) they know the count
        if (colNum === 4) {
          completeLab(2);
        }
      }

      if (unionNullMatch) {
        // Count NULLs in the UNION SELECT
        const nullCount = (upper.match(/NULL/g) || []).length;
        if (nullCount === 4 && !result.error) {
          completeLab(2);
        }
      }
    });

    listen(searchEl, 'keydown', (e) => {
      if (e.key === 'Enter') runBtn && runBtn.click();
    });

    listen(resetBtn, 'click', () => {
      if (searchEl) searchEl.value = '';
      updateQueryDisplay('lab2', null, '');
      hideError('lab2');
      const resEl = $('#lab2-result', container);
      if (resEl) resEl.innerHTML = '';
    });

    syncLabStatus(2);
    if (Storage.isLabCompleted('vuln-sqli', 'lab2')) showBanner(2);
  }

  // --- Lab 3: UNION Data Extraction ---

  function initLab3() {
    const searchEl = $('#lab3-search', container);
    const runBtn = $('#lab3-run', container);
    const resetBtn = $('#lab3-reset', container);

    listen(searchEl, 'input', () => {
      updateQueryDisplay('lab3', null, searchEl ? searchEl.value : '');
    });

    listen(runBtn, 'click', () => {
      const input = searchEl ? searchEl.value : '';
      const sql = `SELECT * FROM products WHERE name LIKE '%${input}%'`;

      updateQueryDisplay('lab3', null, input);
      hideError('lab3');

      const result = DB.executeQuery(sql);

      if (result.error) {
        showError('lab3', result.error);
        addLogEntry('lab3', sql, false, result.error);
        return;
      }

      renderResultTable('lab3-result', result.columns, result.values);
      addLogEntry('lab3', sql, true, null);

      // Detect if user extracted usernames via UNION
      const upper = input.toUpperCase();
      if (upper.includes('UNION') && upper.includes('SELECT') && upper.includes('USERS')) {
        if (resultContains(result.values, 'admin')) {
          completeLab(3);
        }
      }
    });

    listen(searchEl, 'keydown', (e) => {
      if (e.key === 'Enter') runBtn && runBtn.click();
    });

    listen(resetBtn, 'click', () => {
      if (searchEl) searchEl.value = '';
      updateQueryDisplay('lab3', null, '');
      hideError('lab3');
      const resEl = $('#lab3-result', container);
      if (resEl) resEl.innerHTML = '';
    });

    syncLabStatus(3);
    if (Storage.isLabCompleted('vuln-sqli', 'lab3')) showBanner(3);
  }

  // --- Lab 4: Schema Enumeration & Flag Capture ---

  function initLab4() {
    const searchEl = $('#lab4-search', container);
    const runBtn = $('#lab4-run', container);
    const resetBtn = $('#lab4-reset', container);

    listen(searchEl, 'input', () => {
      updateQueryDisplay('lab4', null, searchEl ? searchEl.value : '');
    });

    listen(runBtn, 'click', () => {
      const input = searchEl ? searchEl.value : '';
      const sql = `SELECT * FROM products WHERE name LIKE '%${input}%'`;

      updateQueryDisplay('lab4', null, input);
      hideError('lab4');

      const result = DB.executeQuery(sql);

      if (result.error) {
        showError('lab4', result.error);
        addLogEntry('lab4', sql, false, result.error);
        return;
      }

      renderResultTable('lab4-result', result.columns, result.values);
      addLogEntry('lab4', sql, true, null);

      // Detect if the flag appeared in the results
      if (resultContains(result.values, FLAG)) {
        completeLab(4);
      }
    });

    listen(searchEl, 'keydown', (e) => {
      if (e.key === 'Enter') runBtn && runBtn.click();
    });

    listen(resetBtn, 'click', () => {
      if (searchEl) searchEl.value = '';
      updateQueryDisplay('lab4', null, '');
      hideError('lab4');
      const resEl = $('#lab4-result', container);
      if (resEl) resEl.innerHTML = '';
    });

    syncLabStatus(4);
    if (Storage.isLabCompleted('vuln-sqli', 'lab4')) showBanner(4);
  }

  // --- Public interface ---

  async function init(cont) {
    container = cont;

    // Show loading state while DB initializes
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-indicator';
    loadingEl.innerHTML = '<div class="spinner"></div>Initializing database...';

    // Insert loading before the first lab
    const firstLab = $('#lab1', container);
    if (firstLab) firstLab.before(loadingEl);

    try {
      await DB.init();
    } catch (err) {
      loadingEl.innerHTML = '<span class="text-red">Failed to initialize database: ' +
        escapeHtml(String(err)) + '</span>';
      return;
    }

    // Remove loading indicator
    loadingEl.remove();

    // Reset query logs
    queryLogs.lab1 = [];
    queryLogs.lab2 = [];
    queryLogs.lab3 = [];
    queryLogs.lab4 = [];

    initLab1();
    initLab2();
    initLab3();
    initLab4();

    // Unified quiz + flag inputs
    QuizEngine.init(container, 'vuln-sqli', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What is the root cause of SQL injection?',
          text_uk: 'Яка основна причина SQL injection?',
          options: [
            { value: 'a', label: 'Using SQL databases instead of NoSQL', label_uk: 'Використання SQL баз даних замість NoSQL' },
            { value: 'b', label: 'User input concatenated directly into SQL query strings', label_uk: 'Введення користувача конкатенується напряму в рядки SQL-запитів' },
            { value: 'c', label: 'Not using HTTPS', label_uk: 'Невикористання HTTPS' },
            { value: 'd', label: 'Running the database on the same server as the application', label_uk: 'Запуск бази даних на тому ж сервері, що й додаток' }
          ],
          answer: 'b',
          hint: 'The database cannot distinguish code from data when they are mixed together.',
          hint_uk: 'База даних не може відрізнити код від даних, коли вони змішані.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'In a UNION-based attack, what must match between the original and injected SELECT?',
          text_uk: 'В атаці на базі UNION, що повинно збігатися між оригінальним та впровадженим SELECT?',
          options: [
            { value: 'a', label: 'The table names', label_uk: 'Назви таблиць' },
            { value: 'b', label: 'The number of columns', label_uk: 'Кількість стовпців' },
            { value: 'c', label: 'The database user', label_uk: 'Користувач бази даних' },
            { value: 'd', label: 'The WHERE clause', label_uk: 'Умова WHERE' }
          ],
          answer: 'b',
          hint: 'UNION requires both queries to return the same number of columns.',
          hint_uk: 'UNION вимагає, щоб обидва запити повертали однакову кількість стовпців.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'Which SQLite table reveals all table names in the database?',
          text_uk: 'Яка таблиця SQLite розкриває всі назви таблиць у базі даних?',
          options: [
            { value: 'a', label: '<code>information_schema.tables</code>', label_uk: '<code>information_schema.tables</code>' },
            { value: 'b', label: '<code>sys.tables</code>', label_uk: '<code>sys.tables</code>' },
            { value: 'c', label: '<code>sqlite_master</code>', label_uk: '<code>sqlite_master</code>' },
            { value: 'd', label: '<code>pg_catalog.pg_tables</code>', label_uk: '<code>pg_catalog.pg_tables</code>' }
          ],
          answer: 'c',
          hint: 'This is specific to SQLite — other databases use information_schema.',
          hint_uk: 'Це специфічно для SQLite — інші бази даних використовують information_schema.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'Blind SQL injection is useless because you cannot see the query results.',
          text_uk: 'Blind SQL injection є марною, бо ти не бачиш результатів запиту.',
          answer: false,
          hint: 'Blind SQLi extracts data one bit at a time through boolean or timing side channels.',
          hint_uk: 'Blind SQLi витягує дані по одному біту через boolean або часові побічні канали.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'Parameterized queries (prepared statements) prevent SQL injection by separating SQL structure from user data.',
          text_uk: 'Параметризовані запити (prepared statements) запобігають SQL injection, розділяючи структуру SQL та дані користувача.',
          answer: true
        }
      ],
      flags: [
        { id: 'f1', label: 'Flask Lab — Auth Bypass', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10 },
        { id: 'f2', label: 'Flask Lab — UNION Extraction', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15 },
        { id: 'f3', label: 'Flask Lab — Blind SQLi', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20 }
      ]
    });
  }

  function cleanup() {
    for (const { el, event, handler } of listeners) {
      el.removeEventListener(event, handler);
    }
    listeners = [];
    queryLogs.lab1 = [];
    queryLogs.lab2 = [];
    queryLogs.lab3 = [];
    queryLogs.lab4 = [];
    container = null;
    QuizEngine.cleanup('vuln-sqli');
  }

  return { init, cleanup };
})();
