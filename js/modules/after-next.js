/* ============================================
   Module: Where Do We Go From Here
   ============================================ */

window.afterNext = (() => {
  function init(container) {
    QuizEngine.init(container, 'after-next', {
      questions: [
        {
          type: 'mc',
          text: 'Which certification is widely recognized as a hands-on penetration testing credential?',
          options: [
            'OSCP (Offensive Security Certified Professional)',
            'CompTIA A+',
            'AWS Solutions Architect',
            'Cisco CCNA'
          ],
          answer: 0
        },
        {
          type: 'mc',
          text: 'Which platform provides free, browser-based hacking labs for practice?',
          options: [
            'LinkedIn Learning',
            'TryHackMe',
            'Coursera',
            'Khan Academy'
          ],
          answer: 1
        },
        {
          type: 'mc',
          text: 'A "Blue Team" professional primarily focuses on:',
          options: [
            'Exploiting vulnerabilities in web applications',
            'Social engineering attacks',
            'Defending systems, detecting threats, and incident response',
            'Writing malware'
          ],
          answer: 2
        },
        {
          type: 'mc',
          text: 'Which resource is specifically designed for learning web application security testing?',
          options: [
            'Codecademy',
            'HackerRank',
            'PortSwigger Web Security Academy',
            'freeCodeCamp'
          ],
          answer: 2
        },
        {
          type: 'tf',
          text: 'Building a portfolio of write-ups and CTF achievements can help when applying for security roles.',
          answer: true
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('after-next');
  }

  return { init, cleanup };
})();
