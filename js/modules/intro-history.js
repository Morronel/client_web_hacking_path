/* ============================================
   Module — History of Hacking
   ============================================ */

window.introHistory = (() => {
  function init(container) {
    QuizEngine.init(container, 'intro-history', {
      questions: [
        {
          type: 'mc',
          text: 'Who is often called the "father of phone phreaking" for discovering the 2600 Hz tone?',
          options: [
            'Kevin Mitnick',
            'John Draper (Captain Crunch)',
            'Robert Morris',
            'Adrian Lamo'
          ],
          answer: 1
        },
        {
          type: 'mc',
          text: 'The Morris Worm (1988) is significant because it was:',
          options: [
            'The first ransomware attack',
            'The first phishing campaign',
            'One of the first widely recognized internet worms',
            'The first SQL injection attack'
          ],
          answer: 2
        },
        {
          type: 'tf',
          text: 'The term "white hat" refers to hackers who use their skills for malicious purposes.',
          answer: false
        },
        {
          type: 'mc',
          text: 'Which decade saw the emergence of organized cybercrime and state-sponsored hacking?',
          options: [
            '1970s',
            '1980s',
            '1990s',
            '2000s'
          ],
          answer: 3
        },
        {
          type: 'mc',
          text: 'What was Kevin Mitnick primarily known for?',
          options: [
            'Creating the first antivirus software',
            'Social engineering and unauthorized computer access',
            'Founding the EFF',
            'Developing the TCP/IP protocol'
          ],
          answer: 1
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('intro-history');
  }

  return { init, cleanup };
})();
