/* ============================================
   Module: Race Conditions
   ============================================ */

window.vulnRace = (() => {

  function init(container) {
    QuizEngine.init(container, 'vuln-race', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What does TOCTOU stand for?',
          text_uk: 'Що означає абревіатура TOCTOU?',
          options: [
            { value: 'a', label: 'Time of Check to Time of Use', label_uk: 'Time of Check to Time of Use' },
            { value: 'b', label: 'Transfer of Control to Other Users', label_uk: 'Transfer of Control to Other Users' },
            { value: 'c', label: 'Thread Orchestration and Concurrent Transactions Under Update', label_uk: 'Thread Orchestration and Concurrent Transactions Under Update' },
            { value: 'd', label: 'Token of Credit to Offset Usage', label_uk: 'Token of Credit to Offset Usage' }
          ],
          answer: 'a',
          hint: 'The name describes the timing gap between verifying a condition and acting on it.',
          hint_uk: 'Назва описує часовий проміжок між перевіркою умови та дією на її основі.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'What is the most effective database-level prevention for race conditions?',
          text_uk: 'Який найефективніший захист від race conditions на рівні бази даних?',
          options: [
            { value: 'a', label: 'Adding more indexes', label_uk: 'Додавання більше індексів' },
            { value: 'b', label: 'Using <code>time.sleep()</code> between queries', label_uk: 'Використання <code>time.sleep()</code> між запитами' },
            { value: 'c', label: 'Increasing connection pool size', label_uk: 'Збільшення розміру пулу з\'єднань' },
            { value: 'd', label: 'Atomic <code>UPDATE ... WHERE</code> that combines check and modification in one query', label_uk: 'Атомарний <code>UPDATE ... WHERE</code>, що поєднує перевірку і модифікацію в одному запиті' }
          ],
          answer: 'd',
          hint: 'Combining the check and modification into a single atomic query eliminates the timing gap.',
          hint_uk: 'Поєднання перевірки та модифікації в один атомарний запит усуває часовий проміжок.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'Which mechanism ensures that concurrent transactions don\'t read stale data?',
          text_uk: 'Який механізм забезпечує, що паралельні транзакції не читають застарілі дані?',
          options: [
            { value: 'a', label: 'Connection pooling', label_uk: 'Пул з\'єднань' },
            { value: 'b', label: 'Database transactions with row-level locking (<code>SELECT FOR UPDATE</code>)', label_uk: 'Транзакції бази даних з блокуванням на рівні рядків (<code>SELECT FOR UPDATE</code>)' },
            { value: 'c', label: 'Rate limiting', label_uk: 'Обмеження частоти запитів' },
            { value: 'd', label: 'Using a NoSQL database instead', label_uk: 'Використання NoSQL бази даних замість реляційної' }
          ],
          answer: 'b',
          hint: 'Row-level locking prevents other transactions from reading or modifying the locked row.',
          hint_uk: 'Блокування на рівні рядків запобігає читанню або зміні заблокованого рядка іншими транзакціями.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'Rate limiting is a sufficient defense against race conditions because it prevents concurrent requests from reaching the server simultaneously.',
          text_uk: 'Rate limiting є достатнім захистом від race conditions, оскільки він запобігає одночасному надходженню паралельних запитів на сервер.',
          answer: false,
          hint: 'Rate limiting reduces volume but does not eliminate the TOCTOU gap — atomic operations are needed.',
          hint_uk: 'Rate limiting зменшує об\'єм, але не усуває TOCTOU-проміжок — потрібні атомарні операції.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'What is the abbreviated name for the timing flaw pattern where a condition is verified then acted upon with a gap in between? (acronym, lowercase)',
          text_uk: 'Яка абревіатура позначає шаблон часової вразливості, де умова перевіряється, а потім використовується з проміжком між цими діями? (акронім, малими літерами)',
          placeholder: 'Type the acronym...',
          // SHA-256 of "toctou"
          answerHash: 'd11df3e418d44fc3a68ba8f369ffafc17b18c8cbb5b7b40050f838eb0b37ea44',
          hint: 'Time-of-Check to Time-of-Use — the core pattern behind race conditions.',
          hint_uk: 'Time-of-Check to Time-of-Use — основний шаблон, що стоїть за race conditions.'
        }
      ],
      flags: [
        {
          id: 'f1', label: 'Challenge 1 — Voucher Double-Spend',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10
        },
        {
          id: 'f2', label: 'Challenge 2 — Overdraft Withdrawal',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15
        },
        {
          id: 'f3', label: 'Challenge 3 — Duplicate Registration',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('vuln-race');
  }

  return { init, cleanup };
})();
