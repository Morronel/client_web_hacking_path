/* ============================================
   Module: GraphQL Vulnerabilities
   ============================================ */

window.vulnGraphql = (() => {

  function init(container) {
    QuizEngine.init(container, 'vuln-graphql', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What does GraphQL introspection allow?',
          text_uk: 'Що дозволяє GraphQL introspection?',
          options: [
            { value: 'a', label: 'Running arbitrary SQL on the database', label_uk: 'Виконання довільного SQL на базі даних' },
            { value: 'b', label: 'Querying the full schema to discover all types, fields, and relationships', label_uk: 'Запитувати повну схему для виявлення всіх типів, полів та зв\'язків' },
            { value: 'c', label: 'Bypassing authentication entirely', label_uk: 'Повний обхід автентифікації' },
            { value: 'd', label: 'Executing server-side JavaScript', label_uk: 'Виконання JavaScript на стороні сервера' }
          ],
          answer: 'b',
          hint: 'Introspection is a built-in feature that reveals the entire API schema to anyone who queries it.',
          hint_uk: 'Introspection — це вбудована функція, що розкриває всю схему API будь-кому, хто робить запит.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'What is the primary defense against nested query DoS attacks?',
          text_uk: 'Який основний захист від DoS-атак через вкладені запити?',
          options: [
            { value: 'a', label: 'Query depth limiting and cost analysis', label_uk: 'Обмеження глибини запитів та аналіз вартості' },
            { value: 'b', label: 'Using POST instead of GET', label_uk: 'Використання POST замість GET' },
            { value: 'c', label: 'Requiring API keys', label_uk: 'Вимога API-ключів' },
            { value: 'd', label: 'Adding CORS headers', label_uk: 'Додавання CORS-заголовків' }
          ],
          answer: 'a',
          hint: 'Limiting how deep queries can nest and assigning costs to fields prevents resource exhaustion.',
          hint_uk: 'Обмеження глибини вкладеності запитів та призначення вартості полям запобігає вичерпанню ресурсів.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'Where should authorization be enforced in a GraphQL API?',
          text_uk: 'Де має перевірятися авторизація в GraphQL API?',
          options: [
            { value: 'a', label: 'Only at the HTTP middleware level', label_uk: 'Тільки на рівні HTTP middleware' },
            { value: 'b', label: 'Only on mutations, not queries', label_uk: 'Тільки на мутаціях, не на запитах' },
            { value: 'c', label: 'Only at the schema level via type directives', label_uk: 'Тільки на рівні схеми через директиви типів' },
            { value: 'd', label: 'At the individual resolver level (per-field authorization)', label_uk: 'На рівні окремих резолверів (авторизація per-field)' }
          ],
          answer: 'd',
          hint: 'With a single endpoint, each resolver must independently verify the user has access to the requested data.',
          hint_uk: 'З єдиним ендпоінтом кожен резолвер повинен самостійно перевіряти, чи має користувач доступ до запитаних даних.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'Disabling GraphQL introspection in production is sufficient to prevent attackers from discovering the API schema, because there are no other ways to learn field names.',
          text_uk: 'Вимкнення GraphQL introspection у продакшені достатньо, щоб завадити зловмисникам виявити схему API, бо інших способів дізнатися назви полів немає.',
          answer: false,
          hint: 'Even with introspection disabled, field suggestion errors can leak valid field names when you misspell a query field.',
          hint_uk: 'Навіть з вимкненим introspection, підказки помилок можуть розкрити коректні назви полів, коли ти помиляєшся в написанні поля запиту.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'What is the special root field name used in GraphQL introspection queries to access the full schema? (include the double underscore prefix)',
          text_uk: 'Яке спеціальне кореневе поле використовується в GraphQL introspection запитах для доступу до повної схеми? (включи префікс із подвійним підкресленням)',
          placeholder: 'Type the field name...',
          // SHA-256 of "__schema"
          answerHash: '81012c180cb8b7f8f7501a07f5c4e178ee03bdd002c151fa561bc441edecd5f5',
          hint: 'This built-in field starts with double underscores and returns schema metadata.',
          hint_uk: 'Це вбудоване поле починається з подвійного підкреслення та повертає метадані схеми.'
        }
      ],
      flags: [
        {
          id: 'f1', label: 'Challenge 1 — Introspection Leak',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10
        },
        {
          id: 'f2', label: 'Challenge 2 — Auth Bypass',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15
        },
        {
          id: 'f3', label: 'Challenge 3 — Batching Abuse',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('vuln-graphql');
  }

  return { init, cleanup };
})();
