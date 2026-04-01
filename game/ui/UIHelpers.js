/* ============================================
   Game — UI Helpers (Scale, Slots, Hand, Buttons)
   ============================================ */

window.Game = window.Game || {};

Game.UI = (() => {
  const C = { bg: 0x0d1117, bg2: 0x161b22, border: 0x30363d, green: 0x3fb950, amber: 0xd29922, red: 0xf85149, white: 0xe6edf3 };

  function createScale(scene, x, y) {
    const container = scene.add.container(x, y);
    const width = 300;
    const height = 30;

    // Background bar
    const bg = scene.add.graphics();
    bg.fillStyle(C.bg2, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
    bg.lineStyle(1, C.border, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    container.add(bg);

    // Center marker
    const center = scene.add.graphics();
    center.fillStyle(C.white, 0.3);
    center.fillRect(-1, -height / 2, 2, height);
    container.add(center);

    // Scale indicator
    const indicator = scene.add.graphics();
    container.add(indicator);

    // Labels
    const leftLabel = scene.add.text(-width / 2 - 30, 0, 'YOU', {
      fontSize: '9px', fontFamily: 'monospace', color: '#f85149'
    }).setOrigin(1, 0.5);
    container.add(leftLabel);

    const rightLabel = scene.add.text(width / 2 + 30, 0, 'FOE', {
      fontSize: '9px', fontFamily: 'monospace', color: '#3fb950'
    }).setOrigin(0, 0.5);
    container.add(rightLabel);

    // Value text
    const valueText = scene.add.text(0, 0, '0', {
      fontSize: '14px', fontFamily: 'monospace', color: '#e6edf3', fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(valueText);

    function update(value, threshold) {
      indicator.clear();
      const pct = Math.max(-1, Math.min(1, value / (threshold || 5)));
      const barW = Math.abs(pct) * (width / 2 - 4);
      const color = value >= 0 ? C.green : C.red;
      indicator.fillStyle(color, 0.6);
      if (value >= 0) {
        indicator.fillRect(0, -height / 2 + 4, barW, height - 8);
      } else {
        indicator.fillRect(-barW, -height / 2 + 4, barW, height - 8);
      }
      valueText.setText(value > 0 ? '+' + value : String(value));
      valueText.setColor(value > 0 ? '#3fb950' : value < 0 ? '#f85149' : '#e6edf3');
    }

    container.update = update;
    return container;
  }

  function createSlotGrid(scene, centerX, topY, laneSpacing) {
    const slots = { player: [], enemy: [] };
    const spacing = laneSpacing || 120;
    const startX = centerX - (spacing * 1.5);

    for (let i = 0; i < 4; i++) {
      const x = startX + i * spacing;

      // Enemy slot (top)
      const eSlot = createSlot(scene, x, topY, i, 'enemy');
      slots.enemy.push(eSlot);

      // Player slot (bottom)
      const pSlot = createSlot(scene, x, topY + 150, i, 'player');
      slots.player.push(pSlot);

      // Lane divider
      const line = scene.add.graphics();
      line.lineStyle(1, C.border, 0.3);
      line.lineBetween(x, topY - 70, x, topY + 220);
    }

    return slots;
  }

  function createSlot(scene, x, y, laneIndex, side) {
    const w = 105;
    const h = 135;
    const graphics = scene.add.graphics();
    graphics.lineStyle(1, C.border, 0.5);
    graphics.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 4);

    // Drop zone for player slots
    const zone = scene.add.zone(x, y, w, h).setRectangleDropZone(w, h);
    zone.laneIndex = laneIndex;
    zone.side = side;

    return { x, y, w, h, zone, laneIndex, side, graphics, card: null };
  }

  function createHandArea(scene, y) {
    return { y, cards: [] };
  }

  function layoutHand(scene, handContainers, centerX, y) {
    const count = handContainers.length;
    if (count === 0) return;
    const spacing = Math.min(120, 600 / count);
    const totalW = (count - 1) * spacing;
    const startX = centerX - totalW / 2;

    handContainers.forEach((card, i) => {
      const targetX = startX + i * spacing;
      scene.tweens.add({
        targets: card,
        x: targetX,
        y: y,
        duration: 200,
        ease: 'Power2'
      });
    });
  }

  function createDataPointsDisplay(scene, x, y) {
    const container = scene.add.container(x, y);
    const label = scene.add.text(0, -12, 'DATA POINTS', {
      fontSize: '9px', fontFamily: 'monospace', color: '#8b949e'
    }).setOrigin(0.5);
    container.add(label);

    const dots = [];
    for (let i = 0; i < 3; i++) {
      const dot = scene.add.graphics();
      dot.x = (i - 1) * 20;
      dot.y = 6;
      dots.push(dot);
      container.add(dot);
    }

    function update(current, max) {
      dots.forEach((dot, i) => {
        dot.clear();
        if (i < max) {
          dot.fillStyle(i < current ? C.green : C.border, 1);
          dot.fillCircle(0, 0, 7);
        }
      });
    }

    container.update = update;
    return container;
  }

  function createDeckCounter(scene, x, y) {
    const container = scene.add.container(x, y);

    const bg = scene.add.graphics();
    bg.fillStyle(C.bg2, 1);
    bg.fillRoundedRect(-25, -20, 50, 40, 4);
    bg.lineStyle(1, C.border, 1);
    bg.strokeRoundedRect(-25, -20, 50, 40, 4);
    container.add(bg);

    const icon = scene.add.text(0, -6, '🃏', { fontSize: '14px' }).setOrigin(0.5);
    container.add(icon);

    const countText = scene.add.text(0, 12, '0', {
      fontSize: '11px', fontFamily: 'monospace', color: '#e6edf3'
    }).setOrigin(0.5);
    container.add(countText);

    function update(count) {
      countText.setText(String(count));
    }

    container.update = update;
    return container;
  }

  function showFloatingText(scene, x, y, text, color) {
    const txt = scene.add.text(x, y, text, {
      fontSize: '16px', fontFamily: 'monospace', color: color || '#e6edf3', fontStyle: 'bold'
    }).setOrigin(0.5);
    scene.tweens.add({
      targets: txt,
      y: y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => txt.destroy()
    });
  }

  function createButton(scene, x, y, text, callback, opts = {}) {
    const w = opts.width || 160;
    const h = opts.height || 40;
    const container = scene.add.container(x, y);

    const bg = scene.add.graphics();
    bg.fillStyle(opts.color || C.green, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    container.add(bg);

    const label = scene.add.text(0, 0, text, {
      fontSize: opts.fontSize || '14px', fontFamily: 'monospace',
      color: opts.textColor || '#000', fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(label);

    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => { container.setScale(1.05); });
    container.on('pointerout', () => { container.setScale(1); });
    container.on('pointerdown', callback);

    return container;
  }

  return {
    createScale, createSlotGrid, createHandArea, layoutHand,
    createDataPointsDisplay, createDeckCounter, showFloatingText, createButton
  };
})();
