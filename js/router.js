/* ============================================
   Hash-Based SPA Router — 27 Module Registry
   ============================================ */

const Router = (() => {
  const modules = {
    // ── Introduction (8) ──
    'intro-welcome':    { file: 'content/intro/welcome.html',    handler: 'introWelcome',    title: 'Welcome',              labs: 0 },
    'intro-legal':      { file: 'content/intro/legal.html',      handler: 'introLegal',      title: 'Legal & Ethics',       labs: 1 },
    'intro-networking': { file: 'content/intro/networking.html',  handler: 'introNetworking', title: 'Networking',           labs: 3 },
    'intro-encoding':   { file: 'content/intro/encoding.html',   handler: 'introEncoding',   title: 'Encoding & Crypto',    labs: 4 },
    'intro-cookies':    { file: 'content/intro/cookies.html',     handler: 'introCookies',    title: 'Cookies & Sessions',   labs: 2 },
    'intro-sop':        { file: 'content/intro/sop.html',         handler: 'introSop',        title: 'SOP & CORS',           labs: 2 },
    'intro-history':    { file: 'content/intro/history.html',     handler: 'introHistory',    title: 'History of Hacking',   labs: 1 },
    'intro-killchain':  { file: 'content/intro/killchain.html',   handler: 'introKillchain',  title: 'Cyber Kill Chain',     labs: 1 },

    // ── Vulnerabilities (15) ──
    'vuln-sqli':         { file: 'content/vuln/sqli.html',         handler: 'vulnSqli',         title: 'SQL Injection',      labs: 4 },
    'vuln-xss':          { file: 'content/vuln/xss.html',          handler: 'vulnXss',          title: 'XSS',               labs: 5 },
    'vuln-ssti':         { file: 'content/vuln/ssti.html',         handler: 'vulnSsti',         title: 'SSTI',              labs: 2 },
    'vuln-idor':         { file: 'content/vuln/idor.html',         handler: 'vulnIdor',         title: 'IDOR',              labs: 2 },
    'vuln-auth':         { file: 'content/vuln/auth.html',         handler: 'vulnAuth',         title: 'Broken Auth',       labs: 2 },
    'vuln-csrf':         { file: 'content/vuln/csrf.html',         handler: 'vulnCsrf',         title: 'CSRF',              labs: 3 },
    'vuln-clickjacking': { file: 'content/vuln/clickjacking.html', handler: 'vulnClickjacking', title: 'Clickjacking',      labs: 3 },
    'vuln-ssrf':         { file: 'content/vuln/ssrf.html',         handler: 'vulnSsrf',         title: 'SSRF',              labs: 3 },
    'vuln-traversal':    { file: 'content/vuln/traversal.html',    handler: 'vulnTraversal',    title: 'Path Traversal',    labs: 3 },
    'vuln-upload':       { file: 'content/vuln/upload.html',       handler: 'vulnUpload',       title: 'File Upload',       labs: 3 },
    'vuln-cmdi':         { file: 'content/vuln/cmdi.html',         handler: 'vulnCmdi',         title: 'Command Injection', labs: 3 },
    'vuln-xxe':          { file: 'content/vuln/xxe.html',          handler: 'vulnXxe',          title: 'XXE',               labs: 3 },
    'vuln-race':         { file: 'content/vuln/race.html',         handler: 'vulnRace',         title: 'Race Conditions',   labs: 3 },
    'vuln-deserial':     { file: 'content/vuln/deserial.html',     handler: 'vulnDeserial',     title: 'Deserialization',   labs: 3 },
    'vuln-graphql':      { file: 'content/vuln/graphql.html',      handler: 'vulnGraphql',      title: 'GraphQL',           labs: 3 },

    // ── Aftermath (4) ──
    'after-reporting':   { file: 'content/after/reporting.html',   handler: 'afterReporting',   title: 'Reporting',    labs: 1 },
    'after-obfuscation': { file: 'content/after/obfuscation.html', handler: 'afterObfuscation', title: 'WAF Evasion',  labs: 2 },
    'after-recon':       { file: 'content/after/recon.html',       handler: 'afterRecon',       title: 'Web Recon',    labs: 2 },
    'after-next':        { file: 'content/after/next.html',        handler: 'afterNext',        title: 'Next Steps',   labs: 1 }
  };

  // Category groupings for sidebar and game unlocks
  const CATEGORIES = {
    intro:  ['intro-welcome', 'intro-legal', 'intro-networking', 'intro-encoding', 'intro-cookies', 'intro-sop', 'intro-history', 'intro-killchain'],
    vuln:   ['vuln-sqli', 'vuln-xss', 'vuln-ssti', 'vuln-idor', 'vuln-auth',
             'vuln-csrf', 'vuln-clickjacking', 'vuln-ssrf', 'vuln-traversal', 'vuln-upload',
             'vuln-cmdi', 'vuln-xxe', 'vuln-race', 'vuln-deserial', 'vuln-graphql'],
    after:  ['after-reporting', 'after-obfuscation', 'after-recon', 'after-next']
  };

  // Sorted keys longest-first for route matching
  const sortedKeys = Object.keys(modules).sort((a, b) => b.length - a.length);

  let currentModule = null;
  let contentEl = null;

  function init() {
    contentEl = Utils.$('#content');
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  function handleRoute() {
    const hash = location.hash.replace('#', '') || 'intro-legal';

    // Game route
    if (hash === 'game' || hash.startsWith('game-')) {
      showGame();
      return;
    }

    // Find the longest matching module key
    const moduleKey = sortedKeys.find(k => hash === k || hash.startsWith(k + '-'));

    if (moduleKey) {
      loadModule(moduleKey);
    } else {
      loadModule('intro-legal');
    }
  }

  function showGame() {
    // Cleanup current module if any
    if (currentModule && currentModule !== 'game' && modules[currentModule] && window[modules[currentModule].handler]) {
      const handler = window[modules[currentModule].handler];
      if (handler.cleanup) handler.cleanup();
    }

    // Hide normal UI
    const sidebar = Utils.$('.sidebar');
    const mainContent = Utils.$('.main-content');
    const header = Utils.$('.app-header');
    const overlay = Utils.$('.sidebar-overlay');
    if (sidebar) sidebar.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
    if (header) header.style.display = 'none';
    if (overlay) overlay.classList.remove('visible');

    // Show game container
    const gc = document.getElementById('game-container');
    if (gc) {
      gc.style.display = 'flex';
      gc.style.alignItems = 'center';
      gc.style.justifyContent = 'center';
    }
    document.body.classList.add('game-active');

    // Boot Phaser if not already running
    if (window.Game && !Game.instance) {
      Game.boot('game-container');
    }

    // Update sidebar active state
    Utils.$$('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.module === 'game');
    });

    currentModule = 'game';
  }

  function hideGame() {
    const gc = document.getElementById('game-container');
    if (gc) gc.style.display = 'none';
    document.body.classList.remove('game-active');

    // Restore normal UI
    const sidebar = Utils.$('.sidebar');
    const mainContent = Utils.$('.main-content');
    const header = Utils.$('.app-header');
    if (sidebar) sidebar.style.display = '';
    if (mainContent) mainContent.style.display = '';
    if (header) header.style.display = '';

    // Destroy Phaser
    if (window.Game && Game.instance) {
      Game.destroy();
    }
  }

  async function loadModule(key) {
    // If coming from game, hide it first
    if (currentModule === 'game') {
      hideGame();
    }

    // Cleanup current module
    if (currentModule && currentModule !== 'game' && modules[currentModule] && window[modules[currentModule].handler]) {
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

      // Scroll to specific lab if hash contains sub-target
      const hash = location.hash.replace('#', '');
      if (hash.length > key.length && hash.charAt(key.length) === '-') {
        const labTarget = hash.slice(key.length + 1);
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

  // Check if all modules in a category are completed
  function isCategoryComplete(category) {
    const mods = CATEGORIES[category];
    if (!mods) return false;
    return mods.every(key => {
      const mod = modules[key];
      return Storage.getModuleStatus(key, mod.labs) === 'completed';
    });
  }

  return { init, loadModule, updateProgressBadges, markLabComplete, modules, CATEGORIES, isCategoryComplete };
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
