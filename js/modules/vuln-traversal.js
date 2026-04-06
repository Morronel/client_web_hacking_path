/* ============================================
   Module: Path Traversal
   ============================================ */

window.vulnTraversal = (() => {

  function init(container) {
    QuizEngine.init(container, 'vuln-traversal', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What is the primary sequence used in path traversal attacks?',
          options: [
            { value: 'a', label: '<code>./</code> (current directory)' },
            { value: 'b', label: '<code>../</code> (parent directory)' },
            { value: 'c', label: '<code>~/</code> (home directory)' },
            { value: 'd', label: '<code>*</code> (glob wildcard)' }
          ],
          answer: 'b',
          hint: 'This two-character sequence means "go up one directory" in every operating system.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'How did null byte injection (<code>%00</code>) historically bypass file extension appending?',
          options: [
            { value: 'a', label: 'It corrupted the file header' },
            { value: 'b', label: 'It changed the Content-Type' },
            { value: 'c', label: 'C string functions treated it as the end of the string, truncating the appended extension' },
            { value: 'd', label: 'It encoded the extension in base64' }
          ],
          answer: 'c',
          hint: 'In C-based runtimes, a null byte terminates the string, so any appended extension is ignored.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'Which Python approach best prevents path traversal?',
          options: [
            { value: 'a', label: 'Removing <code>../</code> with <code>str.replace()</code>' },
            { value: 'b', label: 'Checking if the path contains <code>..</code>' },
            { value: 'c', label: 'Blocking <code>/</code> characters' },
            { value: 'd', label: 'Using <code>os.path.basename()</code> + <code>os.path.realpath()</code> with a directory whitelist check' }
          ],
          answer: 'd',
          hint: 'Strip path components, resolve symlinks, then verify the result is within the allowed directory.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'Replacing <code>../</code> with an empty string using a single-pass <code>str.replace()</code> is a reliable defense against path traversal.',
          answer: false,
          hint: 'Payloads like <code>....//</code> become <code>../</code> after a single-pass replacement.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'What is the classic Linux file that attackers read first to confirm a path traversal vulnerability? (full absolute path)',
          placeholder: 'Type the full file path...',
          // SHA-256 of "/etc/passwd"
          answerHash: '74acf31844532670be412c65b8251ee55d072549080b1cffdbea6b1a192230a0',
          hint: 'This file contains user account information and is readable by all users on the system.'
        }
      ],
      flags: [
        {
          id: 'f1', label: 'Challenge 1 — Basic Traversal',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10
        },
        {
          id: 'f2', label: 'Challenge 2 — Null Byte Bypass',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15
        },
        {
          id: 'f3', label: 'Challenge 3 — Double Encoding',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('vuln-traversal');
  }

  return { init, cleanup };
})();
