/* ============================================
   Game — Run State Manager
   ============================================ */

window.Game = window.Game || {};

Game.RunState = (() => {
  const MODULE_LAB_COUNTS = {
    'intro-legal': 1, 'intro-networking': 3, 'intro-encoding': 4, 'intro-cookies': 2,
    'intro-sop': 2, 'intro-history': 1, 'intro-killchain': 1,
    'vuln-sqli': 4, 'vuln-xss': 5, 'vuln-ssti': 2, 'vuln-idor': 2, 'vuln-auth': 2,
    'after-reporting': 1, 'after-obfuscation': 2, 'after-recon': 2, 'after-next': 1
  };

  let state = null;

  function detectUnlockedModules() {
    const unlocked = [];
    for (const [moduleId, totalLabs] of Object.entries(MODULE_LAB_COUNTS)) {
      if (Storage.getModuleStatus(moduleId, totalLabs) === 'completed') {
        unlocked.push(moduleId);
      }
    }
    // Check category-based unlocks
    if (window.Router) {
      if (Router.isCategoryComplete('intro')) unlocked.push('category-intro');
      if (Router.isCategoryComplete('after')) unlocked.push('category-after');
      if (Router.isCategoryComplete('intro') && Router.isCategoryComplete('vuln') && Router.isCategoryComplete('after')) {
        unlocked.push('category-all');
      }
    }
    return unlocked;
  }

  function newRun() {
    const unlocked = detectUnlockedModules();

    // Build starter deck: 6 base cards + up to 3 module unlock cards
    const baseDeck = ['ping', 'ping', 'script_kiddie', 'script_kiddie', 'firewall', 'port_scanner'];
    const moduleCards = [];
    if (unlocked.length > 0) {
      const shuffled = [...unlocked].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, Math.min(3, shuffled.length));
      for (const modId of picked) {
        const card = Game.Cards.MODULE_CARDS[modId];
        if (card) moduleCards.push(card.id);
      }
    }

    state = {
      deck: [...baseDeck, ...moduleCards],
      map: generateMap(),
      currentNode: [0, 0],
      visitedNodes: [],
      scale: 0,
      wins: 0,
      turnsPlayed: 0,
      cardsCollected: 0,
      unlockedModuleCards: unlocked
    };

    return state;
  }

  function generateMap() {
    const templates = [
      { types: ['battle'] },
      { types: ['battle', 'reward'] },
      { types: ['battle'] },
      { types: ['reward', 'battle'] },
      { types: ['elite'] },
      { types: ['reward', 'battle'] },
      { types: ['battle'] },
      { types: ['battle', 'reward'] },
      { types: ['boss'] }
    ];

    const columns = templates.map((tmpl, depth) => ({
      depth,
      nodes: tmpl.types.map((type, idx) => ({
        type,
        id: `${depth}-${idx}`,
        encounter: null
      }))
    }));

    // Assign encounters
    const normalPool = [...Game.Encounters.NORMAL];
    const elitePool = [...Game.Encounters.ELITE];

    for (const col of columns) {
      for (const node of col.nodes) {
        if (node.type === 'battle') {
          node.encounter = normalPool[Math.floor(Math.random() * normalPool.length)];
        } else if (node.type === 'elite') {
          node.encounter = elitePool[Math.floor(Math.random() * elitePool.length)];
        } else if (node.type === 'boss') {
          node.encounter = Game.Encounters.BOSS;
        }
      }
    }

    // Generate edges
    const edges = [];
    for (let d = 0; d < columns.length - 1; d++) {
      const curr = columns[d].nodes;
      const next = columns[d + 1].nodes;
      const connected = new Set();

      for (let i = 0; i < curr.length; i++) {
        // Each node connects to at least 1 in next column
        const primaryTarget = Math.min(i, next.length - 1);
        edges.push({ from: curr[i].id, to: next[primaryTarget].id });
        connected.add(primaryTarget);

        // Possibly connect to a second node
        if (next.length > 1 && Math.random() < 0.4) {
          const alt = (primaryTarget + 1) % next.length;
          edges.push({ from: curr[i].id, to: next[alt].id });
          connected.add(alt);
        }
      }

      // Ensure every node in next column has at least 1 incoming edge
      for (let j = 0; j < next.length; j++) {
        if (!connected.has(j)) {
          const src = Math.floor(Math.random() * curr.length);
          edges.push({ from: curr[src].id, to: next[j].id });
        }
      }
    }

    return { columns, edges };
  }

  function getState() { return state; }
  function setState(s) { state = s; }

  function getReachableNodes() {
    if (!state || !state.map) return [];
    const [curDepth, curIdx] = state.currentNode;
    const curId = `${curDepth}-${curIdx}`;
    return state.map.edges
      .filter(e => e.from === curId)
      .map(e => {
        const [d, i] = e.to.split('-').map(Number);
        return { depth: d, index: i, node: state.map.columns[d].nodes[i] };
      });
  }

  function advanceToNode(depth, index) {
    state.visitedNodes.push([...state.currentNode]);
    state.currentNode = [depth, index];
  }

  function addCardToDeck(cardId) {
    state.deck.push(cardId);
    state.cardsCollected++;
  }

  return {
    newRun, getState, setState, generateMap,
    getReachableNodes, advanceToNode, addCardToDeck,
    detectUnlockedModules, MODULE_LAB_COUNTS
  };
})();
