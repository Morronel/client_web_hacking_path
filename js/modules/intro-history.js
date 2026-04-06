/* ============================================
   Module — History of Hacking
   ============================================ */

window.introHistory = (() => {
  function init(container) {
    QuizEngine.init(container, 'intro-history', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'Who is often called the "father of phone phreaking" for discovering the 2600 Hz tone?',
          text_uk: 'Кого часто називають "батьком телефонного фрікінгу" за відкриття тону 2600 Гц?',
          options: [
            { value: 'a', label: 'Kevin Mitnick', label_uk: 'Kevin Mitnick' },
            { value: 'b', label: 'John Draper (Captain Crunch)', label_uk: 'John Draper (Captain Crunch)' },
            { value: 'c', label: 'Robert Morris', label_uk: 'Robert Morris' },
            { value: 'd', label: 'Adrian Lamo', label_uk: 'Adrian Lamo' }
          ],
          answer: 'b',
          hint: 'His nickname came from a cereal brand whose whistle produced the right frequency.',
          hint_uk: 'Його прізвисько походить від бренду сніданкових пластівців, свисток з яких видавав потрібну частоту.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'The Morris Worm (1988) is significant because it was:',
          text_uk: 'Morris Worm (1988) є значущим, тому що це був:',
          options: [
            { value: 'a', label: 'The first ransomware attack', label_uk: 'Перша атака ransomware' },
            { value: 'b', label: 'The first phishing campaign', label_uk: 'Перша фішингова кампанія' },
            { value: 'c', label: 'One of the first widely recognized internet worms', label_uk: 'Один з перших широко відомих інтернет-хробаків' },
            { value: 'd', label: 'The first SQL injection attack', label_uk: 'Перша атака SQL injection' }
          ],
          answer: 'c',
          hint: 'It spread across the early internet and led to the creation of CERT.',
          hint_uk: 'Він поширився по ранньому інтернету та призвів до створення CERT.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'The term "white hat" refers to hackers who use their skills for malicious purposes.',
          text_uk: 'Термін "white hat" означає хакерів, які використовують свої навички зі зловмисною метою.',
          answer: false,
          hint: 'Think about the old Western movie trope of good guys wearing white hats.',
          hint_uk: 'Згадай старий троп вестернів, де хороші хлопці носять білі капелюхи.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'Which decade saw the emergence of organized cybercrime and state-sponsored hacking?',
          text_uk: 'В якому десятилітті з\'явилася організована кіберзлочинність та державний хакінг?',
          options: [
            { value: 'a', label: '1970s', label_uk: '1970-ті' },
            { value: 'b', label: '1980s', label_uk: '1980-ті' },
            { value: 'c', label: '1990s', label_uk: '1990-ті' },
            { value: 'd', label: '2000s', label_uk: '2000-ні' }
          ],
          answer: 'd',
          hint: 'Widespread internet adoption and geopolitical tensions drove this shift.',
          hint_uk: 'Масове поширення інтернету та геополітична напруженість спричинили цей зсув.'
        },
        {
          type: 'mc', id: 'q5',
          text: 'What was Kevin Mitnick primarily known for?',
          text_uk: 'Чим був відомий Kevin Mitnick?',
          options: [
            { value: 'a', label: 'Creating the first antivirus software', label_uk: 'Створення першого антивірусного ПЗ' },
            { value: 'b', label: 'Social engineering and unauthorized computer access', label_uk: 'Соціальна інженерія та несанкціонований доступ до комп\'ютерів' },
            { value: 'c', label: 'Founding the EFF', label_uk: 'Заснування EFF' },
            { value: 'd', label: 'Developing the TCP/IP protocol', label_uk: 'Розробка протоколу TCP/IP' }
          ],
          answer: 'b',
          hint: 'He was once the FBI\'s most wanted computer criminal.',
          hint_uk: 'Він свого часу був найбільш розшукуваним комп\'ютерним злочинцем ФБР.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('intro-history');
  }

  return { init, cleanup };
})();
