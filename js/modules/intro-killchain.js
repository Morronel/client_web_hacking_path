/* ============================================
   Module — Cyber Kill Chain
   ============================================ */

window.introKillchain = (() => {
  function init(container) {
    QuizEngine.init(container, 'intro-killchain', {
      questions: [
        {
          type: 'mc', id: 'q1',
          text: 'What is the first phase of the Cyber Kill Chain?',
          options: [
            { value: 'a', label: 'Weaponization' },
            { value: 'b', label: 'Reconnaissance' },
            { value: 'c', label: 'Delivery' },
            { value: 'd', label: 'Exploitation' }
          ],
          answer: 'b',
          hint: 'Attackers must gather information before they can act on it.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'In which phase does the attacker create a deliverable payload (e.g., a malicious PDF)?',
          options: [
            { value: 'a', label: 'Reconnaissance' },
            { value: 'b', label: 'Delivery' },
            { value: 'c', label: 'Weaponization' },
            { value: 'd', label: 'Installation' }
          ],
          answer: 'c',
          hint: 'This phase pairs an exploit with a backdoor into a deliverable package.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'The "Actions on Objectives" phase is the final step where the attacker achieves their goal.',
          answer: true,
          hint: 'This is where the attacker accomplishes what they set out to do.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'Which phase involves establishing a persistent backdoor on the compromised system?',
          options: [
            { value: 'a', label: 'Exploitation' },
            { value: 'b', label: 'Command & Control' },
            { value: 'c', label: 'Delivery' },
            { value: 'd', label: 'Installation' }
          ],
          answer: 'd',
          hint: 'Think about which phase ensures the attacker can maintain access.'
        },
        {
          type: 'mc', id: 'q5',
          text: 'What is the purpose of the "Command & Control" (C2) phase?',
          options: [
            { value: 'a', label: 'To scan the target network' },
            { value: 'b', label: 'To deliver the exploit payload' },
            { value: 'c', label: 'To establish remote communication with the compromised system' },
            { value: 'd', label: 'To exfiltrate data from the target' }
          ],
          answer: 'c',
          hint: 'C2 is about establishing a communication channel back to the attacker.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('intro-killchain');
  }

  return { init, cleanup };
})();
