/* ============================================
   Module: Obfuscation & WAF Evasion
   ============================================ */

window.afterObfuscation = (() => {
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
    if (statusEl && Storage.isLabCompleted('after-obfuscation', `lab${labNum}`)) {
      statusEl.textContent = 'Completed';
      statusEl.classList.add('completed');
    }
  }

  // ---- Obfuscation functions ----

  function caseVariation(input) {
    return input.split('').map((ch, i) =>
      i % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase()
    ).join('');
  }

  function urlEncode(input) {
    return input.split('').map(ch => {
      if (/[a-zA-Z0-9]/.test(ch)) return ch;
      return '%' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
    }).join('');
  }

  function htmlEntities(input) {
    return input.split('').map(ch => {
      if (/[a-zA-Z0-9 ]/.test(ch)) return ch;
      return '&#' + ch.charCodeAt(0) + ';';
    }).join('');
  }

  function sqlCommentInsert(input) {
    // Insert /**/ between every 2-3 characters of keywords
    return input.replace(/([a-zA-Z]{2})/g, '$1/**/');
  }

  function doubleEncode(input) {
    // First URL encode, then encode the percent signs
    const firstPass = input.split('').map(ch => {
      if (/[a-zA-Z0-9]/.test(ch)) return ch;
      return '%' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
    }).join('');
    // Encode the % signs from the first pass
    return firstPass.replace(/%/g, '%25');
  }

  // ---- Lab 1: Payload Obfuscator Workbench ----

  function initLab1() {
    const inputEl = Utils.$('#obf-input', container);
    const outputEl = Utils.$('#obf-output', container);
    const applyBtn = Utils.$('#obf-apply', container);
    const progressEl = Utils.$('#obf-progress', container);
    const toggles = Utils.$$('#obf-toggles .btn', container);

    let activeTech = 'case';
    const usedTechniques = new Set();

    // Restore progress if already completed
    if (Storage.isLabCompleted('after-obfuscation', 'lab1')) {
      usedTechniques.add('case');
      usedTechniques.add('url');
      usedTechniques.add('html');
    }

    toggles.forEach(btn => {
      listen(btn, 'click', () => {
        toggles.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTech = btn.dataset.tech;
      });
    });

    listen(applyBtn, 'click', () => {
      const input = inputEl.value.trim();
      if (!input) return;

      let result = '';
      switch (activeTech) {
        case 'case':       result = caseVariation(input); break;
        case 'url':        result = urlEncode(input); break;
        case 'html':       result = htmlEntities(input); break;
        case 'sqlcomment': result = sqlCommentInsert(input); break;
        case 'double':     result = doubleEncode(input); break;
      }

      outputEl.value = result;
      usedTechniques.add(activeTech);

      const count = Math.min(usedTechniques.size, 3);
      progressEl.textContent = `Techniques applied: ${count} / 3`;

      if (usedTechniques.size >= 3 && !Storage.isLabCompleted('after-obfuscation', 'lab1')) {
        Router.markLabComplete('after-obfuscation', 'lab1');
        showBanner(1);
        syncLabStatus(1);
      }
    });

    syncLabStatus(1);
    if (Storage.isLabCompleted('after-obfuscation', 'lab1')) {
      showBanner(1);
      progressEl.textContent = 'Techniques applied: 3 / 3';
    }
  }

  // ---- Lab 2: WAF Evasion Quiz ----

  const WAF_ANSWERS = { 'waf-q1': 'a', 'waf-q2': 'b', 'waf-q3': 'b' };
  const WAF_PASS_THRESHOLD = 2;

  function initLab2() {
    const submitBtn = Utils.$('#quiz2-submit', container);
    const resetBtn = Utils.$('#quiz2-reset', container);
    const resultEl = Utils.$('#quiz2-result', container);

    listen(submitBtn, 'click', () => {
      let score = 0;
      const total = Object.keys(WAF_ANSWERS).length;

      for (const [qName, correct] of Object.entries(WAF_ANSWERS)) {
        const selected = Utils.$(`input[name="${qName}"]:checked`, container);
        const questionEl = Utils.$(`#${qName}`, container);

        if (!questionEl) continue;

        questionEl.querySelectorAll('.quiz-option').forEach(opt => {
          opt.classList.remove('correct', 'incorrect');
        });

        if (selected && selected.value === correct) {
          score++;
          selected.closest('.quiz-option').classList.add('correct');
        } else {
          if (selected) {
            selected.closest('.quiz-option').classList.add('incorrect');
          }
          const correctInput = Utils.$(`input[name="${qName}"][value="${correct}"]`, container);
          if (correctInput) {
            correctInput.closest('.quiz-option').classList.add('correct');
          }
        }
      }

      resultEl.style.display = '';
      if (score >= WAF_PASS_THRESHOLD) {
        resultEl.innerHTML = `<span class="text-green"><strong>Passed!</strong> You got ${score}/${total} correct.</span>`;
        if (!Storage.isLabCompleted('after-obfuscation', 'lab2')) {
          Router.markLabComplete('after-obfuscation', 'lab2');
          showBanner(2);
          syncLabStatus(2);
        }
      } else {
        resultEl.innerHTML = `<span class="text-red"><strong>Not quite.</strong> You got ${score}/${total} correct. You need at least ${WAF_PASS_THRESHOLD}/${total} to pass.</span>`;
        resetBtn.style.display = '';
      }
      submitBtn.style.display = 'none';
    });

    listen(resetBtn, 'click', () => {
      for (const qName of Object.keys(WAF_ANSWERS)) {
        const questionEl = Utils.$(`#${qName}`, container);
        if (!questionEl) continue;
        questionEl.querySelectorAll('.quiz-option').forEach(opt => {
          opt.classList.remove('correct', 'incorrect');
        });
        questionEl.querySelectorAll('input[type="radio"]').forEach(r => {
          r.checked = false;
        });
      }
      resultEl.style.display = 'none';
      submitBtn.style.display = '';
      resetBtn.style.display = 'none';
    });

    syncLabStatus(2);
    if (Storage.isLabCompleted('after-obfuscation', 'lab2')) showBanner(2);
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
