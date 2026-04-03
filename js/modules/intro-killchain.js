/* ============================================
   Module — Cyber Kill Chain
   ============================================ */

window.introKillchain = (() => {
  const { $ } = Utils;

  let listeners = [];
  let container = null;

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
    if (statusEl && Storage.isLabCompleted('intro-killchain', `lab${labNum}`)) {
      statusEl.textContent = 'Completed';
      statusEl.classList.add('completed');
    }
  }

  // ---- Lab 1: Kill Chain Ordering & Quiz ----

  function initLab1() {
    const correctOrder = [
      'Reconnaissance',
      'Weaponization',
      'Delivery',
      'Exploitation',
      'Installation',
      'Command & Control',
      'Actions on Objectives'
    ];

    const correctAnswers = { 1: 'b', 2: 'c', 3: 'd' };

    let selectedPhases = [];
    const selected = {};

    const phaseButtons = container.querySelectorAll('.phase-btn');
    const orderDisplay = $('#order-display', container);
    const resetBtn = $('#reset-order', container);
    const orderFeedback = $('#order-feedback', container);

    function updateOrderDisplay() {
      if (selectedPhases.length === 0) {
        orderDisplay.innerHTML = '<span class="text-muted">Click phases above...</span>';
      } else {
        orderDisplay.textContent = selectedPhases.map((p, i) => `${i + 1}. ${p}`).join('  →  ');
      }
    }

    phaseButtons.forEach(btn => {
      listen(btn, 'click', () => {
        if (btn.disabled) return;
        const phase = btn.dataset.phase;
        if (selectedPhases.includes(phase)) return;
        selectedPhases.push(phase);
        btn.disabled = true;
        btn.classList.add('active');
        updateOrderDisplay();

        if (selectedPhases.length === 7) {
          const isCorrect = selectedPhases.every((p, i) => p === correctOrder[i]);
          if (isCorrect) {
            orderFeedback.innerHTML = '<span class="text-green">Correct order!</span>';
          } else {
            orderFeedback.innerHTML = '<span class="text-red">Incorrect order. Reset and try again.</span>';
          }
        }
      });
    });

    listen(resetBtn, 'click', () => {
      selectedPhases = [];
      phaseButtons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('active');
      });
      updateOrderDisplay();
      orderFeedback.innerHTML = '';
    });

    // Quiz options
    const quizOptions = container.querySelectorAll('.quiz-option');
    quizOptions.forEach(btn => {
      listen(btn, 'click', () => {
        const q = btn.dataset.q;
        const siblings = container.querySelectorAll(`.quiz-option[data-q="${q}"]`);
        siblings.forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        selected[q] = btn.dataset.val;
      });
    });

    const submitBtn = $('#lab1-submit', container);
    const resultEl = $('#lab1-result', container);

    listen(submitBtn, 'click', () => {
      // Check ordering is complete
      if (selectedPhases.length < 7) {
        resultEl.innerHTML = '<span class="text-red">Please complete the phase ordering first (click all 7 phases).</span>';
        return;
      }

      // Check quiz answers complete
      if (Object.keys(selected).length < 3) {
        resultEl.innerHTML = '<span class="text-red">Please answer all 3 quiz questions.</span>';
        return;
      }

      // Evaluate ordering
      const orderCorrect = selectedPhases.every((p, i) => p === correctOrder[i]);
      if (orderCorrect) {
        orderFeedback.innerHTML = '<span class="text-green">Correct order!</span>';
      } else {
        orderFeedback.innerHTML = '<span class="text-red">Incorrect order. The correct order is: ' +
          correctOrder.join(' → ') + '</span>';
      }

      // Evaluate quiz
      let quizScore = 0;
      for (const q of ['1', '2', '3']) {
        const feedbackEl = $(`#q${q}-feedback`, container);
        const isCorrect = selected[q] === correctAnswers[q];
        if (isCorrect) {
          quizScore++;
          if (feedbackEl) feedbackEl.innerHTML = '<span class="text-green">Correct!</span>';
        } else {
          if (feedbackEl) feedbackEl.innerHTML = '<span class="text-red">Incorrect.</span>';
        }
      }

      // Check pass criteria: correct order + at least 2/3 quiz
      if (orderCorrect && quizScore >= 2) {
        resultEl.innerHTML = `<span class="text-green">Passed! Correct order and ${quizScore}/3 questions right.</span>`;
        if (!Storage.isLabCompleted('intro-killchain', 'lab1')) {
          Router.markLabComplete('intro-killchain', 'lab1');
          showBanner(1);
          syncLabStatus(1);
        }
      } else {
        const issues = [];
        if (!orderCorrect) issues.push('incorrect phase order');
        if (quizScore < 2) issues.push(`only ${quizScore}/3 questions correct (need 2)`);
        resultEl.innerHTML = `<span class="text-red">Not passed: ${issues.join(', ')}. Reset and try again!</span>`;
      }
    });

    syncLabStatus(1);
    if (Storage.isLabCompleted('intro-killchain', 'lab1')) showBanner(1);
  }

  // ---- Public interface ----

  function init(cont) {
    container = cont;
    initLab1();
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
