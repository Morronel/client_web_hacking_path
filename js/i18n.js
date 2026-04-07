/* ============================================
   Internationalization (i18n) — EN / UK
   ============================================ */

const I18n = (() => {
  const STORAGE_KEY = 'webhack_lang';
  const SUPPORTED = ['en', 'uk'];
  const DEFAULT = 'en';

  let current = DEFAULT;

  // ── UI Strings ──
  const strings = {
    en: {
      // Header
      appTitle: 'WebHack Academy',
      // Sidebar sections
      sectionIntro: 'Introduction',
      sectionAuthAuthz: 'Auth & Authorization',
      sectionInjection: 'Injection',
      sectionLogicConfig: 'Logic & Config',
      sectionAftermath: 'Aftermath',
      // Module titles (sidebar)
      'intro-welcome': 'Welcome',
      'intro-legal': 'Legal & Ethics',
      'intro-networking': 'Networking',
      'intro-encoding': 'Encoding & Crypto',
      'intro-cookies': 'Cookies & Sessions',
      'intro-sop': 'SOP & CORS',
      'intro-history': 'History of Hacking',
      'intro-killchain': 'Cyber Kill Chain',
      'intro-setup': 'Lab Setup',
      'vuln-auth': 'Broken Auth',
      'vuln-idor': 'IDOR',
      'vuln-sqli': 'SQL Injection',
      'vuln-xss': 'XSS',
      'vuln-ssti': 'SSTI',
      'vuln-cmdi': 'Command Injection',
      'vuln-xxe': 'XXE',
      'vuln-deserial': 'Deserialization',
      'vuln-csrf': 'CSRF',
      'vuln-ssrf': 'SSRF',
      'vuln-traversal': 'Path Traversal',
      'vuln-race': 'Race Conditions',
      'vuln-graphql': 'GraphQL',
      'after-reporting': 'Reporting',
      'after-obfuscation': 'WAF Evasion',
      'after-recon': 'Web Recon',
      'after-next': 'Next Steps',
      // Quiz engine
      quizKnowledgeCheck: 'Knowledge Check',
      quizCorrect: 'Correct!',
      quizIncorrect: 'Not quite.',
      quizWrongOrder: 'Wrong order.',
      quizCorrectOrder: 'Correct order!',
      quizFlagAccepted: 'Flag accepted!',
      quizFlagInvalid: 'Invalid flag. Keep trying!',
      quizAllComplete: 'All challenges completed! Module mastered.',
      quizFlaskFlags: 'Flask Lab Flags',
      quizFlaskFlagsDesc: 'Complete the Flask lab challenges and enter the flags you find below.',
      quizCheckBtn: 'Check',
      quizSubmitBtn: 'Submit',
      quizCheckOrder: 'Check Order',
      quizTrue: 'True',
      quizFalse: 'False',
      // General
      flaskLab: 'Flask Lab',
      loading: 'Loading module...',
      loadingDb: 'Initializing database...',
      errorLoading: 'Error Loading Module',
    },
    uk: {
      appTitle: 'WebHack Академія',
      sectionIntro: 'Вступ',
      sectionAuthAuthz: 'Автентифікація',
      sectionInjection: 'Ін\'єкції',
      sectionLogicConfig: 'Логіка та конфіг',
      sectionAftermath: 'Підсумки',
      'intro-welcome': 'Ласкаво просимо',
      'intro-legal': 'Закон та етика',
      'intro-networking': 'Мережі',
      'intro-encoding': 'Кодування та криптo',
      'intro-cookies': 'Cookies та сесії',
      'intro-sop': 'SOP та CORS',
      'intro-history': 'Історія хакінгу',
      'intro-killchain': 'Cyber Kill Chain',
      'intro-setup': 'Підготовка лабораторії',
      'vuln-auth': 'Зламана автентифікація',
      'vuln-idor': 'IDOR',
      'vuln-sqli': 'SQL-ін\'єкція',
      'vuln-xss': 'XSS',
      'vuln-ssti': 'SSTI',
      'vuln-cmdi': 'Ін\'єкція команд',
      'vuln-xxe': 'XXE',
      'vuln-deserial': 'Десеріалізація',
      'vuln-csrf': 'CSRF',
      'vuln-ssrf': 'SSRF',
      'vuln-traversal': 'Обхід шляху',
      'vuln-race': 'Стан гонки',
      'vuln-graphql': 'GraphQL',
      'after-reporting': 'Звітність',
      'after-obfuscation': 'Обхід WAF',
      'after-recon': 'Веб-розвідка',
      'after-next': 'Що далі',
      quizKnowledgeCheck: 'Перевірка знань',
      quizCorrect: 'Правильно!',
      quizIncorrect: 'Не зовсім.',
      quizWrongOrder: 'Неправильний порядок.',
      quizCorrectOrder: 'Правильний порядок!',
      quizFlagAccepted: 'Прапорець прийнято!',
      quizFlagInvalid: 'Невірний прапорець. Спробуй ще!',
      quizAllComplete: 'Усі завдання виконано! Модуль опановано.',
      quizFlaskFlags: 'Прапорці Flask-лабораторії',
      quizFlaskFlagsDesc: 'Виконай завдання Flask-лабораторії та введи знайдені прапорці нижче.',
      quizCheckBtn: 'Перевірити',
      quizSubmitBtn: 'Надіслати',
      quizCheckOrder: 'Перевірити порядок',
      quizTrue: 'Так',
      quizFalse: 'Ні',
      flaskLab: 'Flask Lab',
      loading: 'Завантаження модуля...',
      loadingDb: 'Ініціалізація бази даних...',
      errorLoading: 'Помилка завантаження модуля',
    }
  };

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) {
      current = saved;
    }
    _applyUI();
  }

  function get() { return current; }

  function set(lang) {
    if (!SUPPORTED.includes(lang)) return;
    current = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    _applyUI();
    // Reload current module in new language
    if (typeof Router !== 'undefined') Router.reloadCurrentModule();
  }

  function t(key) {
    return (strings[current] && strings[current][key]) || (strings.en[key]) || key;
  }

  // Get content file path adjusted for language
  function contentPath(enPath) {
    if (current === 'en') return enPath;
    // content/intro/welcome.html → content/uk/intro/welcome.html
    return enPath.replace(/^content\//, 'content/uk/');
  }

  function _applyUI() {
    // Update language switcher button
    const btn = document.querySelector('#lang-toggle');
    if (btn) btn.textContent = current === 'en' ? 'UA' : 'EN';

    // Update sidebar section titles
    document.querySelectorAll('.sidebar-section-title').forEach(el => {
      const key = el.dataset.i18n;
      if (key) el.textContent = t(key);
    });

    // Update sidebar nav items
    document.querySelectorAll('.nav-item[data-module]').forEach(el => {
      const mod = el.dataset.module;
      const span = el.querySelector('.module-title');
      if (span && strings[current][mod]) {
        span.textContent = t(mod);
      }
    });

    // Update header title
    const titleTextEl = document.querySelector('.app-title-text');
    if (titleTextEl) titleTextEl.textContent = t('appTitle');
  }

  return { init, get, set, t, contentPath, SUPPORTED };
})();
