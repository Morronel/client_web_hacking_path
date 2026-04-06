/* ============================================
   Module: Obfuscation & WAF Evasion
   ============================================ */

window.afterObfuscation = (() => {
  function init(container) {
    QuizEngine.init(container, 'after-obfuscation', {
      questions: [
        {
          type: 'mc',
          text: 'What is the primary purpose of payload obfuscation in web hacking?',
          options: [
            'To make payloads smaller',
            'To bypass Web Application Firewalls (WAFs) and input filters',
            'To encrypt the communication channel',
            'To improve website performance'
          ],
          answer: 1
        },
        {
          type: 'mc',
          text: 'Which obfuscation technique involves inserting SQL comments (/**/) within keywords?',
          options: [
            'Case variation',
            'Double URL encoding',
            'SQL comment insertion',
            'HTML entity encoding'
          ],
          answer: 2
        },
        {
          type: 'tf',
          text: 'Double URL encoding encodes the percent signs from the first encoding pass (e.g., %253C instead of %3C).',
          answer: true
        },
        {
          type: 'mc',
          text: 'A WAF that blocks "<script>" can often be bypassed by:',
          options: [
            'Using a longer script tag',
            'Using case variation like "<ScRiPt>" or alternative event handlers',
            'Adding more spaces to the tag',
            'Sending the request more slowly'
          ],
          answer: 1
        },
        {
          type: 'tf',
          text: 'WAFs provide complete protection against all web attacks and eliminate the need for secure coding practices.',
          answer: false
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('after-obfuscation');
  }

  return { init, cleanup };
})();
