/* ============================================
   Module: Reporting & Responsible Disclosure
   ============================================ */

window.afterReporting = (() => {
  function init(container) {
    QuizEngine.init(container, 'after-reporting', {
      questions: [
        {
          type: 'mc',
          text: 'What is the first step when you discover a vulnerability in a target with a bug bounty program?',
          options: [
            'Report it through the designated disclosure channel',
            'Exploit it further to determine full impact',
            'Publish a blog post about it',
            'Notify the media'
          ],
          answer: 0
        },
        {
          type: 'mc',
          text: 'A good vulnerability report should include:',
          options: [
            'Only the vulnerability title',
            'Steps to reproduce, impact assessment, and proof of concept',
            'Just a screenshot of the error page',
            'The source code of the entire application'
          ],
          answer: 1
        },
        {
          type: 'tf',
          text: 'Responsible disclosure means giving the vendor a reasonable amount of time to fix the vulnerability before public disclosure.',
          answer: true
        },
        {
          type: 'mc',
          text: 'What CVSS score range is considered "Critical"?',
          options: [
            '0.0 - 3.9',
            '4.0 - 6.9',
            '7.0 - 8.9',
            '9.0 - 10.0'
          ],
          answer: 3
        },
        {
          type: 'tf',
          text: 'It is acceptable to access or exfiltrate user data beyond what is needed to demonstrate a vulnerability.',
          answer: false
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('after-reporting');
  }

  return { init, cleanup };
})();
