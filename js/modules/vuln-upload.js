/* ============================================
   Module: File Upload Vulnerabilities
   ============================================ */

window.vulnUpload = (() => {
  let listeners = [];

  function listen(el, evt, fn) {
    el.addEventListener(evt, fn);
    listeners.push({ el, evt, fn });
  }

  const quizAnswers = { 1: 'a', 2: 'c', 3: 'b' };

  function initQuiz(container) {
    const opts = container.querySelectorAll('.quiz-opt');
    const resultEl = container.querySelector('#quiz-result');
    let answers = {};

    opts.forEach(btn => {
      listen(btn, 'click', () => {
        const q = btn.dataset.q;
        const val = btn.dataset.val;
        answers[q] = val;

        // Highlight selected
        container.querySelectorAll(`.quiz-opt[data-q="${q}"]`).forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        // Show feedback
        const fb = container.querySelector(`#q${q}-feedback`);
        if (fb) {
          if (val === quizAnswers[q]) {
            fb.innerHTML = '<span class="text-green">Correct!</span>';
            fb.className = 'quiz-feedback correct';
          } else {
            fb.innerHTML = '<span class="text-red">Incorrect. Try again.</span>';
            fb.className = 'quiz-feedback incorrect';
          }
        }

        // Check if all answered correctly
        const allCorrect = Object.keys(quizAnswers).every(k => answers[k] === quizAnswers[k]);
        if (allCorrect && resultEl) {
          resultEl.innerHTML = '<div class="alert alert-success">All correct! Quiz completed.</div>';
          Router.markLabComplete('vuln-upload', 'lab1');
        }
      });
    });
  }

  function init(container) {
    initQuiz(container);
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
  }

  return { init, cleanup };
})();
