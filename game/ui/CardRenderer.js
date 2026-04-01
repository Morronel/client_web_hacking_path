/* ============================================
   Game — Phaser Card Renderer
   ============================================ */

window.Game = window.Game || {};

Game.CardRenderer = (() => {
  const C = { bg: 0x161b22, border: 0x30363d, green: 0x3fb950, amber: 0xd29922, red: 0xf85149, blue: 0x58a6ff, white: 0xe6edf3, dark: 0x0d1117 };
  const CARD_W = 110;
  const CARD_H = 150;
  const SLOT_CARD_W = 100;
  const SLOT_CARD_H = 130;

  function tierColor(tier) {
    if (tier === 'module') return C.red;
    if (tier === 'common') return C.green;
    if (tier === 'token') return C.blue;
    return C.border;
  }

  function createCard(scene, cardDef, x, y, opts = {}) {
    const w = opts.small ? SLOT_CARD_W : CARD_W;
    const h = opts.small ? SLOT_CARD_H : CARD_H;
    const container = scene.add.container(x, y);

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(C.bg, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.lineStyle(2, tierColor(cardDef.tier), 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    container.add(bg);

    // Cost badge (top-left)
    const costBg = scene.add.graphics();
    costBg.fillStyle(C.amber, 1);
    costBg.fillCircle(-w / 2 + 14, -h / 2 + 14, 11);
    container.add(costBg);
    const costText = scene.add.text(-w / 2 + 14, -h / 2 + 14, String(cardDef.cost), {
      fontSize: '12px', fontFamily: 'monospace', color: '#000', fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(costText);

    // Name
    const name = scene.add.text(0, -h / 2 + 28, cardDef.name, {
      fontSize: opts.small ? '10px' : '11px', fontFamily: 'monospace', color: '#e6edf3',
      fontStyle: 'bold', wordWrap: { width: w - 16 }, align: 'center'
    }).setOrigin(0.5, 0);
    container.add(name);

    // Sigil text (center)
    if (cardDef.sigil) {
      const sigilLabel = formatSigil(cardDef.sigil);
      const sigil = scene.add.text(0, opts.small ? 5 : 10, sigilLabel, {
        fontSize: '9px', fontFamily: 'monospace', color: '#d29922',
        wordWrap: { width: w - 12 }, align: 'center'
      }).setOrigin(0.5);
      container.add(sigil);
    }

    // Attack badge (bottom-left)
    const atk = cardDef.currentAttack !== undefined ? cardDef.currentAttack : cardDef.attack;
    const atkText = scene.add.text(-w / 2 + 16, h / 2 - 18, '⚔' + atk, {
      fontSize: '13px', fontFamily: 'monospace', color: '#f85149', fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(atkText);

    // Health badge (bottom-right)
    const hp = cardDef.currentHealth !== undefined ? cardDef.currentHealth : cardDef.health;
    const hpText = scene.add.text(w / 2 - 16, h / 2 - 18, '♥' + hp, {
      fontSize: '13px', fontFamily: 'monospace', color: '#3fb950', fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(hpText);

    // Module lock icon
    if (cardDef.tier === 'module') {
      const lockIcon = scene.add.text(w / 2 - 14, -h / 2 + 14, '★', {
        fontSize: '14px', color: '#f85149'
      }).setOrigin(0.5);
      container.add(lockIcon);
    }

    container.setSize(w, h);
    container.cardDef = cardDef;
    container.cardW = w;
    container.cardH = h;

    return container;
  }

  function formatSigil(sigil) {
    const labels = {
      shield: '🛡 Shield',
      draw: '📄 Draw',
      buff_adjacent: '↔ Buff +1',
      double_strike: '⚔⚔ 2x Strike',
      deathtouch: '☠ Deathtouch',
      encodes: '🔒 Encode',
      drops_table: '💥 DROP TABLE',
      rce: '⚡ RCE',
      escalate: '📈 Escalate',
      spread: '🐛 Spread',
      enumerate: '🔍 Enumerate',
      hijack: '🎭 Hijack',
      flood: '🌊 Flood'
    };
    return labels[sigil] || sigil;
  }

  function animateAttack(scene, container, targetX, targetY, callback) {
    const origX = container.x;
    const origY = container.y;
    scene.tweens.add({
      targets: container,
      x: targetX,
      y: targetY,
      duration: 150,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        container.x = origX;
        container.y = origY;
        if (callback) callback();
      }
    });
  }

  function animateDamage(scene, container, amount) {
    const txt = scene.add.text(container.x, container.y - 30, '-' + amount, {
      fontSize: '18px', fontFamily: 'monospace', color: '#f85149', fontStyle: 'bold'
    }).setOrigin(0.5);
    scene.tweens.add({
      targets: txt,
      y: txt.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => txt.destroy()
    });
  }

  function animateDeath(scene, container, callback) {
    scene.tweens.add({
      targets: container,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 300,
      onComplete: () => {
        container.destroy();
        if (callback) callback();
      }
    });
  }

  return {
    createCard, animateAttack, animateDamage, animateDeath,
    CARD_W, CARD_H, SLOT_CARD_W, SLOT_CARD_H, tierColor
  };
})();
