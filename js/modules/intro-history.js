/* ============================================
   Module — History of Hacking
   ============================================ */

window.introHistory = (() => {
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
    if (statusEl && Storage.isLabCompleted('intro-history', `lab${labNum}`)) {
      statusEl.textContent = 'Completed';
      statusEl.classList.add('completed');
    }
  }

  // ---- Lab 1: History Quiz ----

  function initLab1() {
    const correctAnswers = { 1: 'b', 2: 'c', 3: 'b', 4: 'c', 5: 'b' };
    const selected = {};

    const options = container.querySelectorAll('.quiz-option');
    options.forEach(btn => {
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
      if (Object.keys(selected).length < 5) {
        resultEl.innerHTML = '<span class="text-red">Please answer all 5 questions before submitting.</span>';
        return;
      }

      let score = 0;
      for (const q of ['1', '2', '3', '4', '5']) {
        const feedbackEl = $(`#q${q}-feedback`, container);
        const isCorrect = selected[q] === correctAnswers[q];
        if (isCorrect) {
          score++;
          if (feedbackEl) feedbackEl.innerHTML = '<span class="text-green">Correct!</span>';
        } else {
          if (feedbackEl) feedbackEl.innerHTML = '<span class="text-red">Incorrect.</span>';
        }
      }

      if (score >= 4) {
        resultEl.innerHTML = `<span class="text-green">Great job! ${score}/5 — You passed!</span>`;
        if (!Storage.isLabCompleted('intro-history', 'lab1')) {
          Router.markLabComplete('intro-history', 'lab1');
          showBanner(1);
          syncLabStatus(1);
        }
      } else {
        resultEl.innerHTML = `<span class="text-red">You got ${score}/5. You need at least 4 correct to pass. Try again!</span>`;
      }
    });

    syncLabStatus(1);
    if (Storage.isLabCompleted('intro-history', 'lab1')) showBanner(1);
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
