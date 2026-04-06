/* ============================================
   Module — Legal & Ethics
   ============================================ */

window.introLegal = (() => {
  function init(container) {
    QuizEngine.init(container, 'intro-legal', {
      questions: [
        {
          type: 'mc',
          text: 'You discover a vulnerability in a company\'s website. What should you do first?',
          options: [
            'Exploit it to prove impact',
            'Report it through the company\'s responsible disclosure program',
            'Post it on social media',
            'Sell the information'
          ],
          answer: 1
        },
        {
          type: 'mc',
          text: 'Which law primarily governs unauthorized computer access in the United States?',
          options: [
            'GDPR',
            'CFAA (Computer Fraud and Abuse Act)',
            'HIPAA',
            'SOX'
          ],
          answer: 1
        },
        {
          type: 'tf',
          text: 'Testing a website for vulnerabilities without authorization is legal as long as you report what you find.',
          answer: false
        },
        {
          type: 'mc',
          text: 'What is the primary purpose of a bug bounty program?',
          options: [
            'To train internal security teams',
            'To provide a legal framework for security researchers to report vulnerabilities',
            'To replace penetration testing',
            'To publicly shame companies with vulnerabilities'
          ],
          answer: 1
        },
        {
          type: 'tf',
          text: 'A written scope agreement (Rules of Engagement) is essential before performing any authorized penetration test.',
          answer: true
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('intro-legal');
  }

  return { init, cleanup };
})();
