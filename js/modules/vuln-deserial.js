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
          options: [
            { value: 'a', label: 'It uses too much memory' },
            { value: 'b', label: 'It doesn\'t support complex data types' },
            { value: 'c', label: 'The <code>__reduce__</code> method can execute arbitrary code during deserialization' },
            { value: 'd', label: 'It only works with Python 2' }
          ],
          answer: 'c',
          hint: 'The __reduce__ method returns a callable that is invoked automatically during deserialization.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'What is the safe way to load YAML in Python?',
          options: [
            { value: 'a', label: '<code>yaml.safe_load()</code>' },
            { value: 'b', label: '<code>yaml.load(data, Loader=yaml.UnsafeLoader)</code>' },
            { value: 'c', label: '<code>yaml.unsafe_load()</code>' },
            { value: 'd', label: '<code>yaml.load(data)</code> with no Loader argument' }
          ],
          answer: 'a',
          hint: 'The safe variant only allows basic types and cannot instantiate arbitrary Python objects.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'Which serialization format is safe to use with untrusted data?',
          options: [
            { value: 'a', label: 'Python pickle' },
            { value: 'b', label: 'JSON (cannot execute code during parsing)' },
            { value: 'c', label: 'Java serialized objects' },
            { value: 'd', label: 'PHP serialized objects' }
          ],
          answer: 'b',
          hint: 'JSON only handles primitive types — strings, numbers, arrays, and objects — and has no code execution mechanism.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'Signing a serialized cookie with HMAC makes it completely safe to use <code>pickle.loads()</code> on the data, even if the signing key is weak or leaked.',
          answer: false,
          hint: 'If the signing key is cracked or leaked, an attacker can forge cookies with malicious pickle payloads.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'What is the name of the Python magic method that pickle calls during deserialization to reconstruct objects, enabling arbitrary code execution? (include double underscores)',
          placeholder: 'Type the method name...',
          // SHA-256 of "__reduce__"
          answerHash: '3cf5ed116a9556437685bebab7e101a91cfc38e2e1fa831d790d1c7922a419c8',
          hint: 'This dunder method returns a tuple of (callable, args) that pickle invokes to rebuild the object.'
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
