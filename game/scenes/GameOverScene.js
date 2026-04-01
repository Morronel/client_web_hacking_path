/* ============================================
   Game — Game Over Scene (Win/Loss)
   ============================================ */

class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  init(data) {
    this.won = data && data.won;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d1117');
    const W = this.scale.width;
    const H = this.scale.height;
    const state = Game.RunState.getState();

    if (this.won) {
      // Victory screen
      this.add.text(W / 2, 100, '╔═══════════════════╗', {
        fontSize: '18px', fontFamily: 'monospace', color: '#3fb950'
      }).setOrigin(0.5);
      this.add.text(W / 2, 130, '║  SYSTEM BREACHED  ║', {
        fontSize: '18px', fontFamily: 'monospace', color: '#3fb950', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add.text(W / 2, 160, '╚═══════════════════╝', {
        fontSize: '18px', fontFamily: 'monospace', color: '#3fb950'
      }).setOrigin(0.5);

      this.add.text(W / 2, 200, 'You defeated The Firewall!', {
        fontSize: '14px', fontFamily: 'monospace', color: '#d29922'
      }).setOrigin(0.5);
    } else {
      // Defeat screen
      this.add.text(W / 2, 100, '╔═══════════════════╗', {
        fontSize: '18px', fontFamily: 'monospace', color: '#f85149'
      }).setOrigin(0.5);
      this.add.text(W / 2, 130, '║   CONNECTION LOST  ║', {
        fontSize: '18px', fontFamily: 'monospace', color: '#f85149', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add.text(W / 2, 160, '╚═══════════════════╝', {
        fontSize: '18px', fontFamily: 'monospace', color: '#f85149'
      }).setOrigin(0.5);

      this.add.text(W / 2, 200, 'Your attack was repelled.', {
        fontSize: '14px', fontFamily: 'monospace', color: '#8b949e'
      }).setOrigin(0.5);
    }

    // Stats
    if (state) {
      const stats = [
        `Battles Won: ${state.wins || 0}`,
        `Cards Collected: ${state.cardsCollected || 0}`,
        `Turns Played: ${state.turnsPlayed || 0}`,
        `Final Deck Size: ${state.deck ? state.deck.length : 0}`,
        `Module Cards Unlocked: ${state.unlockedModuleCards ? state.unlockedModuleCards.length : 0}/8`
      ];

      this.add.text(W / 2, 250, 'RUN STATISTICS', {
        fontSize: '12px', fontFamily: 'monospace', color: '#d29922', fontStyle: 'bold'
      }).setOrigin(0.5);

      stats.forEach((stat, i) => {
        this.add.text(W / 2, 275 + i * 22, stat, {
          fontSize: '11px', fontFamily: 'monospace', color: '#8b949e'
        }).setOrigin(0.5);
      });
    }

    // Buttons
    Game.UI.createButton(this, W / 2, H - 100, 'PLAY AGAIN', () => {
      this.scene.start('Boot');
    }, { width: 180, height: 44, fontSize: '14px' });

    Game.UI.createButton(this, W / 2, H - 45, '← BACK TO ACADEMY', () => {
      if (window.Game && window.Game.destroy) {
        window.Game.destroy();
      }
      location.hash = '#m1';
    }, { width: 220, height: 34, color: 0x21262d, textColor: '#8b949e', fontSize: '11px' });

    if (!this.won) {
      this.add.text(W / 2, H - 140, 'Tip: Complete education modules to unlock powerful cards!', {
        fontSize: '10px', fontFamily: 'monospace', color: '#484f58'
      }).setOrigin(0.5);
    }
  }
}
