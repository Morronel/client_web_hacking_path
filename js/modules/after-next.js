/* ============================================
   Module: Where Do We Go From Here
   ============================================ */

window.afterNext = (() => {
  function init(container) {
    QuizEngine.init(container, 'after-next', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'Which certification is widely recognized as a hands-on penetration testing credential?',
          options: [
            { value: 'a', label: 'OSCP (Offensive Security Certified Professional)' },
            { value: 'b', label: 'CompTIA A+' },
            { value: 'c', label: 'AWS Solutions Architect' },
            { value: 'd', label: 'Cisco CCNA' }
          ],
          answer: 'a',
          hint: 'This cert requires passing a grueling 24-hour hands-on exam.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Which platform provides free, browser-based hacking labs for practice?',
          options: [
            { value: 'a', label: 'LinkedIn Learning' },
            { value: 'b', label: 'TryHackMe' },
            { value: 'c', label: 'Coursera' },
            { value: 'd', label: 'Khan Academy' }
          ],
          answer: 'b',
          hint: 'This platform uses guided rooms and attack boxes in the browser.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'A "Blue Team" professional primarily focuses on:',
          options: [
            { value: 'a', label: 'Exploiting vulnerabilities in web applications' },
            { value: 'b', label: 'Social engineering attacks' },
            { value: 'c', label: 'Defending systems, detecting threats, and incident response' },
            { value: 'd', label: 'Writing malware' }
          ],
          answer: 'c',
          hint: 'Blue Team is the defensive counterpart to Red Team.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'Which resource is specifically designed for learning web application security testing?',
          options: [
            { value: 'a', label: 'Codecademy' },
            { value: 'b', label: 'HackerRank' },
            { value: 'c', label: 'PortSwigger Web Security Academy' },
            { value: 'd', label: 'freeCodeCamp' }
          ],
          answer: 'c',
          hint: 'This free resource is made by the creators of Burp Suite.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'Building a portfolio of write-ups and CTF achievements can help when applying for security roles.',
          answer: true,
          hint: 'Demonstrating practical skills is highly valued in the security industry.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('after-next');
  }

  return { init, cleanup };
})();
