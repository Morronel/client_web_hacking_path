/* ============================================
   Module: Path Traversal
   ============================================ */

window.vulnTraversal = (() => {

  function init(container) {
    QuizEngine.init(container, 'vuln-traversal', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What is the primary sequence used in path traversal attacks?',
          text_uk: 'Яка основна послідовність символів використовується в атаках path traversal?',
          options: [
            { value: 'a', label: '<code>./</code> (current directory)', label_uk: '<code>./</code> (поточна директорія)' },
            { value: 'b', label: '<code>../</code> (parent directory)', label_uk: '<code>../</code> (батьківська директорія)' },
            { value: 'c', label: '<code>~/</code> (home directory)', label_uk: '<code>~/</code> (домашня директорія)' },
            { value: 'd', label: '<code>*</code> (glob wildcard)', label_uk: '<code>*</code> (glob-шаблон)' }
          ],
          answer: 'b',
          hint: 'This two-character sequence means "go up one directory" in every operating system.',
          hint_uk: 'Ця двосимвольна послідовність означає "піднятися на одну директорію вгору" в кожній ОС.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'How did null byte injection (<code>%00</code>) historically bypass file extension appending?',
          text_uk: 'Як null byte injection (<code>%00</code>) історично обходив додавання розширення файлу?',
          options: [
            { value: 'a', label: 'It corrupted the file header', label_uk: 'Пошкоджував заголовок файлу' },
            { value: 'b', label: 'It changed the Content-Type', label_uk: 'Змінював Content-Type' },
            { value: 'c', label: 'C string functions treated it as the end of the string, truncating the appended extension', label_uk: 'Функції рядків у C сприймали його як кінець рядка, обрізаючи додане розширення' },
            { value: 'd', label: 'It encoded the extension in base64', label_uk: 'Кодував розширення в base64' }
          ],
          answer: 'c',
          hint: 'In C-based runtimes, a null byte terminates the string, so any appended extension is ignored.',
          hint_uk: 'У C-середовищах null-байт завершує рядок, тому будь-яке додане розширення ігнорується.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'Which Python approach best prevents path traversal?',
          text_uk: 'Який підхід у Python найкраще запобігає path traversal?',
          options: [
            { value: 'a', label: 'Removing <code>../</code> with <code>str.replace()</code>', label_uk: 'Видалення <code>../</code> за допомогою <code>str.replace()</code>' },
            { value: 'b', label: 'Checking if the path contains <code>..</code>', label_uk: 'Перевірка, чи шлях містить <code>..</code>' },
            { value: 'c', label: 'Blocking <code>/</code> characters', label_uk: 'Блокування символу <code>/</code>' },
            { value: 'd', label: 'Using <code>os.path.basename()</code> + <code>os.path.realpath()</code> with a directory whitelist check', label_uk: 'Використання <code>os.path.basename()</code> + <code>os.path.realpath()</code> з перевіркою білого списку директорій' }
          ],
          answer: 'd',
          hint: 'Strip path components, resolve symlinks, then verify the result is within the allowed directory.',
          hint_uk: 'Видали компоненти шляху, розв\'яжи символічні посилання, потім перевір, що результат знаходиться в дозволеній директорії.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'Replacing <code>../</code> with an empty string using a single-pass <code>str.replace()</code> is a reliable defense against path traversal.',
          text_uk: 'Заміна <code>../</code> на порожній рядок за допомогою однопрохідного <code>str.replace()</code> є надійним захистом від path traversal.',
          answer: false,
          hint: 'Payloads like <code>....//</code> become <code>../</code> after a single-pass replacement.',
          hint_uk: 'Такі пейлоади як <code>....//</code> стають <code>../</code> після однопрохідної заміни.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'What is the classic Linux file that attackers read first to confirm a path traversal vulnerability? (full absolute path)',
          text_uk: 'Який класичний файл Linux зловмисники читають першим для підтвердження вразливості path traversal? (повний абсолютний шлях)',
          placeholder: 'Type the full file path...',
          // SHA-256 of "/etc/passwd"
          answerHash: '74acf31844532670be412c65b8251ee55d072549080b1cffdbea6b1a192230a0',
          hint: 'This file contains user account information and is readable by all users on the system.',
          hint_uk: 'Цей файл містить інформацію про облікові записи та доступний для читання всім користувачам системи.'
        }
      ],
      flags: [
        {
          id: 'f1', label: 'Challenge 1 — Basic Traversal',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10
        },
        {
          id: 'f2', label: 'Challenge 2 — Null Byte Bypass',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15
        },
        {
          id: 'f3', label: 'Challenge 3 — Double Encoding',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('vuln-traversal');
  }

  return { init, cleanup };
})();
