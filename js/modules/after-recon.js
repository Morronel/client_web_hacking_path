/* ============================================
   Module: Web Reconnaissance & Bug Bounty
   ============================================ */

window.afterRecon = (() => {
  let listeners = [];
  let container = null;

  function listen(el, event, handler) {
    if (!el) return;
    el.addEventListener(event, handler);
    listeners.push({ el, event, handler });
  }

  function showBanner(labNum) {
    const banner = Utils.$(`#lab${labNum}-banner`, container);
    if (banner) banner.classList.add('visible');
  }

  function syncLabStatus(labNum) {
    const statusEl = Utils.$(`#lab${labNum}-status`, container);
    if (statusEl && Storage.isLabCompleted('after-recon', `lab${labNum}`)) {
      statusEl.textContent = 'Completed';
      statusEl.classList.add('completed');
    }
  }

  // ---- Lab 1: Google Dork Builder ----

  function initLab1() {
    const toggles = Utils.$$('#dork-toggles .btn', container);
    const valueEl = Utils.$('#dork-value', container);
    const queryEl = Utils.$('#dork-query', container);
    const addBtn = Utils.$('#dork-add', container);
    const saveBtn = Utils.$('#dork-save', container);
    const clearBtn = Utils.$('#dork-clear', container);
    const listEl = Utils.$('#dork-list', container);
    const progressEl = Utils.$('#dork-progress', container);

    let activeOp = 'site:';
    let currentParts = [];
    const savedDorks = [];

    toggles.forEach(btn => {
      listen(btn, 'click', () => {
        toggles.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeOp = btn.dataset.op;
      });
    });

    function updateQueryDisplay() {
      queryEl.value = currentParts.join(' ');
    }

    function updateDorkList() {
      if (savedDorks.length === 0) {
        listEl.innerHTML = '<p class="text-muted">No dorks saved yet.</p>';
      } else {
        listEl.innerHTML = savedDorks.map((d, i) =>
          `<p><strong>${i + 1}.</strong> <code>${Utils.escapeHtml(d)}</code></p>`
        ).join('');
      }
      const count = Math.min(savedDorks.length, 3);
      progressEl.textContent = `Dorks saved: ${count} / 3`;
    }

    listen(addBtn, 'click', () => {
      const val = valueEl.value.trim();
      if (!val) return;
      currentParts.push(activeOp + val);
      updateQueryDisplay();
      valueEl.value = '';
    });

    listen(saveBtn, 'click', () => {
      const query = queryEl.value.trim();
      if (!query) return;
      // Validate: must contain at least one operator with a value
      const hasOperator = /(?:site:|inurl:|filetype:|intitle:|intext:)\S+/.test(query);
      if (!hasOperator) return;

      savedDorks.push(query);
      currentParts = [];
      updateQueryDisplay();
      updateDorkList();

      if (savedDorks.length >= 3 && !Storage.isLabCompleted('after-recon', 'lab1')) {
        Router.markLabComplete('after-recon', 'lab1');
        showBanner(1);
        syncLabStatus(1);
      }
    });

    listen(clearBtn, 'click', () => {
      currentParts = [];
      updateQueryDisplay();
    });

    // Allow Enter key in value field
    listen(valueEl, 'keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });

    syncLabStatus(1);
    if (Storage.isLabCompleted('after-recon', 'lab1')) showBanner(1);
  }

  // ---- Lab 2: Subdomain Enumeration Simulator ----

  const VALID_SUBDOMAINS = ['admin', 'dev', 'staging', 'api', 'mail', 'blog', 'test', 'portal'];
  const REQUIRED_FINDS = 4;

  function initLab2() {
    const inputEl = Utils.$('#subdomain-input', container);
    const checkBtn = Utils.$('#subdomain-check', container);
    const resultsEl = Utils.$('#subdomain-results', container);
    const progressEl = Utils.$('#subdomain-progress', container);

    const found = new Set();
    const checked = new Set();
    let firstCheck = true;

    function updateProgress() {
      const count = Math.min(found.size, REQUIRED_FINDS);
      progressEl.textContent = `Valid subdomains found: ${count} / ${REQUIRED_FINDS}`;
    }

    listen(checkBtn, 'click', () => {
      const sub = inputEl.value.trim().toLowerCase().replace(/\.example\.com$/, '');
      if (!sub) return;

      if (firstCheck) {
        resultsEl.innerHTML = '';
        firstCheck = false;
      }

      inputEl.value = '';

      if (checked.has(sub)) {
        const p = document.createElement('p');
        p.className = 'text-muted';
        p.textContent = `${sub}.example.com — already checked`;
        resultsEl.appendChild(p);
        resultsEl.scrollTop = resultsEl.scrollHeight;
        return;
      }

      checked.add(sub);
      const isValid = VALID_SUBDOMAINS.includes(sub);
      const p = document.createElement('p');

      if (isValid) {
        found.add(sub);
        p.innerHTML = `<span class="text-green"><strong>${Utils.escapeHtml(sub)}.example.com</strong> — FOUND (200 OK)</span>`;
      } else {
        p.innerHTML = `<span class="text-red">${Utils.escapeHtml(sub)}.example.com — NOT FOUND (NXDOMAIN)</span>`;
      }

      resultsEl.appendChild(p);
      resultsEl.scrollTop = resultsEl.scrollHeight;
      updateProgress();

      if (found.size >= REQUIRED_FINDS && !Storage.isLabCompleted('after-recon', 'lab2')) {
        Router.markLabComplete('after-recon', 'lab2');
        showBanner(2);
        syncLabStatus(2);
      }
    });

    listen(inputEl, 'keydown', (e) => {
      if (e.key === 'Enter') checkBtn.click();
    });

    syncLabStatus(2);
    if (Storage.isLabCompleted('after-recon', 'lab2')) showBanner(2);
  }

  // ---- Public interface ----

  function init(cont) {
    container = cont;
    initLab1();
    initLab2();
  }

  function cleanup() {
    for (const { el, event, handler } of listeners) {
      el.removeEventListener(event, handler);
    }
    listeners = [];
    container = null;
  }

  return { init, cleanup };
})();
