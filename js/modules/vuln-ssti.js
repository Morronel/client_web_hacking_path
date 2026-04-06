/* ============================================
   Module 3: Server-Side Template Injection
   ============================================ */

const vulnSsti = (() => {
  let listeners = [];
  let pyodide = null;
  let loadingPromise = null;

  function listen(el, evt, fn) {
    el.addEventListener(evt, fn);
    listeners.push({ el, evt, fn });
  }

  async function loadPyodideRuntime(statusEl) {
    if (pyodide) return pyodide;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      if (!window.loadPyodide) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Pyodide'));
          document.head.appendChild(script);
        });
      }

      const py = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
      });

      await py.loadPackage('micropip');
      const micropip = py.pyimport('micropip');
      await micropip.install('jinja2');

      pyodide = py;
      return py;
    })();

    return loadingPromise;
  }

  function initLab1(container) {
    const loadingEl = Utils.$('#pyodide-loading', container);
    const contentEl = Utils.$('#lab1-content', container);
    const inputEl = Utils.$('#ssti-input', container);
    const renderBtn = Utils.$('#ssti-render-btn', container);
    const outputEl = Utils.$('#ssti-output', container);
    const bannerEl = Utils.$('#lab1-banner', container);
    const statusEl = Utils.$('#lab1-status', container);

    if (Storage.isLabCompleted('vuln-ssti', 'lab1')) {
      statusEl.textContent = '✓ Completed';
      statusEl.classList.add('solved');
    }

    loadPyodideRuntime(loadingEl).then(() => {
      loadingEl.style.display = 'none';
      contentEl.style.display = 'block';
    }).catch(err => {
      loadingEl.innerHTML = `<span class="text-red">Failed to load Python runtime: ${Utils.escapeHtml(err.message)}</span>
        <br><span class="text-muted">Try refreshing the page. Pyodide requires ~10MB download.</span>`;
    });

    listen(renderBtn, 'click', async () => {
      const userInput = inputEl.value;
      if (!pyodide) {
        outputEl.textContent = 'Python runtime still loading...';
        return;
      }

      try {
        const result = await pyodide.runPythonAsync(`
from jinja2 import Environment
env = Environment()
secret_flag = "SSTI{t3mpl4t3_1nj3ct10n_ftw}"
user_input = ${JSON.stringify(userInput)}
template_str = "Hello " + user_input + "! Welcome to our site."
try:
    template = env.from_string(template_str)
    result = template.render(secret_flag=secret_flag)
except Exception as e:
    result = f"Template Error: {e}"
result
`);
        outputEl.textContent = result;

        if (result.includes('SSTI{t3mpl4t3_1nj3ct10n_ftw}')) {
          bannerEl.classList.add('visible');
          Router.markLabComplete('vuln-ssti', 'lab1');
          statusEl.textContent = '✓ Completed';
          statusEl.classList.add('solved');
        }
      } catch (err) {
        outputEl.textContent = 'Error: ' + err.message;
      }
    });

    listen(inputEl, 'keydown', (e) => {
      if (e.key === 'Enter') renderBtn.click();
    });
  }

  const quizQuestions = [
    {
      probe: '{{7*7}}',
      output: '49',
      options: ['Jinja2 / Twig', 'Mako', 'ERB', 'Handlebars'],
      correct: 0,
      explanation: 'Both Jinja2 and Twig use {{ }} syntax and evaluate expressions.'
    },
    {
      probe: "{{7*'7'}}",
      output: '7777777',
      options: ['Twig', 'Jinja2', 'FreeMarker', 'Pug'],
      correct: 1,
      explanation: "Jinja2 treats 7*'7' as string repetition → '7777777'. Twig would output 49."
    },
    {
      probe: '${7*7}',
      output: '49',
      options: ['Jinja2', 'ERB', 'Mako / FreeMarker', 'Handlebars'],
      correct: 2,
      explanation: 'The ${} syntax is used by Mako (Python) and FreeMarker (Java).'
    },
    {
      probe: '<%= 7*7 %>',
      output: '49',
      options: ['Jinja2', 'Twig', 'Pug', 'ERB (Ruby)'],
      correct: 3,
      explanation: 'ERB (Embedded Ruby) uses the <%= %> syntax for expression output.'
    },
    {
      probe: '#{7*7}',
      output: '49',
      options: ['Mako', 'Twig', 'Handlebars', 'Pug / Jade'],
      correct: 3,
      explanation: 'Pug (formerly Jade) uses #{} for interpolation in Node.js templates.'
    }
  ];

  function initLab2(container) {
    const quizContainer = Utils.$('#quiz-container', container);
    const resultDiv = Utils.$('#quiz-result', container);
    const scoreEl = Utils.$('#quiz-score', container);
    const feedbackEl = Utils.$('#quiz-feedback', container);
    const bannerEl = Utils.$('#lab2-banner', container);
    const statusEl = Utils.$('#lab2-status', container);

    if (Storage.isLabCompleted('vuln-ssti', 'lab2')) {
      statusEl.textContent = '✓ Completed';
      statusEl.classList.add('solved');
    }

    let answers = new Array(quizQuestions.length).fill(-1);

    let html = '';
    quizQuestions.forEach((q, i) => {
      html += `<div class="panel mb-md">
        <h4>Question ${i + 1}</h4>
        <p class="text-muted" style="margin-bottom:4px;">Probe input:</p>
        <code>${Utils.escapeHtml(q.probe)}</code>
        <p class="text-muted mt-sm" style="margin-bottom:4px;">Server output:</p>
        <code class="text-green">${Utils.escapeHtml(q.output)}</code>
        <p class="mt-md" style="margin-bottom:8px;"><strong>Which template engine?</strong></p>
        <div class="flex flex-wrap gap-sm quiz-options" data-question="${i}">
          ${q.options.map((opt, j) =>
            `<button class="btn btn-secondary btn-sm quiz-opt" data-q="${i}" data-opt="${j}">${Utils.escapeHtml(opt)}</button>`
          ).join('')}
        </div>
        <div class="quiz-explain" id="explain-${i}" style="display:none;margin-top:8px;"></div>
      </div>`;
    });

    html += '<button class="btn btn-primary mt-md" id="quiz-submit">Submit Answers</button>';
    quizContainer.innerHTML = html;

    // Option click handlers
    Utils.$$('.quiz-opt', quizContainer).forEach(btn => {
      listen(btn, 'click', () => {
        const qi = parseInt(btn.dataset.q);
        const oi = parseInt(btn.dataset.opt);
        answers[qi] = oi;
        // Highlight selected
        Utils.$$(`.quiz-opt[data-q="${qi}"]`, quizContainer).forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-secondary');
        });
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
      });
    });

    listen(Utils.$('#quiz-submit', quizContainer), 'click', () => {
      let score = 0;
      quizQuestions.forEach((q, i) => {
        const explainEl = Utils.$(`#explain-${i}`, quizContainer);
        if (answers[i] === q.correct) {
          score++;
          explainEl.innerHTML = `<span class="text-green">✓ Correct!</span> ${Utils.escapeHtml(q.explanation)}`;
        } else {
          explainEl.innerHTML = `<span class="text-red">✗ Wrong.</span> Correct: <strong>${Utils.escapeHtml(q.options[q.correct])}</strong>. ${Utils.escapeHtml(q.explanation)}`;
        }
        explainEl.style.display = 'block';
      });

      resultDiv.style.display = 'block';
      scoreEl.textContent = `Score: ${score} / ${quizQuestions.length}`;

      if (score >= 4) {
        feedbackEl.textContent = 'Great job! You can identify template engines from their output.';
        feedbackEl.className = 'text-green';
        bannerEl.classList.add('visible');
        Router.markLabComplete('vuln-ssti', 'lab2');
        statusEl.textContent = '✓ Completed';
        statusEl.classList.add('solved');
      } else {
        feedbackEl.textContent = 'You need at least 4/5 to pass. Review the theory and try again.';
        feedbackEl.className = 'text-amber';
      }
    });
  }

  function init(container) {
    initLab1(container);
    initLab2(container);

    QuizEngine.init(container, 'vuln-ssti', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What makes SSTI different from XSS?',
          text_uk: 'Чим SSTI відрізняється від XSS?',
          options: [
            { value: 'a', label: 'SSTI only affects the client-side browser', label_uk: 'SSTI впливає тільки на клієнтський браузер' },
            { value: 'b', label: 'SSTI executes code on the server via the template engine, not in the browser', label_uk: 'SSTI виконує код на сервері через шаблонізатор, а не в браузері' },
            { value: 'c', label: 'SSTI requires authentication to exploit', label_uk: 'SSTI вимагає автентифікації для експлуатації' },
            { value: 'd', label: 'SSTI only works with Python applications', label_uk: 'SSTI працює тільки з Python-додатками' }
          ],
          answer: 'b',
          hint: 'The "Server-Side" in SSTI means code runs on the server.',
          hint_uk: '"Server-Side" в SSTI означає, що код виконується на сервері.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Which probe confirms Jinja2 SSTI specifically (not Twig)?',
          text_uk: 'Який зонд підтверджує саме Jinja2 SSTI (а не Twig)?',
          options: [
            { value: 'a', label: '<code>{{7*7}}</code> returns 49', label_uk: '<code>{{7*7}}</code> повертає 49' },
            { value: 'b', label: '<code>{{7*\'7\'}}</code> returns 7777777', label_uk: '<code>{{7*\'7\'}}</code> повертає 7777777' },
            { value: 'c', label: '<code>${7*7}</code> returns 49', label_uk: '<code>${7*7}</code> повертає 49' },
            { value: 'd', label: '<code>&lt;%= 7*7 %&gt;</code> returns 49', label_uk: '<code>&lt;%= 7*7 %&gt;</code> повертає 49' }
          ],
          answer: 'b',
          hint: 'String multiplication (7*\'7\') is a Python-specific behavior.',
          hint_uk: 'Множення рядків (7*\'7\') — це поведінка, специфічна для Python.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'Passing user input as a template variable (e.g., <code>render_template_string("Hello {{ name }}!", name=name)</code>) is safe from SSTI.',
          text_uk: 'Передача введення користувача як змінної шаблону (наприклад, <code>render_template_string("Hello {{ name }}!", name=name)</code>) є безпечною від SSTI.',
          answer: true,
          hint: 'When input is a variable, the template engine treats it as data, not code.',
          hint_uk: 'Коли введення є змінною, шаблонізатор обробляє його як дані, а не як код.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'In Jinja2 exploitation, why do attackers access <code>__mro__</code> and <code>__subclasses__()</code>?',
          text_uk: 'Чому при експлуатації Jinja2 зловмисники звертаються до <code>__mro__</code> та <code>__subclasses__()</code>?',
          options: [
            { value: 'a', label: 'To encrypt the payload', label_uk: 'Щоб зашифрувати пейлоад' },
            { value: 'b', label: 'To traverse the Python class hierarchy and find classes that can execute OS commands', label_uk: 'Щоб пройти ієрархією класів Python та знайти класи, які можуть виконувати команди ОС' },
            { value: 'c', label: 'To bypass the Same-Origin Policy', label_uk: 'Щоб обійти Same-Origin Policy' },
            { value: 'd', label: 'To inject SQL into the template', label_uk: 'Щоб впровадити SQL у шаблон' }
          ],
          answer: 'b',
          hint: 'The goal is to find subprocess.Popen or os._wrap_close in the subclass list.',
          hint_uk: 'Мета — знайти subprocess.Popen або os._wrap_close у списку підкласів.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'Jinja2\'s SandboxedEnvironment is a fully reliable defense that makes SSTI exploitation impossible.',
          text_uk: 'SandboxedEnvironment у Jinja2 є повністю надійним захистом, що унеможливлює експлуатацію SSTI.',
          answer: false,
          hint: 'Sandbox escapes have been found multiple times — the real fix is never putting user input in the template string.',
          hint_uk: 'Обходи пісочниці знаходили неодноразово — справжнє рішення — ніколи не поміщати введення користувача в рядок шаблону.'
        }
      ],
      flags: [
        { id: 'f1', label: 'Flask Lab — Template Detection', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10 },
        { id: 'f2', label: 'Flask Lab — RCE via SSTI', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20 }
      ]
    });
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
    QuizEngine.cleanup('vuln-ssti');
  }

  return { init, cleanup };
})();

window.vulnSsti = vulnSsti;
