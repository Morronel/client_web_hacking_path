/* ============================================
   Module: Cross-Site Request Forgery (CSRF)
   ============================================ */

window.vulnCsrf = (() => {

  function init(container) {
    QuizEngine.init(container, 'vuln-csrf', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What is the primary purpose of a CSRF token?',
          options: [
            { value: 'a', label: 'Encrypt form data in transit' },
            { value: 'b', label: 'Prove the request originated from the application\'s own form' },
            { value: 'c', label: 'Prevent SQL injection in form fields' },
            { value: 'd', label: 'Authenticate the user\'s identity' }
          ],
          answer: 'b',
          hint: 'CSRF tokens verify the form submission came from the legitimate site, not an attacker\'s page.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Which SameSite cookie value provides the strongest CSRF protection?',
          options: [
            { value: 'a', label: 'None' },
            { value: 'b', label: 'Lax' },
            { value: 'c', label: 'Strict' },
            { value: 'd', label: 'Secure' }
          ],
          answer: 'c',
          hint: 'This value never sends the cookie on cross-site requests, regardless of the HTTP method.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'Which HTTP methods are most commonly targeted in CSRF attacks?',
          options: [
            { value: 'a', label: 'GET and HEAD because they are idempotent' },
            { value: 'b', label: 'POST, PUT, and DELETE because they cause state changes' },
            { value: 'c', label: 'OPTIONS and TRACE because they bypass CORS' },
            { value: 'd', label: 'Only PATCH because it allows partial updates' }
          ],
          answer: 'b',
          hint: 'CSRF is most dangerous when it triggers actions that modify server-side state.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'Modern browsers default cookies to <code>SameSite=Lax</code> when no SameSite attribute is specified, which provides basic CSRF protection for POST-based endpoints.',
          answer: true,
          hint: 'Since 2020, Chrome, Firefox, and Edge treat cookies without a SameSite attribute as Lax by default.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'What cookie attribute (one word, lowercase) controls whether cookies are sent with cross-site requests?',
          placeholder: 'Type the attribute name...',
          // SHA-256 of "samesite"
          answerHash: '3edbd67a4e33cd9d9d30d7e8e2e915f1557deb987a1e3f5b4dc29fffc67a2a09',
          hint: 'This attribute can be set to Strict, Lax, or None.'
        }
      ],
      flags: [
        {
          id: 'f1', label: 'Challenge 1 — Token Bypass',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10
        },
        {
          id: 'f2', label: 'Challenge 2 — SameSite Abuse',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15
        },
        {
          id: 'f3', label: 'Challenge 3 — JSON CSRF',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('vuln-csrf');
  }

  return { init, cleanup };
})();
