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
          text_uk: 'Яка перша фаза Cyber Kill Chain?',
          options: [
            { value: 'a', label: 'Weaponization', label_uk: 'Weaponization (озброєння)' },
            { value: 'b', label: 'Reconnaissance', label_uk: 'Reconnaissance (розвідка)' },
            { value: 'c', label: 'Delivery', label_uk: 'Delivery (доставка)' },
            { value: 'd', label: 'Exploitation', label_uk: 'Exploitation (експлуатація)' }
          ],
          answer: 'b',
          hint: 'Attackers must gather information before they can act on it.',
          hint_uk: 'Зловмисники повинні зібрати інформацію, перш ніж діяти.'
        },
        {
          type: 'mc', id: 'q2',
          text: 'In which phase does the attacker create a deliverable payload (e.g., a malicious PDF)?',
          text_uk: 'На якій фазі зловмисник створює пейлоад для доставки (наприклад, шкідливий PDF)?',
          options: [
            { value: 'a', label: 'Reconnaissance', label_uk: 'Reconnaissance (розвідка)' },
            { value: 'b', label: 'Delivery', label_uk: 'Delivery (доставка)' },
            { value: 'c', label: 'Weaponization', label_uk: 'Weaponization (озброєння)' },
            { value: 'd', label: 'Installation', label_uk: 'Installation (встановлення)' }
          ],
          answer: 'c',
          hint: 'This phase pairs an exploit with a backdoor into a deliverable package.',
          hint_uk: 'Ця фаза поєднує експлойт з бекдором у пакет для доставки.'
        },
        {
          type: 'tf', id: 'q3',
          text: 'The "Actions on Objectives" phase is the final step where the attacker achieves their goal.',
          text_uk: 'Фаза "Actions on Objectives" є останнім кроком, де зловмисник досягає своєї мети.',
          answer: true,
          hint: 'This is where the attacker accomplishes what they set out to do.',
          hint_uk: 'Саме тут зловмисник виконує те, що планував.'
        },
        {
          type: 'mc', id: 'q4',
          text: 'Which phase involves establishing a persistent backdoor on the compromised system?',
          text_uk: 'Яка фаза передбачає встановлення постійного бекдору на скомпрометованій системі?',
          options: [
            { value: 'a', label: 'Exploitation', label_uk: 'Exploitation (експлуатація)' },
            { value: 'b', label: 'Command & Control', label_uk: 'Command & Control' },
            { value: 'c', label: 'Delivery', label_uk: 'Delivery (доставка)' },
            { value: 'd', label: 'Installation', label_uk: 'Installation (встановлення)' }
          ],
          answer: 'd',
          hint: 'Think about which phase ensures the attacker can maintain access.',
          hint_uk: 'Подумай, яка фаза забезпечує зловмиснику збереження доступу.'
        },
        {
          type: 'mc', id: 'q5',
          text: 'What is the purpose of the "Command & Control" (C2) phase?',
          text_uk: 'Яке призначення фази "Command & Control" (C2)?',
          options: [
            { value: 'a', label: 'To scan the target network', label_uk: 'Сканування цільової мережі' },
            { value: 'b', label: 'To deliver the exploit payload', label_uk: 'Доставка пейлоаду експлойту' },
            { value: 'c', label: 'To establish remote communication with the compromised system', label_uk: 'Встановлення віддаленого зв\'язку зі скомпрометованою системою' },
            { value: 'd', label: 'To exfiltrate data from the target', label_uk: 'Ексфільтрація даних з цілі' }
          ],
          answer: 'c',
          hint: 'C2 is about establishing a communication channel back to the attacker.',
          hint_uk: 'C2 — це встановлення каналу зв\'язку назад до зловмисника.'
        }
      ]
    });
  }

  function cleanup() {
    QuizEngine.cleanup('intro-killchain');
  }

  return { init, cleanup };
})();
