/* ============================================
   Module: Web Reconnaissance & Bug Bounty
   ============================================ */

window.afterRecon = (() => {
  function init(container) {
    QuizEngine.init(container, 'after-recon', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'Which Google dork operator restricts results to a specific domain?',
          text_uk: 'Який оператор Google dork обмежує результати конкретним доменом?',
          options: [
            { value: 'a', label: 'inurl:', label_uk: 'inurl:' },
            { value: 'b', label: 'filetype:', label_uk: 'filetype:' },
            { value: 'c', label: 'site:', label_uk: 'site:' },
            { value: 'd', label: 'intitle:', label_uk: 'intitle:' }
          ],
          answer: 'c',
          hint: 'This operator limits results to pages hosted on a particular domain.',
          hint_uk: 'Цей оператор обмежує результати сторінками, розміщеними на конкретному домені.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'What is subdomain enumeration used for in reconnaissance?',
          text_uk: 'Для чого використовується перебір субдоменів у розвідці?',
          options: [
            { value: 'a', label: 'To find email addresses of employees', label_uk: 'Для пошуку email-адрес співробітників' },
            { value: 'b', label: 'To discover additional attack surface by finding hidden subdomains', label_uk: 'Для виявлення додаткової поверхні атаки через пошук прихованих субдоменів' },
            { value: 'c', label: 'To bypass firewalls', label_uk: 'Для обходу файрволів' },
            { value: 'd', label: 'To decrypt HTTPS traffic', label_uk: 'Для розшифровки HTTPS-трафіку' }
          ],
          answer: 'b',
          hint: 'Forgotten or internal subdomains often have weaker security.',
          hint_uk: 'Забуті або внутрішні субдомени часто мають слабший захист.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'Passive reconnaissance involves directly interacting with the target system (e.g., port scanning).',
          text_uk: 'Пасивна розвідка передбачає пряму взаємодію з цільовою системою (наприклад, сканування портів).',
          answer: false,
          hint: 'Passive recon gathers information without touching the target directly.',
          hint_uk: 'Пасивна розвідка збирає інформацію без прямого контакту з ціллю.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'Which tool is commonly used for DNS enumeration and subdomain brute-forcing?',
          text_uk: 'Який інструмент зазвичай використовується для перебору DNS та брутфорсу субдоменів?',
          options: [
            { value: 'a', label: 'Burp Suite', label_uk: 'Burp Suite' },
            { value: 'b', label: 'Metasploit', label_uk: 'Metasploit' },
            { value: 'c', label: 'Amass', label_uk: 'Amass' },
            { value: 'd', label: 'Wireshark', label_uk: 'Wireshark' }
          ],
          answer: 'c',
          hint: 'This OWASP project specializes in network mapping and external asset discovery.',
          hint_uk: 'Цей проект OWASP спеціалізується на картографуванні мережі та виявленні зовнішніх активів.'
        },
        {
          type: 'mc', id: 'q5',
          text: 'What does the Google dork "filetype:sql" search for?',
          text_uk: 'Що шукає Google dork "filetype:sql"?',
          options: [
            { value: 'a', label: 'SQL injection vulnerabilities', label_uk: 'Вразливості SQL injection' },
            { value: 'b', label: 'Files with the .sql extension indexed by Google', label_uk: 'Файли з розширенням .sql, проіндексовані Google' },
            { value: 'c', label: 'Database servers on the internet', label_uk: 'Сервери баз даних в інтернеті' },
            { value: 'd', label: 'SQL tutorials', label_uk: 'Підручники з SQL' }
          ],
          answer: 'b',
          hint: 'The filetype operator filters results by file extension, not by content type.',
          hint_uk: 'Оператор filetype фільтрує результати за розширенням файлу, а не за типом вмісту.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('after-recon');
  }

  return { init, cleanup };
})();
