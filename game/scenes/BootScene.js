/* ============================================
   Game — Boot Scene (Title Screen)
   ============================================ */

class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d1117');
    const W = this.scale.width;
    const H = this.scale.height;

    // Title art (ASCII-style)
    const titleLines = [
      '╔══════════════════════════════╗',
      '║     SHADOW  TERMINAL         ║',
      '║   A Hacker\'s Card Game       ║',
      '╚══════════════════════════════╝'
    ];
    this.add.text(W / 2, 100, titleLines.join('\n'), {
      fontSize: '16px', fontFamily: 'monospace', color: '#3fb950', align: 'center'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(W / 2, 190, 'Build your deck. Breach the firewall.', {
      fontSize: '13px', fontFamily: 'monospace', color: '#8b949e'
    }).setOrigin(0.5);

    // Show unlocked module cards
    const unlocked = Game.RunState.detectUnlockedModules();
    if (unlocked.length > 0) {
      this.add.text(W / 2, 225, `Module Cards Unlocked: ${unlocked.length}/8`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#d29922'
      }).setOrigin(0.5);

      // Show small card previews
      const startX = W / 2 - (unlocked.length - 1) * 35;
      unlocked.forEach((modId, i) => {
        const card = Game.Cards.MODULE_CARDS[modId];
        if (card) {
          this.add.text(startX + i * 70, 250, card.name, {
            fontSize: '8px', fontFamily: 'monospace', color: '#f85149'
          }).setOrigin(0.5);
        }
      });
    } else {
      this.add.text(W / 2, 225, 'Complete education modules to unlock powerful cards!', {
        fontSize: '10px', fontFamily: 'monospace', color: '#484f58'
      }).setOrigin(0.5);
    }

    // New Run button
    Game.UI.createButton(this, W / 2, 320, 'NEW RUN', () => {
      Game.SaveManager.clearSave();
      Game.RunState.newRun();
      Game.SaveManager.save();
      this.scene.start('Map');
    }, { width: 180, height: 44, fontSize: '16px' });

    // Continue button (if save exists)
    if (Game.SaveManager.hasSave()) {
      Game.UI.createButton(this, W / 2, 380, 'CONTINUE', () => {
        Game.SaveManager.load();
        this.scene.start('Map');
      }, { width: 180, height: 44, color: 0x21262d, textColor: '#e6edf3', fontSize: '16px' });
    }

    // Back to Academy
    Game.UI.createButton(this, W / 2, H - 50, '← BACK TO ACADEMY', () => {
      if (window.Game && window.Game.destroy) {
        window.Game.destroy();
      }
      location.hash = '#m1';
    }, { width: 220, height: 34, color: 0x21262d, textColor: '#8b949e', fontSize: '11px' });

    // Version/info
    this.add.text(W / 2, H - 15, 'Inspired by Inscryption  •  Complete modules for powerful cards', {
      fontSize: '9px', fontFamily: 'monospace', color: '#484f58'
    }).setOrigin(0.5);
  }
}
