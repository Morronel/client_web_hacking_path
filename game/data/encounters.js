/* ============================================
   Game — Encounter Definitions
   ============================================ */

window.Game = window.Game || {};

Game.Encounters = (() => {
  const NORMAL = [
    {
      name: 'Script Kiddie Gang',
      strategy: 'aggressive',
      cardPool: ['ping', 'ping', 'script_kiddie', 'port_scanner'],
      cardsPerTurn: 1,
      startDelay: 0
    },
    {
      name: 'Firewall Sentries',
      strategy: 'defensive',
      cardPool: ['firewall', 'ping', 'script_kiddie', 'firewall'],
      cardsPerTurn: 1,
      startDelay: 0
    },
    {
      name: 'Bot Swarm',
      strategy: 'aggressive',
      cardPool: ['ping', 'ping', 'ping', 'script_kiddie', 'port_scanner'],
      cardsPerTurn: 1,
      startDelay: 0
    },
    {
      name: 'Network Patrol',
      strategy: 'balanced',
      cardPool: ['script_kiddie', 'firewall', 'port_scanner'],
      cardsPerTurn: 1,
      startDelay: 1
    },
    {
      name: 'Reconnaissance Unit',
      strategy: 'balanced',
      cardPool: ['port_scanner', 'script_kiddie', 'ping', 'ping'],
      cardsPerTurn: 1,
      startDelay: 0
    }
  ];

  const ELITE = [
    {
      name: 'APT Group',
      strategy: 'balanced',
      cardPool: ['botnet_node', 'logic_bomb', 'encrypted_payload', 'script_kiddie'],
      cardsPerTurn: 2,
      startDelay: 0
    },
    {
      name: 'Ransomware Cell',
      strategy: 'aggressive',
      cardPool: ['logic_bomb', 'port_scanner', 'rootkit', 'botnet_node'],
      cardsPerTurn: 1,
      startDelay: 0
    },
    {
      name: 'Defense Grid',
      strategy: 'defensive',
      cardPool: ['honeypot', 'firewall', 'proxy', 'botnet_node'],
      cardsPerTurn: 2,
      startDelay: 0
    }
  ];

  const BOSS = {
    name: 'The Firewall',
    phases: [
      {
        name: 'Outer Perimeter',
        strategy: 'defensive',
        cardPool: ['firewall', 'firewall', 'ping', 'script_kiddie', 'honeypot'],
        cardsPerTurn: 1,
        threshold: 5,
        dialogueStart: 'You dare challenge my perimeter?',
        dialogueEnd: 'My outer defenses... breached.'
      },
      {
        name: 'Countermeasures',
        strategy: 'aggressive',
        cardPool: ['logic_bomb', 'port_scanner', 'botnet_node', 'script_kiddie', 'rootkit'],
        cardsPerTurn: 2,
        threshold: 7,
        dialogueStart: 'Initiating active countermeasures.',
        dialogueEnd: 'Impossible... recalibrating...'
      },
      {
        name: 'Final Protocol',
        strategy: 'balanced',
        cardPool: ['encrypted_payload', 'proxy', 'botnet_node', 'logic_bomb', 'rootkit'],
        cardsPerTurn: 2,
        threshold: 5,
        dialogueStart: 'Deploying final protocols.',
        dialogueEnd: 'System... compromised.'
      }
    ]
  };

  return { NORMAL, ELITE, BOSS };
})();
