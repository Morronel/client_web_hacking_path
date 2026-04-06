/* ============================================
   Module: Obfuscation & WAF Evasion
   ============================================ */

window.afterObfuscation = (() => {
  function init(container) {
    QuizEngine.init(container, 'after-obfuscation', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What is the primary purpose of payload obfuscation in web hacking?',
          text_uk: 'Яке основне призначення обфускації пейлоадів у веб-хакінгу?',
          options: [
            { value: 'a', label: 'To make payloads smaller', label_uk: 'Зменшити розмір пейлоадів' },
            { value: 'b', label: 'To bypass Web Application Firewalls (WAFs) and input filters', label_uk: 'Обійти WAF та фільтри введення' },
            { value: 'c', label: 'To encrypt the communication channel', label_uk: 'Зашифрувати канал зв\'язку' },
            { value: 'd', label: 'To improve website performance', label_uk: 'Покращити продуктивність вебсайту' }
          ],
          answer: 'b',
          hint: 'Obfuscation is about evading detection, not encryption or compression.',
          hint_uk: 'Обфускація — це про ухилення від виявлення, а не шифрування чи стиснення.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Which obfuscation technique involves inserting SQL comments (/**/) within keywords?',
          text_uk: 'Яка техніка обфускації передбачає вставку SQL-коментарів (<code>/**/</code>) всередину ключових слів?',
          options: [
            { value: 'a', label: 'Case variation', label_uk: 'Зміна регістру' },
            { value: 'b', label: 'Double URL encoding', label_uk: 'Подвійне URL-кодування' },
            { value: 'c', label: 'SQL comment insertion', label_uk: 'Вставка SQL-коментарів' },
            { value: 'd', label: 'HTML entity encoding', label_uk: 'HTML entity кодування' }
          ],
          answer: 'c',
          hint: 'SQL parsers ignore comments but WAF pattern matching may not reassemble them.',
          hint_uk: 'SQL-парсери ігнорують коментарі, але патерн-матчинг WAF може не зібрати їх назад.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'Double URL encoding encodes the percent signs from the first encoding pass (e.g., %253C instead of %3C).',
          text_uk: 'Подвійне URL-кодування кодує знаки відсотка з першого проходу кодування (наприклад, %253C замість %3C).',
          answer: true,
          hint: 'The percent sign itself gets URL-encoded in the second pass.',
          hint_uk: 'Сам знак відсотка URL-кодується на другому проході.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'A WAF that blocks "<script>" can often be bypassed by:',
          text_uk: 'WAF, який блокує "<script>", часто можна обійти через:',
          options: [
            { value: 'a', label: 'Using a longer script tag', label_uk: 'Використання довшого тегу script' },
            { value: 'b', label: 'Using case variation like "<ScRiPt>" or alternative event handlers', label_uk: 'Використання зміни регістру на кшталт "<ScRiPt>" або альтернативних обробників подій' },
            { value: 'c', label: 'Adding more spaces to the tag', label_uk: 'Додавання більше пробілів до тегу' },
            { value: 'd', label: 'Sending the request more slowly', label_uk: 'Повільніше надсилання запиту' }
          ],
          answer: 'b',
          hint: 'HTML is case-insensitive, but simple WAF rules often are not.',
          hint_uk: 'HTML нечутливий до регістру, але прості правила WAF часто — ні.'
        },
        {
          type: 'tf', id: 'q5',
          text: 'WAFs provide complete protection against all web attacks and eliminate the need for secure coding practices.',
          text_uk: 'WAF забезпечують повний захист від усіх веб-атак та усувають потребу в практиках безпечного кодування.',
          answer: false,
          hint: 'WAFs are a defense-in-depth layer, not a substitute for secure code.',
          hint_uk: 'WAF — це шар глибокого захисту, а не заміна безпечного коду.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('after-obfuscation');
  }

  return { init, cleanup };
})();
