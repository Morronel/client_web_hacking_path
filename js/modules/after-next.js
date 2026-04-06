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
          text_uk: 'Яка сертифікація широко визнана як практична кваліфікація з тестування на проникнення?',
          options: [
            { value: 'a', label: 'OSCP (Offensive Security Certified Professional)', label_uk: 'OSCP (Offensive Security Certified Professional)' },
            { value: 'b', label: 'CompTIA A+', label_uk: 'CompTIA A+' },
            { value: 'c', label: 'AWS Solutions Architect', label_uk: 'AWS Solutions Architect' },
            { value: 'd', label: 'Cisco CCNA', label_uk: 'Cisco CCNA' }
          ],
          answer: 'a',
          hint: 'This cert requires passing a grueling 24-hour hands-on exam.',
          hint_uk: 'Ця сертифікація вимагає проходження виснажливого 24-годинного практичного іспиту.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Which platform provides free, browser-based hacking labs for practice?',
          text_uk: 'Яка платформа надає безкоштовні браузерні лабораторії з хакінгу для практики?',
          options: [
            { value: 'a', label: 'LinkedIn Learning', label_uk: 'LinkedIn Learning' },
            { value: 'b', label: 'TryHackMe', label_uk: 'TryHackMe' },
            { value: 'c', label: 'Coursera', label_uk: 'Coursera' },
            { value: 'd', label: 'Khan Academy', label_uk: 'Khan Academy' }
          ],
          answer: 'b',
          hint: 'This platform uses guided rooms and attack boxes in the browser.',
          hint_uk: 'Ця платформа використовує покрокові кімнати та атакуючі бокси в браузері.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'A "Blue Team" professional primarily focuses on:',
          text_uk: 'Фахівець "Blue Team" переважно зосереджується на:',
          options: [
            { value: 'a', label: 'Exploiting vulnerabilities in web applications', label_uk: 'Експлуатації вразливостей у веб-додатках' },
            { value: 'b', label: 'Social engineering attacks', label_uk: 'Атаках соціальної інженерії' },
            { value: 'c', label: 'Defending systems, detecting threats, and incident response', label_uk: 'Захисті систем, виявленні загроз та реагуванні на інциденти' },
            { value: 'd', label: 'Writing malware', label_uk: 'Написанні шкідливого ПЗ' }
          ],
          answer: 'c',
          hint: 'Blue Team is the defensive counterpart to Red Team.',
          hint_uk: 'Blue Team — це захисний аналог Red Team.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'Which resource is specifically designed for learning web application security testing?',
          text_uk: 'Який ресурс спеціально розроблений для вивчення тестування безпеки веб-додатків?',
          options: [
            { value: 'a', label: 'Codecademy', label_uk: 'Codecademy' },
            { value: 'b', label: 'HackerRank', label_uk: 'HackerRank' },
            { value: 'c', label: 'PortSwigger Web Security Academy', label_uk: 'PortSwigger Web Security Academy' },
            { value: 'd', label: 'freeCodeCamp', label_uk: 'freeCodeCamp' }
          ],
          answer: 'c',
          hint: 'This free resource is made by the creators of Burp Suite.',
          hint_uk: 'Цей безкоштовний ресурс створений розробниками Burp Suite.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'Building a portfolio of write-ups and CTF achievements can help when applying for security roles.',
          text_uk: 'Створення портфоліо з write-up\'ів та досягнень у CTF може допомогти при подачі на посади у сфері безпеки.',
          answer: true,
          hint: 'Demonstrating practical skills is highly valued in the security industry.',
          hint_uk: 'Демонстрація практичних навичок високо цінується в індустрії безпеки.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('after-next');
  }

  return { init, cleanup };
})();
