/* ============================================
   Module: Obfuscation & WAF Evasion
   ============================================ */

window.afterObfuscation = (() => {
  function init(container) {
    QuizEngine.init(container, 'after-obfuscation', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What is the primary purpose of payload obfuscation in web hacking?',
          options: [
            { value: 'a', label: 'To make payloads smaller' },
            { value: 'b', label: 'To bypass Web Application Firewalls (WAFs) and input filters' },
            { value: 'c', label: 'To encrypt the communication channel' },
            { value: 'd', label: 'To improve website performance' }
          ],
          answer: 'b',
          hint: 'Obfuscation is about evading detection, not encryption or compression.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Which obfuscation technique involves inserting SQL comments (/**/) within keywords?',
          options: [
            { value: 'a', label: 'Case variation' },
            { value: 'b', label: 'Double URL encoding' },
            { value: 'c', label: 'SQL comment insertion' },
            { value: 'd', label: 'HTML entity encoding' }
          ],
          answer: 'c',
          hint: 'SQL parsers ignore comments but WAF pattern matching may not reassemble them.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'Double URL encoding encodes the percent signs from the first encoding pass (e.g., %253C instead of %3C).',
          answer: true,
          hint: 'The percent sign itself gets URL-encoded in the second pass.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'A WAF that blocks "<script>" can often be bypassed by:',
          options: [
            { value: 'a', label: 'Using a longer script tag' },
            { value: 'b', label: 'Using case variation like "<ScRiPt>" or alternative event handlers' },
            { value: 'c', label: 'Adding more spaces to the tag' },
            { value: 'd', label: 'Sending the request more slowly' }
          ],
          answer: 'b',
          hint: 'HTML is case-insensitive, but simple WAF rules often are not.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'WAFs provide complete protection against all web attacks and eliminate the need for secure coding practices.',
          answer: false,
          hint: 'WAFs are a defense-in-depth layer, not a substitute for secure code.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('after-obfuscation');
  }

  return { init, cleanup };
})();
