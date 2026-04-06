/* ============================================
   Module — Cyber Kill Chain
   ============================================ */

window.introKillchain = (() => {
  function init(container) {
    QuizEngine.init(container, 'intro-killchain', {
      questions: [
        {
          type: 'mc',
          text: 'What is the first phase of the Cyber Kill Chain?',
          options: [
            'Weaponization',
            'Reconnaissance',
            'Delivery',
            'Exploitation'
          ],
          answer: 1
        },
        {
          type: 'mc',
          text: 'In which phase does the attacker create a deliverable payload (e.g., a malicious PDF)?',
          options: [
            'Reconnaissance',
            'Delivery',
            'Weaponization',
            'Installation'
          ],
          answer: 2
        },
        {
          type: 'tf',
          text: 'The "Actions on Objectives" phase is the final step where the attacker achieves their goal.',
          answer: true
        },
        {
          type: 'mc',
          text: 'Which phase involves establishing a persistent backdoor on the compromised system?',
          options: [
            'Exploitation',
            'Command & Control',
            'Delivery',
            'Installation'
          ],
          answer: 3
        },
        {
          type: 'mc',
          text: 'What is the purpose of the "Command & Control" (C2) phase?',
          options: [
            'To scan the target network',
            'To deliver the exploit payload',
            'To establish remote communication with the compromised system',
            'To exfiltrate data from the target'
          ],
          answer: 2
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('intro-killchain');
  }

  return { init, cleanup };
})();
