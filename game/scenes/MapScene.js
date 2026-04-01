/* ============================================
   Game — Map Scene (Node-Based Progression)
   ============================================ */

class MapScene extends Phaser.Scene {
  constructor() {
    super('Map');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d1117');
    const W = this.scale.width;
    const H = this.scale.height;
    const state = Game.RunState.getState();
    const map = state.map;

    // Title
    this.add.text(W / 2, 20, 'SHADOW TERMINAL', {
      fontSize: '24px', fontFamily: 'monospace', color: '#3fb950', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, 46, `Wins: ${state.wins}  |  Deck: ${state.deck.length} cards`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#8b949e'
    }).setOrigin(0.5);

    // Layout constants
    const marginTop = 70;
    const marginBottom = 80;
    const colSpacing = (W - 100) / (map.columns.length - 1);
    const nodeRadius = 18;

    // Calculate node positions
    const nodePositions = {};
    for (const col of map.columns) {
      const nodeCount = col.nodes.length;
      const colX = 50 + col.depth * colSpacing;
      const availableH = H - marginTop - marginBottom;
      const nodeSpacing = nodeCount > 1 ? availableH / (nodeCount + 1) : 0;

      col.nodes.forEach((node, idx) => {
        const y = nodeCount === 1
          ? marginTop + availableH / 2
          : marginTop + nodeSpacing * (idx + 1);
        nodePositions[node.id] = { x: colX, y };
      });
    }

    // Draw edges
    for (const edge of map.edges) {
      const from = nodePositions[edge.from];
      const to = nodePositions[edge.to];
      if (!from || !to) continue;

      const isVisited = this.isNodeVisited(state, edge.from) && this.isNodeVisited(state, edge.to);
      const graphics = this.add.graphics();
      graphics.lineStyle(2, isVisited ? 0x3fb950 : 0x30363d, isVisited ? 0.8 : 0.4);
      graphics.lineBetween(from.x, from.y, to.x, to.y);
    }

    // Draw nodes
    const reachable = Game.RunState.getReachableNodes();
    const reachableIds = new Set(reachable.map(r => r.node.id));
    const currentId = `${state.currentNode[0]}-${state.currentNode[1]}`;

    for (const col of map.columns) {
      for (const node of col.nodes) {
        const pos = nodePositions[node.id];
        const isVisited = this.isNodeVisited(state, node.id);
        const isCurrent = node.id === currentId;
        const isReachable = reachableIds.has(node.id);

        this.drawNode(pos.x, pos.y, nodeRadius, node, isVisited, isCurrent, isReachable, state);
      }
    }

    // Deck view button
    Game.UI.createButton(this, 90, H - 32, 'VIEW DECK', () => {
      this.showDeckOverlay(state);
    }, { width: 140, height: 38, color: 0x21262d, textColor: '#e6edf3', fontSize: '14px' });

    // Quit button
    Game.UI.createButton(this, W - 90, H - 32, 'QUIT RUN', () => {
      Game.SaveManager.clearSave();
      this.scene.start('Boot');
    }, { width: 140, height: 38, color: 0x21262d, textColor: '#f85149', fontSize: '14px' });
  }

  isNodeVisited(state, nodeId) {
    const [d, i] = nodeId.split('-').map(Number);
    const currentId = `${state.currentNode[0]}-${state.currentNode[1]}`;
    if (nodeId === currentId) return true;
    return state.visitedNodes.some(([vd, vi]) => `${vd}-${vi}` === nodeId);
  }

  drawNode(x, y, r, node, visited, current, reachable, state) {
    const colors = {
      battle: 0x3fb950,
      reward: 0xd29922,
      elite: 0xf85149,
      boss: 0x8b5cf6
    };

    const icons = {
      battle: '⚔',
      reward: '🃏',
      elite: '💀',
      boss: '🔥'
    };

    const color = colors[node.type] || 0x30363d;
    const g = this.add.graphics();

    if (current) {
      // Pulsing glow for current node
      g.fillStyle(color, 0.2);
      g.fillCircle(x, y, r + 8);
      this.tweens.add({
        targets: g,
        alpha: { from: 1, to: 0.3 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    }

    if (visited && !current) {
      g.fillStyle(color, 0.2);
      g.fillCircle(x, y, r);
      g.lineStyle(2, color, 0.4);
      g.strokeCircle(x, y, r);
    } else if (reachable || current) {
      g.fillStyle(color, 0.6);
      g.fillCircle(x, y, r);
      g.lineStyle(2, color, 1);
      g.strokeCircle(x, y, r);
    } else {
      g.fillStyle(0x21262d, 0.5);
      g.fillCircle(x, y, r);
      g.lineStyle(1, 0x30363d, 0.5);
      g.strokeCircle(x, y, r);
    }

    // Icon
    const icon = this.add.text(x, y, icons[node.type] || '?', {
      fontSize: '20px'
    }).setOrigin(0.5);
    if (!reachable && !current && !visited) icon.setAlpha(0.3);

    // Label below
    if (node.type === 'boss') {
      this.add.text(x, y + r + 8, node.encounter ? node.encounter.name : 'BOSS', {
        fontSize: '12px', fontFamily: 'monospace', color: '#8b5cf6'
      }).setOrigin(0.5, 0);
    }

    // Click handler for reachable nodes
    if (reachable) {
      const zone = this.add.zone(x, y, r * 2.5, r * 2.5).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.navigateToNode(node);
      });
    }
  }

  navigateToNode(node) {
    const [d, i] = node.id.split('-').map(Number);
    Game.RunState.advanceToNode(d, i);
    Game.SaveManager.save();

    if (node.type === 'battle') {
      this.scene.start('Battle', { encounter: node.encounter, isElite: false });
    } else if (node.type === 'elite') {
      this.scene.start('Battle', { encounter: node.encounter, isElite: true });
    } else if (node.type === 'reward') {
      this.scene.start('Reward', { isElite: false });
    } else if (node.type === 'boss') {
      this.scene.start('Boss');
    }
  }

  showDeckOverlay(state) {
    const W = this.scale.width;
    const H = this.scale.height;

    // Overlay background
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, W, H);

    this.add.text(W / 2, 30, 'YOUR DECK', {
      fontSize: '20px', fontFamily: 'monospace', color: '#d29922', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Render cards in a grid
    const cardIds = [...state.deck].sort();
    const perRow = 6;
    const cardW = 100;
    const cardH = 130;
    const spacing = 10;
    const startX = (W - (perRow * (cardW + spacing))) / 2 + cardW / 2;
    const startY = 70 + cardH / 2;

    cardIds.forEach((id, idx) => {
      const def = Game.Cards.getCard(id);
      if (!def) return;
      const row = Math.floor(idx / perRow);
      const col = idx % perRow;
      Game.CardRenderer.createCard(this, def, startX + col * (cardW + spacing), startY + row * (cardH + spacing), { small: true });
    });

    // Close button
    Game.UI.createButton(this, W / 2, H - 40, 'CLOSE', () => {
      this.scene.restart();
    }, { width: 130, height: 38, color: 0x21262d, textColor: '#e6edf3', fontSize: '14px' });
  }
}
