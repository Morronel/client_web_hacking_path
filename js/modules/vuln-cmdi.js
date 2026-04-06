/* ============================================
   Module: Command Injection
   ============================================ */

window.vulnCmdi = (() => {

  function init(container) {
    QuizEngine.init(container, 'vuln-cmdi', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'Which Python function is the safest way to run external commands?',
          options: [
            { value: 'a', label: '<code>os.system(cmd)</code>' },
            { value: 'b', label: '<code>os.popen(cmd)</code>' },
            { value: 'c', label: '<code>subprocess.run(cmd, shell=True)</code>' },
            { value: 'd', label: '<code>subprocess.run([cmd, arg1, arg2])</code> (list, no shell)' }
          ],
          answer: 'd',
          hint: 'Think about which approach avoids shell interpretation entirely.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'Which characters are commonly used for command injection?',
          options: [
            { value: 'a', label: 'Semicolons (<code>;</code>), pipes (<code>|</code>), backticks, and <code>$()</code>' },
            { value: 'b', label: 'Angle brackets and ampersands only' },
            { value: 'c', label: 'Curly braces and square brackets only' },
            { value: 'd', label: 'Quote characters only' }
          ],
          answer: 'a',
          hint: 'Shell metacharacters that separate or substitute commands.'
        },
        {
          type: 'mc', id: 'q3',
          text: 'How can blind command injection be detected?',
          options: [
            { value: 'a', label: 'By checking the HTTP response code' },
            { value: 'b', label: 'By checking if the page layout changes' },
            { value: 'c', label: 'Using time delays (<code>sleep</code>) or out-of-band channels (DNS/HTTP callbacks)' },
            { value: 'd', label: 'By reading the server\'s access log directly' }
          ],
          answer: 'c',
          hint: 'When you can\'t see output, you need side channels.'
        },
        {
          type: 'tf', id: 'q4',
          text: 'Using <code>shlex.quote()</code> on user input before passing it to <code>subprocess.run(shell=True)</code> is a fully reliable defense against command injection.',
          answer: false,
          hint: 'The most reliable defense is avoiding the shell entirely — use a list argument.'
        },
        {
          type: 'fill', id: 'q5',
          text: 'In bash, what variable acts as a space character and can bypass space-filtering WAFs? (three letters, starts with I)',
          placeholder: 'Type the variable name...',
          // SHA-256 of "ifs"
          answerHash: '5765a582f926f10d35bdfbf79e88afdcb16e2906e5aa1689da258b33360fb64c',
          hint: 'Internal Field Separator — $IFS in shell scripts.'
        }
      ],
      flags: [
        {
          id: 'f1', label: 'Challenge 1 — Basic Injection',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 10
        },
        {
          id: 'f2', label: 'Challenge 2 — Blind Injection',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 15
        },
        {
          id: 'f3', label: 'Challenge 3 — Filter Bypass',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', points: 20
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('vuln-cmdi');
  }

  return { init, cleanup };
})();
