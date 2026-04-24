/* ============================================
   Module: File Upload Vulnerabilities
   ============================================ */

window.vulnUpload = (() => {

  function init(container) {
    QuizEngine.init(container, 'vuln-upload', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What is the most dangerous outcome of an unrestricted file upload?',
          text_uk: 'Який найнебезпечніший результат необмеженого завантаження файлів?',
          options: [
            { value: 'a', label: 'Remote Code Execution via uploaded webshell', label_uk: 'Віддалене виконання коду через завантажений webshell' },
            { value: 'b', label: 'Slow page loading', label_uk: 'Повільне завантаження сторінки' },
            { value: 'c', label: 'Increased storage costs', label_uk: 'Збільшення витрат на зберігання' },
            { value: 'd', label: 'Broken image thumbnails', label_uk: 'Зламані мініатюри зображень' }
          ],
          answer: 'a',
          hint: 'If you can upload and execute a .php or .py file, you own the server.',
          hint_uk: 'Якщо можеш завантажити та виконати .php або .py файл — сервер твій.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Why is checking only the file extension insufficient for upload validation?',
          text_uk: 'Чому перевірки лише розширення файлу недостатньо для валідації завантаження?',
          options: [
            { value: 'a', label: 'Extensions are case-sensitive on all systems', label_uk: 'Розширення чутливі до регістру на всіх системах' },
            { value: 'b', label: 'Browsers ignore extensions', label_uk: 'Браузери ігнорують розширення' },
            { value: 'c', label: 'Attackers can use double extensions, null bytes, or Content-Type mismatches', label_uk: 'Атакуючі можуть використати подвійні розширення, null-байти або невідповідність Content-Type' },
            { value: 'd', label: 'Extensions are encrypted in transit', label_uk: 'Розширення шифруються при передачі' }
          ],
          answer: 'c',
          hint: 'shell.php.jpg, shell.php%00.jpg, changing Content-Type header...',
          hint_uk: 'shell.php.jpg, shell.php%00.jpg, зміна заголовка Content-Type...'
        },
        {
          type: 'mc', id: 'q3',
          text: 'Which defense strategy is most effective against malicious file uploads?',
          text_uk: 'Яка стратегія захисту найефективніша проти зловмисного завантаження файлів?',
          options: [
            { value: 'a', label: 'Renaming the file on the server', label_uk: 'Перейменування файлу на сервері' },
            { value: 'b', label: 'Storing uploads outside the web root with no execute permissions and validating content type', label_uk: 'Зберігання завантажень за межами веб-кореня без прав на виконання та перевірка типу вмісту' },
            { value: 'c', label: 'Limiting file size only', label_uk: 'Обмеження лише розміру файлу' },
            { value: 'd', label: 'Using JavaScript validation on the client side', label_uk: 'Використання JavaScript-валідації на стороні клієнта' }
          ],
          answer: 'b',
          hint: 'Defense in depth: store outside web root + validate content + strip metadata.',
          hint_uk: 'Захист у глибину: зберігати за межами web root + перевіряти вміст + видаляти метадані.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('vuln-upload');
  }

  return { init, cleanup };
})();
