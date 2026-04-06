/* ============================================
   Module — Legal & Ethics
   ============================================ */

window.introLegal = (() => {
  function init(container) {
    QuizEngine.init(container, 'intro-legal', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'You discover a vulnerability in a company\'s website. What should you do first?',
          options: [
            { value: 'a', label: 'Exploit it to prove impact' },
            { value: 'b', label: 'Report it through the company\'s responsible disclosure program' },
            { value: 'c', label: 'Post it on social media' },
            { value: 'd', label: 'Sell the information' }
          ],
          answer: 'b',
          hint: 'Think about which option is both ethical and legal.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Which law primarily governs unauthorized computer access in the United States?',
          options: [
            { value: 'a', label: 'GDPR' },
            { value: 'b', label: 'CFAA (Computer Fraud and Abuse Act)' },
            { value: 'c', label: 'HIPAA' },
            { value: 'd', label: 'SOX' }
          ],
          answer: 'b',
          hint: 'This U.S. federal law specifically targets computer fraud and unauthorized access.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'Testing a website for vulnerabilities without authorization is legal as long as you report what you find.',
          answer: false,
          hint: 'Authorization is required regardless of your intentions.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'What is the primary purpose of a bug bounty program?',
          options: [
            { value: 'a', label: 'To train internal security teams' },
            { value: 'b', label: 'To provide a legal framework for security researchers to report vulnerabilities' },
            { value: 'c', label: 'To replace penetration testing' },
            { value: 'd', label: 'To publicly shame companies with vulnerabilities' }
          ],
          answer: 'b',
          hint: 'Bug bounties create a safe channel between researchers and organizations.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'A written scope agreement (Rules of Engagement) is essential before performing any authorized penetration test.',
          answer: true,
          hint: 'Without written scope, even authorized testers risk legal trouble.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('intro-legal');
  }

  return { init, cleanup };
})();
