/* ============================================
   Module — History of Hacking
   ============================================ */

window.introHistory = (() => {
  function init(container) {
    QuizEngine.init(container, 'intro-history', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'Who is often called the "father of phone phreaking" for discovering the 2600 Hz tone?',
          options: [
            { value: 'a', label: 'Kevin Mitnick' },
            { value: 'b', label: 'John Draper (Captain Crunch)' },
            { value: 'c', label: 'Robert Morris' },
            { value: 'd', label: 'Adrian Lamo' }
          ],
          answer: 'b',
          hint: 'His nickname came from a cereal brand whose whistle produced the right frequency.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'The Morris Worm (1988) is significant because it was:',
          options: [
            { value: 'a', label: 'The first ransomware attack' },
            { value: 'b', label: 'The first phishing campaign' },
            { value: 'c', label: 'One of the first widely recognized internet worms' },
            { value: 'd', label: 'The first SQL injection attack' }
          ],
          answer: 'c',
          hint: 'It spread across the early internet and led to the creation of CERT.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'The term "white hat" refers to hackers who use their skills for malicious purposes.',
          answer: false,
          hint: 'Think about the old Western movie trope of good guys wearing white hats.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'Which decade saw the emergence of organized cybercrime and state-sponsored hacking?',
          options: [
            { value: 'a', label: '1970s' },
            { value: 'b', label: '1980s' },
            { value: 'c', label: '1990s' },
            { value: 'd', label: '2000s' }
          ],
          answer: 'd',
          hint: 'Widespread internet adoption and geopolitical tensions drove this shift.'
        },
        {
          type: 'mc', id: 'q5',
          text: 'What was Kevin Mitnick primarily known for?',
          options: [
            { value: 'a', label: 'Creating the first antivirus software' },
            { value: 'b', label: 'Social engineering and unauthorized computer access' },
            { value: 'c', label: 'Founding the EFF' },
            { value: 'd', label: 'Developing the TCP/IP protocol' }
          ],
          answer: 'b',
          hint: 'He was once the FBI\'s most wanted computer criminal.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('intro-history');
  }

  return { init, cleanup };
})();
