/* ============================================
   Game — Reward Scene (Post-Battle Card Selection)
   ============================================ */

class RewardScene extends Phaser.Scene {
  constructor() {
    super('Reward');
  }

  init(data) {
    this.isElite = data && data.isElite;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d1117');
    const W = this.scale.width;
    const H = this.scale.height;
    const state = Game.RunState.getState();

    // Title
    this.add.text(W / 2, 40, this.isElite ? 'ELITE REWARD' : 'CHOOSE A CARD', {
      fontSize: '20px', fontFamily: 'monospace', color: '#d29922', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, 65, 'Select a card to add to your deck', {
      fontSize: '12px', fontFamily: 'monospace', color: '#8b949e'
    }).setOrigin(0.5);

    // Generate card choices
    const choices = this.generateChoices(state);

    // Render cards
    const spacing = 160;
    const startX = W / 2 - (choices.length - 1) * spacing / 2;

    choices.forEach((cardDef, i) => {
      const x = startX + i * spacing;
      const y = H / 2 - 20;

      const container = Game.CardRenderer.createCard(this, cardDef, x, y);
      container.setInteractive({ useHandCursor: true });

      // Description below card
      this.add.text(x, y + 100, cardDef.description || '', {
        fontSize: '9px', fontFamily: 'monospace', color: '#8b949e',
        wordWrap: { width: 130 }, align: 'center'
      }).setOrigin(0.5, 0);

      container.on('pointerover', () => container.setScale(1.08));
      container.on('pointerout', () => container.setScale(1));
      container.on('pointerdown', () => {
        this.selectCard(cardDef.id);
      });
    });

    // Skip button
    Game.UI.createButton(this, W / 2, H - 50, 'SKIP', () => {
      Game.SaveManager.save();
      this.scene.start('Map');
    }, { width: 100, height: 32, color: 0x21262d, textColor: '#8b949e', fontSize: '12px' });
  }

  generateChoices(state) {
    const pool = [...Game.Cards.COMMON_POOL];
    const choices = [];
    const used = new Set();

    // For elite: possibly include a module unlock card
    if (this.isElite && state.unlockedModuleCards) {
      for (const modId of state.unlockedModuleCards) {
        const modCard = Game.Cards.MODULE_CARDS[modId];
        if (modCard && !used.has(modCard.id)) {
          choices.push(modCard);
          used.add(modCard.id);
          break;
        }
      }
    }

    // Fill rest with common cards
    const shuffled = pool.sort(() => Math.random() - 0.5);
    for (const id of shuffled) {
      if (choices.length >= 3) break;
      if (!used.has(id)) {
        const card = Game.Cards.getCard(id);
        if (card) {
          choices.push(card);
          used.add(id);
        }
      }
    }

    return choices;
  }

  selectCard(cardId) {
    Game.RunState.addCardToDeck(cardId);
    Game.SaveManager.save();

    // Flash effect
    const flash = this.add.graphics();
    flash.fillStyle(0x3fb950, 0.3);
    flash.fillRect(0, 0, this.scale.width, this.scale.height);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        flash.destroy();
        this.scene.start('Map');
      }
    });
  }
}
