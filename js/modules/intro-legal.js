/* ============================================
   Module — Legal & Ethics
   ============================================ */

window.introLegal = (() => {
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
    if (statusEl && Storage.isLabCompleted('intro-legal', `lab${labNum}`)) {
      statusEl.textContent = 'Completed';
      statusEl.classList.add('completed');
    }
  }

  // ---- Lab 1: Legal Scenarios Quiz ----

  function initLab1() {
    const correctAnswers = { 1: 'b', 2: 'a', 3: 'b' };
    const selected = {};

    // Wire up option buttons
    const options = container.querySelectorAll('.quiz-option');
    options.forEach(btn => {
      listen(btn, 'click', () => {
        const q = btn.dataset.q;
        // Deselect siblings
        const siblings = container.querySelectorAll(`.quiz-option[data-q="${q}"]`);
        siblings.forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        selected[q] = btn.dataset.val;
      });
    });

    const submitBtn = $('#lab1-submit', container);
    const resultEl = $('#lab1-result', container);

    listen(submitBtn, 'click', () => {
      // Check that all questions answered
      if (Object.keys(selected).length < 3) {
        resultEl.innerHTML = '<span class="text-red">Please answer all 3 questions before submitting.</span>';
        return;
      }

      let score = 0;
      for (const q of ['1', '2', '3']) {
        const feedbackEl = $(`#q${q}-feedback`, container);
        const isCorrect = selected[q] === correctAnswers[q];
        if (isCorrect) {
          score++;
          if (feedbackEl) feedbackEl.innerHTML = '<span class="text-green">Correct!</span>';
        } else {
          if (feedbackEl) feedbackEl.innerHTML = '<span class="text-red">Incorrect.</span>';
        }
      }

      if (score === 3) {
        resultEl.innerHTML = '<span class="text-green">Perfect score! 3/3 — All correct.</span>';
        if (!Storage.isLabCompleted('intro-legal', 'lab1')) {
          Router.markLabComplete('intro-legal', 'lab1');
          showBanner(1);
          syncLabStatus(1);
        }
      } else {
        resultEl.innerHTML = `<span class="text-red">You got ${score}/3. You need all 3 correct to pass. Try again!</span>`;
      }
    });

    syncLabStatus(1);
    if (Storage.isLabCompleted('intro-legal', 'lab1')) showBanner(1);
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
