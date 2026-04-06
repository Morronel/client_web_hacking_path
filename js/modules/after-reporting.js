/* ============================================
   Module: Reporting & Responsible Disclosure
   ============================================ */

window.afterReporting = (() => {
  function init(container) {
    QuizEngine.init(container, 'after-reporting', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What is the first step when you discover a vulnerability in a target with a bug bounty program?',
          text_uk: 'Який перший крок, коли ти виявив вразливість у цілі з програмою bug bounty?',
          options: [
            { value: 'a', label: 'Report it through the designated disclosure channel', label_uk: 'Повідомити через визначений канал розкриття' },
            { value: 'b', label: 'Exploit it further to determine full impact', label_uk: 'Експлуатувати далі для визначення повного впливу' },
            { value: 'c', label: 'Publish a blog post about it', label_uk: 'Опублікувати пост в блозі' },
            { value: 'd', label: 'Notify the media', label_uk: 'Повідомити ЗМІ' }
          ],
          answer: 'a',
          hint: 'Follow the program rules and report through official channels first.',
          hint_uk: 'Дотримуйся правил програми та повідомляй через офіційні канали першим.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'A good vulnerability report should include:',
          text_uk: 'Хороший звіт про вразливість повинен містити:',
          options: [
            { value: 'a', label: 'Only the vulnerability title', label_uk: 'Тільки назву вразливості' },
            { value: 'b', label: 'Steps to reproduce, impact assessment, and proof of concept', label_uk: 'Кроки для відтворення, оцінку впливу та proof of concept' },
            { value: 'c', label: 'Just a screenshot of the error page', label_uk: 'Тільки скриншот сторінки помилки' },
            { value: 'd', label: 'The source code of the entire application', label_uk: 'Вихідний код усього додатку' }
          ],
          answer: 'b',
          hint: 'The vendor needs enough detail to reproduce and understand the impact.',
          hint_uk: 'Вендору потрібно достатньо деталей, щоб відтворити та зрозуміти вплив.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'Responsible disclosure means giving the vendor a reasonable amount of time to fix the vulnerability before public disclosure.',
          text_uk: 'Responsible disclosure означає надання вендору розумного часу для виправлення вразливості перед публічним розкриттям.',
          answer: true,
          hint: 'The standard practice balances public safety with vendor response time.',
          hint_uk: 'Стандартна практика балансує публічну безпеку з часом відповіді вендора.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'What CVSS score range is considered "Critical"?',
          text_uk: 'Який діапазон балів CVSS вважається "Critical"?',
          options: [
            { value: 'a', label: '0.0 - 3.9', label_uk: '0.0 - 3.9' },
            { value: 'b', label: '4.0 - 6.9', label_uk: '4.0 - 6.9' },
            { value: 'c', label: '7.0 - 8.9', label_uk: '7.0 - 8.9' },
            { value: 'd', label: '9.0 - 10.0', label_uk: '9.0 - 10.0' }
          ],
          answer: 'd',
          hint: 'Critical is the highest severity rating in the CVSS scale.',
          hint_uk: 'Critical — це найвищий рівень серйозності за шкалою CVSS.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'It is acceptable to access or exfiltrate user data beyond what is needed to demonstrate a vulnerability.',
          text_uk: 'Допустимо отримувати доступ або витягувати дані користувачів понад те, що потрібно для демонстрації вразливості.',
          answer: false,
          hint: 'Minimizing impact is a core principle of ethical security research.',
          hint_uk: 'Мінімізація впливу — основний принцип етичного дослідження безпеки.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('after-reporting');
  }

  return { init, cleanup };
})();
