/* ============================================
   Module: Clickjacking
   ============================================ */

window.vulnClickjacking = (() => {

  function init(container) {
    QuizEngine.init(container, 'vuln-clickjacking', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What HTTP header prevents a page from being embedded in an iframe?',
          text_uk: 'Який HTTP-заголовок запобігає вбудовуванню сторінки в iframe?',
          options: [
            { value: 'a', label: '<code>X-Frame-Options: DENY</code>', label_uk: '<code>X-Frame-Options: DENY</code>' },
            { value: 'b', label: '<code>X-Content-Type-Options</code>', label_uk: '<code>X-Content-Type-Options</code>' },
            { value: 'c', label: '<code>Content-Security-Policy: default-src</code>', label_uk: '<code>Content-Security-Policy: default-src</code>' },
            { value: 'd', label: '<code>Strict-Transport-Security</code>', label_uk: '<code>Strict-Transport-Security</code>' }
          ],
          answer: 'a',
          hint: 'This header specifically controls iframe embedding.',
          hint_uk: 'Цей заголовок спеціально контролює вбудовування в iframe.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Which CSP directive can also prevent clickjacking?',
          text_uk: 'Яка директива CSP також може запобігти clickjacking?',
          options: [
            { value: 'a', label: '<code>script-src</code>', label_uk: '<code>script-src</code>' },
            { value: 'b', label: '<code>style-src</code>', label_uk: '<code>style-src</code>' },
            { value: 'c', label: '<code>img-src</code>', label_uk: '<code>img-src</code>' },
            { value: 'd', label: '<code>frame-ancestors</code>', label_uk: '<code>frame-ancestors</code>' }
          ],
          answer: 'd',
          hint: 'This directive controls which origins can embed the page.',
          hint_uk: 'Ця директива контролює, які джерела можуть вбудовувати сторінку.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'What makes clickjacking different from other web attacks?',
          text_uk: 'Чим clickjacking відрізняється від інших веб-атак?',
          options: [
            { value: 'a', label: 'It injects code into the server', label_uk: 'Він впроваджує код на сервер' },
            { value: 'b', label: 'It tricks users into clicking hidden UI elements through visual deception', label_uk: 'Він обманює користувачів, змушуючи натискати приховані елементи через візуальну маніпуляцію' },
            { value: 'c', label: 'It steals cookies directly', label_uk: 'Він безпосередньо краде cookies' },
            { value: 'd', label: 'It requires physical access to the server', label_uk: 'Він потребує фізичного доступу до сервера' }
          ],
          answer: 'b',
          hint: 'The attack is visual — transparent iframes over real buttons.',
          hint_uk: 'Атака візуальна — прозорі iframe поверх реальних кнопок.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('vuln-clickjacking');
  }

  return { init, cleanup };
})();
