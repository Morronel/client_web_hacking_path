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
          options: [
            { value: 'a', label: 'Time of Check to Time of Use' },
            { value: 'b', label: 'Transfer of Control to Other Users' },
            { value: 'c', label: 'Thread Orchestration and Concurrent Transactions Under Update' },
            { value: 'd', label: 'Token of Credit to Offset Usage' }
          ],
          answer: 'a',
          hint: 'The name describes the timing gap between verifying a condition and acting on it.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'What is the most effective database-level prevention for race conditions?',
          options: [
            { value: 'a', label: 'Adding more indexes' },
            { value: 'b', label: 'Using <code>time.sleep()</code> between queries' },
            { value: 'c', label: 'Increasing connection pool size' },
            { value: 'd', label: 'Atomic <code>UPDATE ... WHERE</code> that combines check and modification in one query' }
          ],
          answer: 'd',
          hint: 'Combining the check and modification into a single atomic query eliminates the timing gap.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'Which mechanism ensures that concurrent transactions don\'t read stale data?',
          options: [
            { value: 'a', label: 'Connection pooling' },
            { value: 'b', label: 'Database transactions with row-level locking (<code>SELECT FOR UPDATE</code>)' },
            { value: 'c', label: 'Rate limiting' },
            { value: 'd', label: 'Using a NoSQL database instead' }
          ],
          answer: 'b',
          hint: 'Row-level locking prevents other transactions from reading or modifying the locked row.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'Rate limiting is a sufficient defense against race conditions because it prevents concurrent requests from reaching the server simultaneously.',
          answer: false,
          hint: 'Rate limiting reduces volume but does not eliminate the TOCTOU gap — atomic operations are needed.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'What is the abbreviated name for the timing flaw pattern where a condition is verified then acted upon with a gap in between? (acronym, lowercase)',
          placeholder: 'Type the acronym...',
          // SHA-256 of "toctou"
          answerHash: 'd11df3e418d44fc3a68ba8f369ffafc17b18c8cbb5b7b40050f838eb0b37ea44',
          hint: 'Time-of-Check to Time-of-Use — the core pattern behind race conditions.'
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
