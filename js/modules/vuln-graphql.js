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
          options: [
            { value: 'a', label: 'Running arbitrary SQL on the database' },
            { value: 'b', label: 'Querying the full schema to discover all types, fields, and relationships' },
            { value: 'c', label: 'Bypassing authentication entirely' },
            { value: 'd', label: 'Executing server-side JavaScript' }
          ],
          answer: 'b',
          hint: 'Introspection is a built-in feature that reveals the entire API schema to anyone who queries it.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'What is the primary defense against nested query DoS attacks?',
          options: [
            { value: 'a', label: 'Query depth limiting and cost analysis' },
            { value: 'b', label: 'Using POST instead of GET' },
            { value: 'c', label: 'Requiring API keys' },
            { value: 'd', label: 'Adding CORS headers' }
          ],
          answer: 'a',
          hint: 'Limiting how deep queries can nest and assigning costs to fields prevents resource exhaustion.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'Where should authorization be enforced in a GraphQL API?',
          options: [
            { value: 'a', label: 'Only at the HTTP middleware level' },
            { value: 'b', label: 'Only on mutations, not queries' },
            { value: 'c', label: 'Only at the schema level via type directives' },
            { value: 'd', label: 'At the individual resolver level (per-field authorization)' }
          ],
          answer: 'd',
          hint: 'With a single endpoint, each resolver must independently verify the user has access to the requested data.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'Disabling GraphQL introspection in production is sufficient to prevent attackers from discovering the API schema, because there are no other ways to learn field names.',
          answer: false,
          hint: 'Even with introspection disabled, field suggestion errors can leak valid field names when you misspell a query field.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'What is the special root field name used in GraphQL introspection queries to access the full schema? (include the double underscore prefix)',
          placeholder: 'Type the field name...',
          // SHA-256 of "__schema"
          answerHash: '81012c180cb8b7f8f7501a07f5c4e178ee03bdd002c151fa561bc441edecd5f5',
          hint: 'This built-in field starts with double underscores and returns schema metadata.'
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
