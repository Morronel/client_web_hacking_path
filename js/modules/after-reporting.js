/* ============================================
   Module: Reporting & Responsible Disclosure
   ============================================ */

window.afterReporting = (() => {
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
    if (statusEl && Storage.isLabCompleted('after-reporting', `lab${labNum}`)) {
      statusEl.textContent = 'Completed';
      statusEl.classList.add('completed');
    }
  }

  // Correct answers: q1=a, q2=b, q3=a, q4=b
  const ANSWERS = { q1: 'a', q2: 'b', q3: 'a', q4: 'b' };
  const PASS_THRESHOLD = 3;

  function initLab1() {
    const submitBtn = Utils.$('#quiz1-submit', container);
    const resetBtn = Utils.$('#quiz1-reset', container);
    const resultEl = Utils.$('#quiz1-result', container);

    listen(submitBtn, 'click', () => {
      let score = 0;
      const total = Object.keys(ANSWERS).length;

      for (const [qName, correct] of Object.entries(ANSWERS)) {
        const selected = Utils.$(`input[name="${qName}"]:checked`, container);
        const questionEl = Utils.$(`#${qName}`, container);

        if (!questionEl) continue;

        // Reset previous styling
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
          // Highlight the correct answer
          const correctInput = Utils.$(`input[name="${qName}"][value="${correct}"]`, container);
          if (correctInput) {
            correctInput.closest('.quiz-option').classList.add('correct');
          }
        }
      }

      resultEl.style.display = '';
      if (score >= PASS_THRESHOLD) {
        resultEl.innerHTML = `<span class="text-green"><strong>Passed!</strong> You got ${score}/${total} correct.</span>`;
        if (!Storage.isLabCompleted('after-reporting', 'lab1')) {
          Router.markLabComplete('after-reporting', 'lab1');
          showBanner(1);
          syncLabStatus(1);
        }
      } else {
        resultEl.innerHTML = `<span class="text-red"><strong>Not quite.</strong> You got ${score}/${total} correct. You need at least ${PASS_THRESHOLD}/${total} to pass.</span>`;
        resetBtn.style.display = '';
      }

      submitBtn.style.display = 'none';
    });

    listen(resetBtn, 'click', () => {
      // Clear all selections and styling
      for (const qName of Object.keys(ANSWERS)) {
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

    syncLabStatus(1);
    if (Storage.isLabCompleted('after-reporting', 'lab1')) showBanner(1);
  }

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
