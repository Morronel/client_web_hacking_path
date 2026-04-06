/* ============================================
   Module: Insecure Deserialization
   ============================================ */

window.vulnDeserial = (() => {

  function init(container) {
    QuizEngine.init(container, 'vuln-deserial', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'Why is Python\'s <code>pickle.loads()</code> dangerous with untrusted input?',
          text_uk: 'Чому <code>pickle.loads()</code> у Python небезпечний з ненадійним введенням?',
          options: [
            { value: 'a', label: 'It uses too much memory', label_uk: 'Використовує занадто багато пам\'яті' },
            { value: 'b', label: 'It doesn\'t support complex data types', label_uk: 'Не підтримує складні типи даних' },
            { value: 'c', label: 'The <code>__reduce__</code> method can execute arbitrary code during deserialization', label_uk: 'Метод <code>__reduce__</code> може виконати довільний код під час десеріалізації' },
            { value: 'd', label: 'It only works with Python 2', label_uk: 'Працює тільки з Python 2' }
          ],
          answer: 'c',
          hint: 'The __reduce__ method returns a callable that is invoked automatically during deserialization.',
          hint_uk: 'Метод __reduce__ повертає callable, який автоматично викликається під час десеріалізації.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'What is the safe way to load YAML in Python?',
          text_uk: 'Який безпечний спосіб завантаження YAML у Python?',
          options: [
            { value: 'a', label: '<code>yaml.safe_load()</code>', label_uk: '<code>yaml.safe_load()</code>' },
            { value: 'b', label: '<code>yaml.load(data, Loader=yaml.UnsafeLoader)</code>', label_uk: '<code>yaml.load(data, Loader=yaml.UnsafeLoader)</code>' },
            { value: 'c', label: '<code>yaml.unsafe_load()</code>', label_uk: '<code>yaml.unsafe_load()</code>' },
            { value: 'd', label: '<code>yaml.load(data)</code> with no Loader argument', label_uk: '<code>yaml.load(data)</code> без аргументу Loader' }
          ],
          answer: 'a',
          hint: 'The safe variant only allows basic types and cannot instantiate arbitrary Python objects.',
          hint_uk: 'Безпечний варіант дозволяє тільки базові типи і не може створювати довільні об\'єкти Python.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'Which serialization format is safe to use with untrusted data?',
          text_uk: 'Який формат серіалізації безпечно використовувати з ненадійними даними?',
          options: [
            { value: 'a', label: 'Python pickle', label_uk: 'Python pickle' },
            { value: 'b', label: 'JSON (cannot execute code during parsing)', label_uk: 'JSON (не може виконувати код під час парсингу)' },
            { value: 'c', label: 'Java serialized objects', label_uk: 'Серіалізовані об\'єкти Java' },
            { value: 'd', label: 'PHP serialized objects', label_uk: 'Серіалізовані об\'єкти PHP' }
          ],
          answer: 'b',
          hint: 'JSON only handles primitive types — strings, numbers, arrays, and objects — and has no code execution mechanism.',
          hint_uk: 'JSON працює тільки з примітивними типами — рядки, числа, масиви та об\'єкти — і не має механізму виконання коду.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'Signing a serialized cookie with HMAC makes it completely safe to use <code>pickle.loads()</code> on the data, even if the signing key is weak or leaked.',
          text_uk: 'Підписання серіалізованого cookie за допомогою HMAC робить використання <code>pickle.loads()</code> повністю безпечним, навіть якщо ключ підпису слабкий або витік.',
          answer: false,
          hint: 'If the signing key is cracked or leaked, an attacker can forge cookies with malicious pickle payloads.',
          hint_uk: 'Якщо ключ підпису зламано або він витік, зловмисник може підробити cookies зі шкідливими pickle-пейлоадами.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'What is the name of the Python magic method that pickle calls during deserialization to reconstruct objects, enabling arbitrary code execution? (include double underscores)',
          text_uk: 'Як називається магічний метод Python, який pickle викликає під час десеріалізації для відновлення об\'єктів, що дозволяє виконання довільного коду? (включи подвійні підкреслення)',
          placeholder: 'Type the method name...',
          // SHA-256 of "__reduce__"
          answerHash: '3cf5ed116a9556437685bebab7e101a91cfc38e2e1fa831d790d1c7922a419c8',
          hint: 'This dunder method returns a tuple of (callable, args) that pickle invokes to rebuild the object.',
          hint_uk: 'Цей dunder-метод повертає кортеж (callable, args), який pickle викликає для відновлення об\'єкта.'
        }
      ],
      flags: [
        {
          id: 'f1', label: 'Challenge 1 — Pickle RCE',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10
        },
        {
          id: 'f2', label: 'Challenge 2 — Cookie Forgery',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15
        },
        {
          id: 'f3', label: 'Challenge 3 — YAML Object Injection',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('vuln-deserial');
  }

  return { init, cleanup };
})();
