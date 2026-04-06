/* ============================================
   Module — Same-Origin Policy & CORS
   ============================================ */

window.introSop = (() => {
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
    if (statusEl && Storage.isLabCompleted('intro-sop', `lab${labNum}`)) {
      statusEl.textContent = 'Completed';
      statusEl.classList.add('completed');
    }
  }

  // ---- Helper: parse origin from URL ----

  function parseOrigin(urlStr) {
    try {
      // Ensure the URL has a scheme
      if (!/^https?:\/\//i.test(urlStr)) return null;
      const url = new URL(urlStr);
      // Determine the effective port
      let port = url.port;
      if (!port) {
        port = url.protocol === 'https:' ? '443' : '80';
      }
      return {
        scheme: url.protocol.replace(':', ''),
        host: url.hostname.toLowerCase(),
        port: port
      };
    } catch {
      return null;
    }
  }

  function isSameOrigin(url1, url2) {
    const o1 = parseOrigin(url1);
    const o2 = parseOrigin(url2);
    if (!o1 || !o2) return null; // invalid URL
    return o1.scheme === o2.scheme && o1.host === o2.host && o1.port === o2.port;
  }

  // ---- Lab 1: SOP Checker ----

  function initLab1() {
    let correctCount = 0;
    const REQUIRED = 5;

    const url1El = $('#sop-url1', container);
    const url2El = $('#sop-url2', container);
    const sameBtn = $('#sop-same', container);
    const diffBtn = $('#sop-diff', container);
    const feedbackEl = $('#sop-feedback', container);
    const progressEl = $('#sop-progress', container);

    function updateProgress() {
      progressEl.textContent = `Correct answers: ${correctCount} / ${REQUIRED}`;
    }

    function handleAnswer(userSaysSame) {
      const u1 = url1El.value.trim();
      const u2 = url2El.value.trim();

      if (!u1 || !u2) {
        feedbackEl.innerHTML = '<span class="text-red">Please enter both URLs.</span>';
        return;
      }

      const result = isSameOrigin(u1, u2);
      if (result === null) {
        feedbackEl.innerHTML = '<span class="text-red">Invalid URL(s). Make sure both start with http:// or https://</span>';
        return;
      }

      const o1 = parseOrigin(u1);
      const o2 = parseOrigin(u2);
      const originStr1 = `${o1.scheme}://${o1.host}:${o1.port}`;
      const originStr2 = `${o2.scheme}://${o2.host}:${o2.port}`;

      if (userSaysSame === result) {
        correctCount++;
        const explanation = result
          ? `Both origins are <strong>${originStr1}</strong>.`
          : `Origin 1: <strong>${originStr1}</strong> vs Origin 2: <strong>${originStr2}</strong>.`;
        feedbackEl.innerHTML = `<span class="text-green">Correct!</span> ${explanation}`;
        updateProgress();

        if (correctCount >= REQUIRED && !Storage.isLabCompleted('intro-sop', 'lab1')) {
          Router.markLabComplete('intro-sop', 'lab1');
          showBanner(1);
          syncLabStatus(1);
        }
      } else {
        const explanation = result
          ? `They ARE the same origin: <strong>${originStr1}</strong>.`
          : `They are DIFFERENT origins. Origin 1: <strong>${originStr1}</strong> vs Origin 2: <strong>${originStr2}</strong>.`;
        feedbackEl.innerHTML = `<span class="text-red">Incorrect.</span> ${explanation}`;
      }

      // Clear inputs for next pair
      url1El.value = '';
      url2El.value = '';
    }

    listen(sameBtn, 'click', () => handleAnswer(true));
    listen(diffBtn, 'click', () => handleAnswer(false));

    syncLabStatus(1);
    if (Storage.isLabCompleted('intro-sop', 'lab1')) showBanner(1);
    updateProgress();
  }

  // ---- Lab 2: CORS Misconfiguration Quiz ----

  function initLab2() {
    const correctAnswers = { c1: 'b', c2: 'b', c3: 'b', c4: 'c' };
    const selected = {};

    const quizOptions = container.querySelectorAll('#lab2 .quiz-option');
    quizOptions.forEach(btn => {
      listen(btn, 'click', () => {
        const q = btn.dataset.q;
        const siblings = container.querySelectorAll(`.quiz-option[data-q="${q}"]`);
        siblings.forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        selected[q] = btn.dataset.val;
      });
    });

    const submitBtn = $('#lab2-submit', container);
    const resultEl = $('#lab2-result', container);

    listen(submitBtn, 'click', () => {
      if (Object.keys(selected).length < 4) {
        resultEl.innerHTML = '<span class="text-red">Please answer all 4 questions before submitting.</span>';
        return;
      }

      let score = 0;
      for (const q of ['c1', 'c2', 'c3', 'c4']) {
        const feedbackEl = $(`#cors-${q}-feedback`, container);
        const isCorrect = selected[q] === correctAnswers[q];
        if (isCorrect) {
          score++;
          if (feedbackEl) feedbackEl.innerHTML = '<span class="text-green">Correct!</span>';
        } else {
          if (feedbackEl) feedbackEl.innerHTML = '<span class="text-red">Incorrect.</span>';
        }
      }

      if (score >= 3) {
        resultEl.innerHTML = `<span class="text-green">Passed! ${score}/4 correct.</span>`;
        if (!Storage.isLabCompleted('intro-sop', 'lab2')) {
          Router.markLabComplete('intro-sop', 'lab2');
          showBanner(2);
          syncLabStatus(2);
        }
      } else {
        resultEl.innerHTML = `<span class="text-red">You got ${score}/4. You need at least 3 correct to pass. Try again!</span>`;
      }
    });

    syncLabStatus(2);
    if (Storage.isLabCompleted('intro-sop', 'lab2')) showBanner(2);
  }

  // ---- Public interface ----

  function init(cont) {
    container = cont;
    initLab1();
    initLab2();

    QuizEngine.init(container, 'intro-sop', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What three components define an "origin" in the Same-Origin Policy?',
          text_uk: 'Які три компоненти визначають "origin" у Same-Origin Policy?',
          options: [
            { value: 'a', label: 'Domain, path, and query string', label_uk: 'Домен, шлях та рядок запиту' },
            { value: 'b', label: 'Scheme, host, and port', label_uk: 'Схема, хост та порт' },
            { value: 'c', label: 'Protocol, domain, and path', label_uk: 'Протокол, домен та шлях' },
            { value: 'd', label: 'Host, port, and cookie domain', label_uk: 'Хост, порт та домен cookie' }
          ],
          answer: 'b',
          hint: 'The origin tuple has exactly three parts — think about what makes two URLs "same origin".',
          hint_uk: 'Кортеж origin складається рівно з трьох частин — подумай, що робить два URL "same origin".'
        },
        {
          type: 'tf', id: 'q2',
          text: 'http://example.com and https://example.com are considered the same origin.',
          text_uk: 'http://example.com та https://example.com вважаються одним origin.',
          answer: false,
          hint: 'The scheme (http vs https) is one of the three origin components.',
          hint_uk: 'Схема (http vs https) — один із трьох компонентів origin.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'What does CORS stand for?',
          text_uk: 'Що означає абревіатура CORS?',
          options: [
            { value: 'a', label: 'Cookie Origin Resource Standard', label_uk: 'Cookie Origin Resource Standard' },
            { value: 'b', label: 'Cross-Origin Resource Sharing', label_uk: 'Cross-Origin Resource Sharing' },
            { value: 'c', label: 'Client-Operated Request System', label_uk: 'Client-Operated Request System' },
            { value: 'd', label: 'Centralized Origin Relay Service', label_uk: 'Centralized Origin Relay Service' }
          ],
          answer: 'b',
          hint: 'It is a mechanism that allows controlled access across different origins.',
          hint_uk: 'Це механізм, який дозволяє контрольований доступ між різними origin.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'Which CORS header specifies which origins are allowed to access a resource?',
          text_uk: 'Який CORS-заголовок вказує, яким origin дозволено отримувати доступ до ресурсу?',
          options: [
            { value: 'a', label: 'Access-Control-Allow-Methods', label_uk: 'Access-Control-Allow-Methods' },
            { value: 'b', label: 'Access-Control-Allow-Origin', label_uk: 'Access-Control-Allow-Origin' },
            { value: 'c', label: 'Access-Control-Allow-Headers', label_uk: 'Access-Control-Allow-Headers' },
            { value: 'd', label: 'Access-Control-Max-Age', label_uk: 'Access-Control-Max-Age' }
          ],
          answer: 'b',
          hint: 'The header name itself contains the word "Origin".',
          hint_uk: 'Назва заголовка містить слово "Origin".'
        },
        {
          type: 'tf', id: 'q5',
          text: 'Setting Access-Control-Allow-Origin to * (wildcard) while also allowing credentials is a dangerous CORS misconfiguration.',
          text_uk: 'Встановлення Access-Control-Allow-Origin на * (wildcard) з одночасним дозволом credentials є небезпечною помилкою конфігурації CORS.',
          answer: true,
          hint: 'Wildcard plus credentials means any site can make authenticated requests.',
          hint_uk: 'Wildcard плюс credentials означає, що будь-який сайт може робити автентифіковані запити.'
        }
      ]
    });
  }

  function cleanup() {
    for (const { el, event, handler } of listeners) {
      el.removeEventListener(event, handler);
    }
    listeners = [];
    container = null;
    QuizEngine.cleanup('intro-sop');
  }

  return { init, cleanup };
})();
