/* ============================================
   Game — Card Definitions & Sigil Registry
   ============================================ */

window.Game = window.Game || {};

Game.Cards = (() => {
  // Base deck cards
  const BASE = {
    ping: {
      id: 'ping', name: 'Ping', cost: 0, attack: 1, health: 1,
      sigil: null, tier: 'base', description: 'A basic network probe'
    },
    script_kiddie: {
      id: 'script_kiddie', name: 'Script Kiddie', cost: 1, attack: 1, health: 2,
      sigil: null, tier: 'base', description: 'Copies attacks from the internet'
    },
    firewall: {
      id: 'firewall', name: 'Firewall', cost: 1, attack: 0, health: 3,
      sigil: 'shield', tier: 'base', description: 'Blocks incoming traffic'
    },
    port_scanner: {
      id: 'port_scanner', name: 'Port Scanner', cost: 1, attack: 2, health: 1,
      sigil: null, tier: 'base', description: 'Probes for open services'
    }
  };

  // Common reward cards
  const COMMON = {
    packet_sniffer: {
      id: 'packet_sniffer', name: 'Packet Sniffer', cost: 1, attack: 1, health: 2,
      sigil: 'draw', tier: 'common', description: 'Intercepts data — draw a card on play'
    },
    botnet_node: {
      id: 'botnet_node', name: 'Botnet Node', cost: 2, attack: 2, health: 3,
      sigil: null, tier: 'common', description: 'A compromised machine in your army'
    },
    logic_bomb: {
      id: 'logic_bomb', name: 'Logic Bomb', cost: 2, attack: 3, health: 1,
      sigil: null, tier: 'common', description: 'Devastating but fragile payload'
    },
    proxy: {
      id: 'proxy', name: 'Proxy', cost: 1, attack: 0, health: 2,
      sigil: 'buff_adjacent', tier: 'common', description: 'Routes power — adjacent cards gain +1 atk'
    },
    encrypted_payload: {
      id: 'encrypted_payload', name: 'Encrypted Payload', cost: 2, attack: 2, health: 2,
      sigil: 'double_strike', tier: 'common', description: 'Attacks twice per turn'
    },
    rootkit: {
      id: 'rootkit', name: 'Rootkit', cost: 2, attack: 2, health: 2,
      sigil: 'deathtouch', tier: 'common', description: 'Any hit is lethal'
    },
    honeypot: {
      id: 'honeypot', name: 'Honeypot', cost: 1, attack: 0, health: 4,
      sigil: null, tier: 'common', description: 'Absorbs attacks while you build up'
    },
    backdoor: {
      id: 'backdoor', name: 'Backdoor', cost: 1, attack: 1, health: 1,
      sigil: 'draw', tier: 'common', description: 'Hidden access — draw a card on play'
    }
  };

  // Module unlock cards (one per educational module)
  const MODULE = {
    sql_injector: {
      id: 'sql_injector', name: 'SQL Injector', cost: 3, attack: 4, health: 2,
      sigil: 'drops_table', tier: 'module', moduleUnlock: 'vuln-sqli',
      description: 'Destroys 1 random enemy card on play'
    },
    xss_worm: {
      id: 'xss_worm', name: 'XSS Worm', cost: 2, attack: 1, health: 1,
      sigil: 'spread', tier: 'module', moduleUnlock: 'vuln-xss',
      description: 'Spawns a 1/1 copy in an adjacent empty slot'
    },
    template_exploit: {
      id: 'template_exploit', name: 'Template Exploit', cost: 2, attack: 2, health: 2,
      sigil: 'rce', tier: 'module', moduleUnlock: 'vuln-ssti',
      description: 'Deals 2 direct damage on play'
    },
    access_escalator: {
      id: 'access_escalator', name: 'Access Escalator', cost: 1, attack: 2, health: 3,
      sigil: 'escalate', tier: 'module', moduleUnlock: 'vuln-idor',
      description: 'Gains +1/+1 each turn'
    },
    credential_stuffer: {
      id: 'credential_stuffer', name: 'Credential Stuffer', cost: 2, attack: 3, health: 2,
      sigil: 'enumerate', tier: 'module', moduleUnlock: 'vuln-auth',
      description: 'Reveals next 2 enemy placements'
    },
    cipher_master: {
      id: 'cipher_master', name: 'Cipher Master', cost: 2, attack: 3, health: 3,
      sigil: 'encodes', tier: 'module', moduleUnlock: 'category-intro',
      description: 'Enemy across loses 1 atk each turn'
    },
    session_hijacker: {
      id: 'session_hijacker', name: 'Session Hijacker', cost: 2, attack: 2, health: 4,
      sigil: 'hijack', tier: 'module', moduleUnlock: 'category-after',
      description: 'Takes control of enemy card across'
    },
    ddos_swarm: {
      id: 'ddos_swarm', name: 'DDoS Swarm', cost: 3, attack: 1, health: 1,
      sigil: 'flood', tier: 'module', moduleUnlock: 'category-all',
      description: 'Fills all empty friendly slots with 1/1 tokens'
    }
  };

  // Token cards (summoned by sigils, not in deck)
  const TOKENS = {
    xss_token: {
      id: 'xss_token', name: 'XSS Copy', cost: 0, attack: 1, health: 1,
      sigil: null, tier: 'token', description: 'A copied worm'
    },
    ddos_token: {
      id: 'ddos_token', name: 'DDoS Bot', cost: 0, attack: 1, health: 1,
      sigil: null, tier: 'token', description: 'A flood bot'
    }
  };

  // Combined card registry
  const ALL = { ...BASE, ...COMMON, ...MODULE, ...TOKENS };

  // Deck template
  const BASE_DECK = ['ping', 'ping', 'script_kiddie', 'script_kiddie', 'firewall', 'port_scanner'];

  // Reward pools
  const COMMON_POOL = Object.keys(COMMON);

  // Module card lookup by module ID
  const MODULE_CARDS = {};
  for (const card of Object.values(MODULE)) {
    MODULE_CARDS[card.moduleUnlock] = card;
  }

  function getCard(id) {
    return ALL[id] || null;
  }

  function createInstance(id) {
    const def = ALL[id];
    if (!def) return null;
    return {
      ...def,
      currentHealth: def.health,
      currentAttack: def.attack,
      instanceId: id + '_' + Math.random().toString(36).substr(2, 6)
    };
  }

  return {
    ALL, BASE, COMMON, MODULE, TOKENS,
    BASE_DECK, COMMON_POOL, MODULE_CARDS,
    getCard, createInstance
  };
})();
