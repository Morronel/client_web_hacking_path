/* ============================================
   Module: Reporting & Responsible Disclosure
   ============================================ */

window.afterReporting = (() => {
  function init(container) {
    QuizEngine.init(container, 'after-reporting', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What is the first step when you discover a vulnerability in a target with a bug bounty program?',
          options: [
            { value: 'a', label: 'Report it through the designated disclosure channel' },
            { value: 'b', label: 'Exploit it further to determine full impact' },
            { value: 'c', label: 'Publish a blog post about it' },
            { value: 'd', label: 'Notify the media' }
          ],
          answer: 'a',
          hint: 'Follow the program rules and report through official channels first.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'A good vulnerability report should include:',
          options: [
            { value: 'a', label: 'Only the vulnerability title' },
            { value: 'b', label: 'Steps to reproduce, impact assessment, and proof of concept' },
            { value: 'c', label: 'Just a screenshot of the error page' },
            { value: 'd', label: 'The source code of the entire application' }
          ],
          answer: 'b',
          hint: 'The vendor needs enough detail to reproduce and understand the impact.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'Responsible disclosure means giving the vendor a reasonable amount of time to fix the vulnerability before public disclosure.',
          answer: true,
          hint: 'The standard practice balances public safety with vendor response time.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'What CVSS score range is considered "Critical"?',
          options: [
            { value: 'a', label: '0.0 - 3.9' },
            { value: 'b', label: '4.0 - 6.9' },
            { value: 'c', label: '7.0 - 8.9' },
            { value: 'd', label: '9.0 - 10.0' }
          ],
          answer: 'd',
          hint: 'Critical is the highest severity rating in the CVSS scale.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'It is acceptable to access or exfiltrate user data beyond what is needed to demonstrate a vulnerability.',
          answer: false,
          hint: 'Minimizing impact is a core principle of ethical security research.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('after-reporting');
  }

  return { init, cleanup };
})();
