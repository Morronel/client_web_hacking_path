/* ============================================
   Module: Command Injection
   ============================================ */

window.vulnCmdi = (() => {

  function init(container) {
    QuizEngine.init(container, 'vuln-cmdi', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'Which Python function is the safest way to run external commands?',
          text_uk: 'Яка функція Python є найбезпечнішою для запуску зовнішніх команд?',
          options: [
            { value: 'a', label: '<code>os.system(cmd)</code>', label_uk: '<code>os.system(cmd)</code>' },
            { value: 'b', label: '<code>os.popen(cmd)</code>', label_uk: '<code>os.popen(cmd)</code>' },
            { value: 'c', label: '<code>subprocess.run(cmd, shell=True)</code>', label_uk: '<code>subprocess.run(cmd, shell=True)</code>' },
            { value: 'd', label: '<code>subprocess.run([cmd, arg1, arg2])</code> (list, no shell)', label_uk: '<code>subprocess.run([cmd, arg1, arg2])</code> (список, без shell)' }
          ],
          answer: 'd',
          hint: 'Think about which approach avoids shell interpretation entirely.',
          hint_uk: 'Подумай, який підхід повністю уникає інтерпретації shell.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Which characters are commonly used for command injection?',
          text_uk: 'Які символи зазвичай використовуються для command injection?',
          options: [
            { value: 'a', label: 'Semicolons (<code>;</code>), pipes (<code>|</code>), backticks, and <code>$()</code>', label_uk: 'Крапка з комою (<code>;</code>), пайпи (<code>|</code>), зворотні лапки та <code>$()</code>' },
            { value: 'b', label: 'Angle brackets and ampersands only', label_uk: 'Тільки кутові дужки та амперсанди' },
            { value: 'c', label: 'Curly braces and square brackets only', label_uk: 'Тільки фігурні та квадратні дужки' },
            { value: 'd', label: 'Quote characters only', label_uk: 'Тільки символи лапок' }
          ],
          answer: 'a',
          hint: 'Shell metacharacters that separate or substitute commands.',
          hint_uk: 'Метасимволи shell, які розділяють або підставляють команди.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'How can blind command injection be detected?',
          text_uk: 'Як можна виявити сліпу (blind) command injection?',
          options: [
            { value: 'a', label: 'By checking the HTTP response code', label_uk: 'Перевіркою коду HTTP-відповіді' },
            { value: 'b', label: 'By checking if the page layout changes', label_uk: 'Перевіркою, чи змінюється розмітка сторінки' },
            { value: 'c', label: 'Using time delays (<code>sleep</code>) or out-of-band channels (DNS/HTTP callbacks)', label_uk: 'Використанням затримок часу (<code>sleep</code>) або зовнішніх каналів (DNS/HTTP callbacks)' },
            { value: 'd', label: 'By reading the server\'s access log directly', label_uk: 'Прямим читанням журналу доступу сервера' }
          ],
          answer: 'c',
          hint: 'When you can\'t see output, you need side channels.',
          hint_uk: 'Коли ти не бачиш результат, потрібні побічні канали.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'Using <code>shlex.quote()</code> on user input before passing it to <code>subprocess.run(shell=True)</code> is a fully reliable defense against command injection.',
          text_uk: 'Використання <code>shlex.quote()</code> для введення користувача перед передачею в <code>subprocess.run(shell=True)</code> є повністю надійним захистом від command injection.',
          answer: false,
          hint: 'The most reliable defense is avoiding the shell entirely — use a list argument.',
          hint_uk: 'Найнадійніший захист — повністю уникати shell. Використовуй аргумент-список.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'In bash, what variable acts as a space character and can bypass space-filtering WAFs? (three letters, starts with I)',
          text_uk: 'Яка змінна в bash замінює пробіл і дозволяє обійти WAF з фільтрацією пробілів? (три літери, починається на I)',
          placeholder: 'Type the variable name...',
          // SHA-256 of "ifs"
          answerHash: '5765a582f926f10d35bdfbf79e88afdcb16e2906e5aa1689da258b33360fb64c',
          hint: 'Internal Field Separator — $IFS in shell scripts.',
          hint_uk: 'Internal Field Separator — $IFS у shell-скриптах.'
        }
      ],
      flags: [
        {
          id: 'f1', label: 'Challenge 1 — Basic Injection',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10
        },
        {
          id: 'f2', label: 'Challenge 2 — Blind Injection',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15
        },
        {
          id: 'f3', label: 'Challenge 3 — Filter Bypass',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('vuln-cmdi');
  }

  return { init, cleanup };
})();
