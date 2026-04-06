/* ============================================
   Unified Quiz Engine — Interactive Quizzes,
   Flag Validation, Progress Tracking
   ============================================ */

const QuizEngine = (() => {

  /**
   * Initialize a quiz inside a container.
   *
   * @param {HTMLElement} container - The module's root element
   * @param {string} moduleId - e.g. 'vuln-sqli'
   * @param {object} config
   * @param {Array} config.questions - Array of question objects
   * @param {Array} [config.flags] - Array of flag objects for Flask labs
   * @param {string} [config.quizLabel] - Custom label (default: "Knowledge Check")
   * @param {Function} [config.onComplete] - Callback when quiz is 100%
   *
   * Question types:
   *   { type: 'mc', id: 'q1', text: '...', options: [{value:'a', label:'...'}, ...], answer: 'b', hint: '...' }
   *   { type: 'tf', id: 'q2', text: '...', answer: true, hint: '...' }
   *   { type: 'fill', id: 'q3', text: '...', answerHash: 'sha256hex', placeholder: '...', hint: '...' }
   *   { type: 'order', id: 'q4', text: '...', items: ['step1','step2',...], correctOrder: [2,0,3,1], hint: '...' }
   *
   * Flag objects:
   *   { id: 'flag1', label: 'Challenge 1 — Auth Bypass', hash: 'sha256hex', points: 10 }
   */

  const listeners = new Map(); // moduleId -> [{el, evt, fn}]

  // Simple XOR-based answer obfuscation (not crypto, just anti-casual-reading)
  function _obfuscateAnswer(answer, salt) {
    // We store answers as: first char of salt + reversed base64
    const encoded = btoa(salt.slice(0, 3) + String(answer));
    return encoded.split('').reverse().join('');
  }

  function _deobfuscateAnswer(obfuscated, salt) {
    try {
      const decoded = atob(obfuscated.split('').reverse().join(''));
      return decoded.slice(3); // strip salt prefix
    } catch { return null; }
  }

  function _listen(moduleId, el, evt, fn) {
    if (!el) return;
    el.addEventListener(evt, fn);
    if (!listeners.has(moduleId)) listeners.set(moduleId, []);
    listeners.get(moduleId).push({ el, evt, fn });
  }

  // Resolve text for current language: prefer _uk suffix when Ukrainian
  function _t(obj, field) {
    const lang = (window.I18n ? I18n.get() : 'en');
    if (lang === 'uk' && obj[field + '_uk']) return obj[field + '_uk'];
    return obj[field] || '';
  }

  // Get I18n UI string
  function _ui(key) {
    return (window.I18n ? I18n.t(key) : key);
  }

  function _createQuizHTML(config) {
    const label = config.quizLabel || _ui('quizKnowledgeCheck');
    const questions = config.questions || [];
    const flags = config.flags || [];

    let html = `<section class="qe-section">`;
    html += `<div class="qe-header"><h2>${label}</h2>`;
    html += `<span class="qe-progress" id="qe-progress">0 / ${questions.length + flags.length}</span></div>`;

    // Questions
    questions.forEach((q, i) => {
      html += `<div class="qe-question" data-qid="${q.id}" id="qe-${q.id}">`;
      html += `<div class="qe-q-header"><span class="qe-q-num">${i + 1}</span>`;
      html += `<span class="qe-q-status" id="qe-status-${q.id}"></span></div>`;
      html += `<p class="qe-q-text">${_t(q, 'text')}</p>`;

      if (q.type === 'mc') {
        html += `<div class="qe-options">`;
        q.options.forEach(opt => {
          html += `<button class="qe-opt" data-qid="${q.id}" data-val="${opt.value}">`
            + `<span class="qe-opt-letter">${opt.value.toUpperCase()}</span>`
            + `<span class="qe-opt-text">${_t(opt, 'label')}</span>`
            + `</button>`;
        });
        html += `</div>`;
      } else if (q.type === 'tf') {
        html += `<div class="qe-options qe-tf">`;
        html += `<button class="qe-opt" data-qid="${q.id}" data-val="true"><span class="qe-opt-letter">T</span><span class="qe-opt-text">${_ui('quizTrue')}</span></button>`;
        html += `<button class="qe-opt" data-qid="${q.id}" data-val="false"><span class="qe-opt-letter">F</span><span class="qe-opt-text">${_ui('quizFalse')}</span></button>`;
        html += `</div>`;
      } else if (q.type === 'fill') {
        html += `<div class="qe-fill">`;
        html += `<input type="text" class="qe-fill-input" id="qe-input-${q.id}" placeholder="${q.placeholder || 'Type your answer...'}" autocomplete="off" spellcheck="false">`;
        html += `<button class="qe-fill-btn" data-qid="${q.id}">${_ui('quizCheckBtn')}</button>`;
        html += `</div>`;
      } else if (q.type === 'order') {
        html += `<div class="qe-order" id="qe-order-${q.id}">`;
        // Shuffle items for display
        const shuffled = q.items.map((item, idx) => ({ item, idx }));
        for (let k = shuffled.length - 1; k > 0; k--) {
          const j = Math.floor(Math.random() * (k + 1));
          [shuffled[k], shuffled[j]] = [shuffled[j], shuffled[k]];
        }
        shuffled.forEach(({ item, idx }) => {
          html += `<div class="qe-order-item" draggable="true" data-oidx="${idx}">`
            + `<span class="qe-drag-handle">&#9776;</span>${item}</div>`;
        });
        html += `</div>`;
        html += `<button class="qe-order-check" data-qid="${q.id}">${_ui('quizCheckOrder')}</button>`;
      }

      html += `<div class="qe-feedback" id="qe-fb-${q.id}"></div>`;
      html += `</div>`; // end qe-question
    });

    // Flag inputs
    if (flags.length > 0) {
      html += `<div class="qe-flags-section">`;
      html += `<h3 class="qe-flags-title">${_ui('quizFlaskFlags')}</h3>`;
      html += `<p class="qe-flags-desc">${_ui('quizFlaskFlagsDesc')}</p>`;
      flags.forEach(f => {
        html += `<div class="qe-flag" data-fid="${f.id}" id="qe-flag-${f.id}">`;
        html += `<div class="qe-flag-label">${f.label}</div>`;
        html += `<div class="qe-flag-input-row">`;
        html += `<input type="text" class="qe-flag-input" id="qe-finput-${f.id}" placeholder="FLAG{...}" autocomplete="off" spellcheck="false">`;
        html += `<button class="qe-flag-btn" data-fid="${f.id}">${_ui('quizSubmitBtn')}</button>`;
        html += `</div>`;
        html += `<div class="qe-flag-feedback" id="qe-ffb-${f.id}"></div>`;
        html += `</div>`;
      });
      html += `</div>`;
    }

    html += `<div class="qe-result" id="qe-result"></div>`;
    html += `</section>`;
    return html;
  }

  function init(container, moduleId, config) {
    if (!config || (!config.questions?.length && !config.flags?.length)) return;

    // Remove ALL old quiz markup to prevent duplicates
    container.querySelectorAll('.quiz-section, .quiz-container, #quiz-container, #career-quiz-container').forEach(el => el.remove());
    // Also hide old-style lab quiz containers that conflict
    container.querySelectorAll('.quiz-options, .quiz-result, .quiz-feedback').forEach(el => {
      // Only remove if it's part of an old quiz, not part of interactive labs
      if (el.closest('.lab-container')) return;
      el.remove();
    });

    // Find or create the quiz mount point
    let mount = container.querySelector('#qe-mount');
    if (!mount) {
      // If there's an existing quiz-section, replace it
      const oldQuiz = container.querySelector('.quiz-section');
      if (oldQuiz) {
        mount = document.createElement('div');
        mount.id = 'qe-mount';
        oldQuiz.replaceWith(mount);
      } else {
        // Append before Flask lab card or at end of content
        mount = document.createElement('div');
        mount.id = 'qe-mount';
        const flaskCard = container.querySelector('.lab-card');
        if (flaskCard) {
          flaskCard.parentNode.insertBefore(mount, flaskCard);
        } else {
          container.appendChild(mount);
        }
      }
    }

    mount.innerHTML = _createQuizHTML(config);

    const questions = config.questions || [];
    const flags = config.flags || [];
    const totalItems = questions.length + flags.length;
    const state = { answers: {}, flagsDone: new Set(), totalItems };

    // Restore previously completed items
    const progress = Storage.getModuleProgress(moduleId);
    questions.forEach(q => {
      if (progress.labs && progress.labs[`quiz-${q.id}`]) {
        state.answers[q.id] = true;
        const qEl = mount.querySelector(`#qe-${q.id}`);
        if (qEl) qEl.classList.add('qe-correct');
        const statusEl = mount.querySelector(`#qe-status-${q.id}`);
        if (statusEl) statusEl.textContent = '\u2713';
      }
    });
    flags.forEach(f => {
      if (progress.labs && progress.labs[`flag-${f.id}`]) {
        state.flagsDone.add(f.id);
        const fEl = mount.querySelector(`#qe-flag-${f.id}`);
        if (fEl) fEl.classList.add('qe-flag-done');
        const fbEl = mount.querySelector(`#qe-ffb-${f.id}`);
        if (fbEl) fbEl.innerHTML = `<span class="qe-correct-text">${_ui('quizFlagAccepted')}</span>`;
      }
    });
    _updateProgress(mount, state);

    // Wire up MC and TF buttons
    mount.querySelectorAll('.qe-opt').forEach(btn => {
      _listen(moduleId, btn, 'click', () => {
        const qid = btn.dataset.qid;
        if (state.answers[qid]) return; // already correct

        const q = questions.find(x => x.id === qid);
        if (!q) return;

        // Deselect siblings
        mount.querySelectorAll(`.qe-opt[data-qid="${qid}"]`).forEach(b => b.classList.remove('qe-selected', 'qe-wrong'));
        btn.classList.add('qe-selected');

        const val = btn.dataset.val;
        const expected = q.type === 'tf' ? String(q.answer) : q.answer;
        const fb = mount.querySelector(`#qe-fb-${qid}`);

        if (val === expected) {
          btn.classList.add('qe-correct-opt');
          state.answers[qid] = true;
          if (fb) fb.innerHTML = `<span class="qe-correct-text">${_ui('quizCorrect')}</span>`;
          const qEl = mount.querySelector(`#qe-${qid}`);
          if (qEl) qEl.classList.add('qe-correct');
          const statusEl = mount.querySelector(`#qe-status-${qid}`);
          if (statusEl) statusEl.textContent = '\u2713';
          Router.markLabComplete(moduleId, `quiz-${qid}`);
          _updateProgress(mount, state);
          _checkAllDone(mount, moduleId, state, config);
        } else {
          btn.classList.add('qe-wrong');
          if (fb) {
            let hint = _t(q, 'hint') ? ` <span class="qe-hint">${_t(q, 'hint')}</span>` : '';
            fb.innerHTML = `<span class="qe-wrong-text">${_ui('quizIncorrect')}</span>${hint}`;
          }
        }
      });
    });

    // Wire up fill-in-the-blank
    mount.querySelectorAll('.qe-fill-btn').forEach(btn => {
      _listen(moduleId, btn, 'click', async () => {
        const qid = btn.dataset.qid;
        if (state.answers[qid]) return;
        const q = questions.find(x => x.id === qid);
        if (!q) return;
        const input = mount.querySelector(`#qe-input-${qid}`);
        const fb = mount.querySelector(`#qe-fb-${qid}`);
        if (!input) return;

        const val = input.value.trim().toLowerCase();
        const hash = await Utils.sha256(val);

        if (hash === q.answerHash) {
          state.answers[qid] = true;
          input.classList.add('qe-input-correct');
          input.disabled = true;
          btn.disabled = true;
          if (fb) fb.innerHTML = `<span class="qe-correct-text">${_ui('quizCorrect')}</span>`;
          const qEl = mount.querySelector(`#qe-${qid}`);
          if (qEl) qEl.classList.add('qe-correct');
          const statusEl = mount.querySelector(`#qe-status-${qid}`);
          if (statusEl) statusEl.textContent = '\u2713';
          Router.markLabComplete(moduleId, `quiz-${qid}`);
          _updateProgress(mount, state);
          _checkAllDone(mount, moduleId, state, config);
        } else {
          input.classList.add('qe-input-wrong');
          setTimeout(() => input.classList.remove('qe-input-wrong'), 600);
          if (fb) {
            let hint = _t(q, 'hint') ? ` <span class="qe-hint">${_t(q, 'hint')}</span>` : '';
            fb.innerHTML = `<span class="qe-wrong-text">${_ui('quizIncorrect')}</span>${hint}`;
          }
        }
      });

      // Allow Enter key
      const qid = btn.dataset.qid;
      const input = mount.querySelector(`#qe-input-${qid}`);
      if (input) {
        _listen(moduleId, input, 'keydown', (e) => {
          if (e.key === 'Enter') btn.click();
        });
      }
    });

    // Wire up ordering questions (drag and drop)
    mount.querySelectorAll('.qe-order').forEach(orderEl => {
      let draggedItem = null;
      orderEl.querySelectorAll('.qe-order-item').forEach(item => {
        _listen(moduleId, item, 'dragstart', (e) => {
          draggedItem = item;
          item.classList.add('qe-dragging');
          e.dataTransfer.effectAllowed = 'move';
        });
        _listen(moduleId, item, 'dragend', () => {
          item.classList.remove('qe-dragging');
          draggedItem = null;
        });
        _listen(moduleId, item, 'dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (draggedItem && draggedItem !== item) {
            const rect = item.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (e.clientY < midY) {
              orderEl.insertBefore(draggedItem, item);
            } else {
              orderEl.insertBefore(draggedItem, item.nextSibling);
            }
          }
        });
      });
    });

    // Wire up order check buttons
    mount.querySelectorAll('.qe-order-check').forEach(btn => {
      _listen(moduleId, btn, 'click', () => {
        const qid = btn.dataset.qid;
        if (state.answers[qid]) return;
        const q = questions.find(x => x.id === qid);
        if (!q) return;
        const orderEl = mount.querySelector(`#qe-order-${qid}`);
        if (!orderEl) return;
        const fb = mount.querySelector(`#qe-fb-${qid}`);

        const currentOrder = [...orderEl.querySelectorAll('.qe-order-item')].map(el => parseInt(el.dataset.oidx));
        const isCorrect = q.correctOrder.every((v, i) => v === currentOrder[i]);

        if (isCorrect) {
          state.answers[qid] = true;
          orderEl.classList.add('qe-order-correct');
          btn.disabled = true;
          if (fb) fb.innerHTML = `<span class="qe-correct-text">${_ui('quizCorrectOrder')}</span>`;
          const qEl = mount.querySelector(`#qe-${qid}`);
          if (qEl) qEl.classList.add('qe-correct');
          const statusEl = mount.querySelector(`#qe-status-${qid}`);
          if (statusEl) statusEl.textContent = '\u2713';
          Router.markLabComplete(moduleId, `quiz-${qid}`);
          _updateProgress(mount, state);
          _checkAllDone(mount, moduleId, state, config);
        } else {
          orderEl.classList.add('qe-order-wrong');
          setTimeout(() => orderEl.classList.remove('qe-order-wrong'), 600);
          if (fb) {
            let hint = _t(q, 'hint') ? ` <span class="qe-hint">${_t(q, 'hint')}</span>` : '';
            fb.innerHTML = `<span class="qe-wrong-text">${_ui('quizWrongOrder')}</span>${hint}`;
          }
        }
      });
    });

    // Wire up flag inputs
    mount.querySelectorAll('.qe-flag-btn').forEach(btn => {
      _listen(moduleId, btn, 'click', async () => {
        const fid = btn.dataset.fid;
        if (state.flagsDone.has(fid)) return;
        const f = flags.find(x => x.id === fid);
        if (!f) return;
        const input = mount.querySelector(`#qe-finput-${fid}`);
        const fb = mount.querySelector(`#qe-ffb-${fid}`);
        if (!input) return;

        const val = input.value.trim();
        const isValid = await Utils.validateFlag(val, f.hash);

        if (isValid) {
          state.flagsDone.add(fid);
          input.classList.add('qe-input-correct');
          input.disabled = true;
          btn.disabled = true;
          const fEl = mount.querySelector(`#qe-flag-${fid}`);
          if (fEl) fEl.classList.add('qe-flag-done');
          if (fb) fb.innerHTML = '<span class="qe-correct-text">Flag accepted!</span>';
          Router.markLabComplete(moduleId, `flag-${fid}`);
          _updateProgress(mount, state);
          _checkAllDone(mount, moduleId, state, config);
        } else {
          input.classList.add('qe-input-wrong');
          setTimeout(() => input.classList.remove('qe-input-wrong'), 600);
          if (fb) fb.innerHTML = `<span class="qe-wrong-text">${_ui('quizFlagInvalid')}</span>`;
        }
      });

      // Enter key support
      const fid = btn.dataset.fid;
      const input = mount.querySelector(`#qe-finput-${fid}`);
      if (input) {
        _listen(moduleId, input, 'keydown', (e) => {
          if (e.key === 'Enter') btn.click();
        });
      }
    });
  }

  function _updateProgress(mount, state) {
    const done = Object.keys(state.answers).filter(k => state.answers[k]).length + state.flagsDone.size;
    const progEl = mount.querySelector('#qe-progress');
    if (progEl) {
      progEl.textContent = `${done} / ${state.totalItems}`;
      if (done === state.totalItems) progEl.classList.add('qe-all-done');
    }
  }

  function _checkAllDone(mount, moduleId, state, config) {
    const questions = config.questions || [];
    const flags = config.flags || [];
    const allQ = questions.every(q => state.answers[q.id]);
    const allF = flags.every(f => state.flagsDone.has(f.id));
    if (allQ && allF) {
      const resultEl = mount.querySelector('#qe-result');
      if (resultEl) {
        resultEl.innerHTML = `<div class="qe-complete">${_ui('quizAllComplete')}</div>`;
        resultEl.classList.add('qe-visible');
      }
      if (config.onComplete) config.onComplete();
    }
  }

  function cleanup(moduleId) {
    const list = listeners.get(moduleId);
    if (list) {
      list.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
      listeners.delete(moduleId);
    }
  }

  // Expose for the minigame: get quiz completion stats
  function getStats() {
    const allProgress = Storage.getAllProgress();
    let totalQuizzes = 0;
    let completedQuizzes = 0;
    let totalFlags = 0;
    let completedFlags = 0;

    for (const [moduleId, labs] of Object.entries(allProgress)) {
      for (const [labId, done] of Object.entries(labs)) {
        if (labId.startsWith('quiz-')) {
          totalQuizzes++;
          if (done) completedQuizzes++;
        } else if (labId.startsWith('flag-')) {
          totalFlags++;
          if (done) completedFlags++;
        }
      }
    }
    return { totalQuizzes, completedQuizzes, totalFlags, completedFlags };
  }

  return { init, cleanup, getStats };
})();
