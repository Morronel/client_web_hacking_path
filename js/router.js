/* ============================================
   Hash-Based SPA Router
   ============================================ */

const Router = (() => {
  const modules = {
    m1: { file: 'content/m1-encoding.html', handler: 'm1Encoding', title: 'Encoding & Cryptography', labs: 4 },
    m2: { file: 'content/m2-sqli.html', handler: 'm2Sqli', title: 'SQL Injection', labs: 4 },
    m3: { file: 'content/m3-ssti.html', handler: 'm3Ssti', title: 'SSTI', labs: 2 },
    m4: { file: 'content/m4-idor.html', handler: 'm4Idor', title: 'IDOR', labs: 2 },
    m5: { file: 'content/m5-xss.html', handler: 'm5Xss', title: 'XSS', labs: 5 },
    m6: { file: 'content/m6-auth.html', handler: 'm6Auth', title: 'Broken Auth', labs: 2 },
    m7: { file: 'content/m7-cookies.html', handler: 'm7Cookies', title: 'Cookies', labs: 2 },
    m8: { file: 'content/m8-networking.html', handler: 'm8Networking', title: 'Networking', labs: 5 }
  };

  let currentModule = null;
  let contentEl = null;

  function init() {
    contentEl = Utils.$('#content');
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  function handleRoute() {
    const hash = location.hash.replace('#', '') || 'm1';
    const moduleKey = hash.split('-')[0]; // handle #m2-lab2 etc.

    if (modules[moduleKey]) {
      loadModule(moduleKey);
    } else {
      loadModule('m1');
    }
  }

  async function loadModule(key) {
    // Cleanup current module
    if (currentModule && window[modules[currentModule].handler]) {
      const handler = window[modules[currentModule].handler];
      if (handler.cleanup) handler.cleanup();
    }

    // Update active nav
    Utils.$$('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.module === key);
    });

    currentModule = key;
    const mod = modules[key];

    // Show loading
    contentEl.innerHTML = '<div class="loading-indicator"><div class="spinner"></div>Loading module...</div>';

    try {
      const resp = await fetch(mod.file);
      if (!resp.ok) throw new Error(`Failed to load ${mod.file}`);
      const html = await resp.text();

      contentEl.innerHTML = html;

      // Apply highlight.js to code blocks
      if (window.hljs) {
        Utils.$$('pre code', contentEl).forEach(block => {
          hljs.highlightElement(block);
        });
      }

      // Initialize module handler
      if (window[mod.handler]) {
        window[mod.handler].init(contentEl);
      }

      // Update progress indicators
      updateProgressBadges();

      // Scroll to specific lab if hash contains lab reference
      const hash = location.hash.replace('#', '');
      if (hash.includes('-')) {
        const labTarget = hash.split('-').slice(1).join('-');
        const targetEl = Utils.$(`#${labTarget}`, contentEl);
        if (targetEl) {
          setTimeout(() => targetEl.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      } else {
        window.scrollTo(0, 0);
      }

      // Close mobile sidebar
      Utils.$('.sidebar')?.classList.remove('open');
      Utils.$('.sidebar-overlay')?.classList.remove('visible');

    } catch (err) {
      contentEl.innerHTML = `
        <div class="panel">
          <h2 class="text-red">Error Loading Module</h2>
          <p>${Utils.escapeHtml(err.message)}</p>
          <p class="text-muted">Make sure you're running from a web server or file:// with proper access.</p>
        </div>`;
    }
  }

  function updateProgressBadges() {
    for (const [key, mod] of Object.entries(modules)) {
      const status = Storage.getModuleStatus(key, mod.labs);
      const navItem = Utils.$(`.nav-item[data-module="${key}"]`);
      if (!navItem) continue;
      const dot = Utils.$('.progress-dot', navItem);
      if (dot) {
        dot.className = 'progress-dot';
        if (status === 'completed') dot.classList.add('completed');
        else if (status === 'partial') dot.classList.add('partial');
      }
    }
  }

  function markLabComplete(moduleId, labId) {
    Storage.setLabCompleted(moduleId, labId);
    updateProgressBadges();
  }

  return { init, loadModule, updateProgressBadges, markLabComplete, modules };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  Router.init();

  // Hamburger toggle
  const hamburger = Utils.$('.hamburger');
  const sidebar = Utils.$('.sidebar');
  const overlay = Utils.$('.sidebar-overlay');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('visible');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });
  }
});
