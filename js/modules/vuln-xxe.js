/* ============================================
   Module: XML External Entities (XXE)
   ============================================ */

window.vulnXxe = (() => {

  function init(container) {
    QuizEngine.init(container, 'vuln-xxe', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What XML feature is exploited in XXE attacks?',
          text_uk: 'Яка функція XML експлуатується в XXE-атаках?',
          options: [
            { value: 'a', label: 'XML namespaces', label_uk: 'Простори імен XML' },
            { value: 'b', label: 'External entity declarations in the DTD', label_uk: 'Оголошення зовнішніх сутностей у DTD' },
            { value: 'c', label: 'XML attributes', label_uk: 'XML-атрибути' },
            { value: 'd', label: 'CDATA sections', label_uk: 'Секції CDATA' }
          ],
          answer: 'b',
          hint: 'The Document Type Definition allows declaring entities that reference external files or URLs.',
          hint_uk: 'Document Type Definition дозволяє оголошувати сутності, що посилаються на зовнішні файли або URL.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'How is blind XXE data exfiltrated when entity values aren\'t displayed?',
          text_uk: 'Як витікають дані при сліпій XXE, коли значення сутностей не відображаються?',
          options: [
            { value: 'a', label: 'Using parameter entities that trigger HTTP requests to an attacker-controlled server carrying the data', label_uk: 'Через параметричні сутності, що надсилають HTTP-запити на сервер зловмисника з даними' },
            { value: 'b', label: 'Using JavaScript inside XML comments', label_uk: 'Через JavaScript всередині XML-коментарів' },
            { value: 'c', label: 'Embedding the data in XML attributes', label_uk: 'Вбудовування даних в XML-атрибути' },
            { value: 'd', label: 'Sending the data via email', label_uk: 'Надсилання даних електронною поштою' }
          ],
          answer: 'a',
          hint: 'Parameter entities can make out-of-band HTTP requests with stolen data in the URL.',
          hint_uk: 'Параметричні сутності можуть робити out-of-band HTTP-запити з викраденими даними в URL.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'What is the best way to prevent XXE in Python?',
          text_uk: 'Який найкращий спосіб запобігти XXE в Python?',
          options: [
            { value: 'a', label: 'Filtering the string "ENTITY" from input', label_uk: 'Фільтрація рядка "ENTITY" з введення' },
            { value: 'b', label: 'Limiting XML file size', label_uk: 'Обмеження розміру XML-файлу' },
            { value: 'c', label: 'Using <code>defusedxml</code> or disabling DTD loading and entity resolution', label_uk: 'Використання <code>defusedxml</code> або вимкнення завантаження DTD та резолвінгу сутностей' },
            { value: 'd', label: 'Encoding XML in base64 before parsing', label_uk: 'Кодування XML у base64 перед парсингом' }
          ],
          answer: 'c',
          hint: 'A library that disables dangerous XML features by default is the most reliable approach.',
          hint_uk: 'Бібліотека, що вимикає небезпечні функції XML за замовчуванням, є найнадійнішим підходом.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'SVG image files can be used as an XXE attack vector because SVG is an XML-based format that may be parsed with entity resolution enabled.',
          text_uk: 'SVG-файли зображень можуть використовуватися як вектор XXE-атаки, оскільки SVG — це формат на базі XML, який може парситися з увімкненим резолвінгом сутностей.',
          answer: true,
          hint: 'SVG, DOCX, XLSX, and other XML-based file formats can all carry XXE payloads.',
          hint_uk: 'SVG, DOCX, XLSX та інші формати на базі XML можуть містити XXE-пейлоади.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'What Python library is a drop-in replacement for standard XML parsers that blocks all dangerous XML features by default? (one word, lowercase)',
          text_uk: 'Яка бібліотека Python є прямою заміною стандартних XML-парсерів і блокує всі небезпечні функції XML за замовчуванням? (одне слово, малими літерами)',
          placeholder: 'Type the library name...',
          // SHA-256 of "defusedxml"
          answerHash: '8018460bcbbfee4b69f0e3a3cf6d1b89e0fb9429d45231eddc41b73b649c3efa',
          hint: 'The name suggests it makes XML parsing safe — "defused."',
          hint_uk: 'Назва натякає, що парсинг XML стає безпечним — "defused."'
        }
      ],
      flags: [
        {
          id: 'f1', label: 'Challenge 1 — Basic Entity Injection',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10
        },
        {
          id: 'f2', label: 'Challenge 2 — Blind OOB XXE',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15
        },
        {
          id: 'f3', label: 'Challenge 3 — SVG-Based XXE',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('vuln-xxe');
  }

  return { init, cleanup };
})();
