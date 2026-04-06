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
          text_uk: 'Ти виявив вразливість на сайті компанії. Що ти маєш зробити першим?',
          options: [
            { value: 'a', label: 'Exploit it to prove impact', label_uk: 'Експлуатувати її для доведення впливу' },
            { value: 'b', label: 'Report it through the company\'s responsible disclosure program', label_uk: 'Повідомити через програму відповідального розкриття компанії' },
            { value: 'c', label: 'Post it on social media', label_uk: 'Опублікувати в соцмережах' },
            { value: 'd', label: 'Sell the information', label_uk: 'Продати інформацію' }
          ],
          answer: 'b',
          hint: 'Think about which option is both ethical and legal.',
          hint_uk: 'Подумай, який варіант є і етичним, і законним.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Which law primarily governs unauthorized computer access in the United States?',
          text_uk: 'Який закон переважно регулює несанкціонований доступ до комп\'ютерів у Сполучених Штатах?',
          options: [
            { value: 'a', label: 'GDPR', label_uk: 'GDPR' },
            { value: 'b', label: 'CFAA (Computer Fraud and Abuse Act)', label_uk: 'CFAA (Computer Fraud and Abuse Act)' },
            { value: 'c', label: 'HIPAA', label_uk: 'HIPAA' },
            { value: 'd', label: 'SOX', label_uk: 'SOX' }
          ],
          answer: 'b',
          hint: 'This U.S. federal law specifically targets computer fraud and unauthorized access.',
          hint_uk: 'Цей федеральний закон США спеціально спрямований проти комп\'ютерного шахрайства та несанкціонованого доступу.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'Testing a website for vulnerabilities without authorization is legal as long as you report what you find.',
          text_uk: 'Тестування вебсайту на вразливості без авторизації є законним, якщо ти повідомиш про знахідки.',
          answer: false,
          hint: 'Authorization is required regardless of your intentions.',
          hint_uk: 'Авторизація потрібна незалежно від твоїх намірів.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'What is the primary purpose of a bug bounty program?',
          text_uk: 'Яке основне призначення програми bug bounty?',
          options: [
            { value: 'a', label: 'To train internal security teams', label_uk: 'Навчання внутрішніх команд безпеки' },
            { value: 'b', label: 'To provide a legal framework for security researchers to report vulnerabilities', label_uk: 'Забезпечити правову основу для дослідників безпеки для повідомлення про вразливості' },
            { value: 'c', label: 'To replace penetration testing', label_uk: 'Замінити тестування на проникнення' },
            { value: 'd', label: 'To publicly shame companies with vulnerabilities', label_uk: 'Публічно ганьбити компанії з вразливостями' }
          ],
          answer: 'b',
          hint: 'Bug bounties create a safe channel between researchers and organizations.',
          hint_uk: 'Bug bounty створюють безпечний канал між дослідниками та організаціями.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'A written scope agreement (Rules of Engagement) is essential before performing any authorized penetration test.',
          text_uk: 'Письмова угода про обсяг робіт (Rules of Engagement) є обов\'язковою перед проведенням будь-якого авторизованого тесту на проникнення.',
          answer: true,
          hint: 'Without written scope, even authorized testers risk legal trouble.',
          hint_uk: 'Без письмового обсягу робіт навіть авторизовані тестувальники ризикують мати юридичні проблеми.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('intro-legal');
  }

  return { init, cleanup };
})();
