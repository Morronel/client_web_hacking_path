/* ============================================
   Game — Boss Scene (3-Phase Boss Fight)
   Uses BattleScene for combat, manages phases.
   ============================================ */

class BossScene extends Phaser.Scene {
  constructor() {
    super('Boss');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d1117');
    const W = this.scale.width;
    const H = this.scale.height;
    const boss = Game.Encounters.BOSS;

    this.currentPhase = 0;
    this.bossName = boss.name;
    this.phases = boss.phases;

    // Boss title
    this.add.text(W / 2, 20, '⚡ ' + this.bossName + ' ⚡', {
      fontSize: '20px', fontFamily: 'monospace', color: '#8b5cf6', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Phase indicator / health bar
    this.phaseIndicators = [];
    for (let i = 0; i < 3; i++) {
      const x = W / 2 - 80 + i * 80;
      const g = this.add.graphics();
      g.fillStyle(i === 0 ? 0xf85149 : 0x30363d, 1);
      g.fillRoundedRect(x - 30, 42, 60, 12, 3);
      g.lineStyle(1, 0x8b5cf6, 1);
      g.strokeRoundedRect(x - 30, 42, 60, 12, 3);
      this.phaseIndicators.push(g);

      this.add.text(x, 68, `Phase ${i + 1}`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#8b949e'
      }).setOrigin(0.5);
    }

    // Show dialogue and start first phase
    this.showDialogue(this.phases[0].dialogueStart, () => {
      this.startPhase(0);
    });
  }

  showDialogue(text, callback) {
    const W = this.scale.width;
    const H = this.scale.height;

    const bg = this.add.graphics();
    bg.fillStyle(0x161b22, 0.95);
    bg.fillRoundedRect(W / 2 - 250, H / 2 - 50, 500, 100, 8);
    bg.lineStyle(2, 0x8b5cf6, 1);
    bg.strokeRoundedRect(W / 2 - 250, H / 2 - 50, 500, 100, 8);

    const txt = this.add.text(W / 2, H / 2 - 10, `"${text}"`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#d29922',
      wordWrap: { width: 460 }, align: 'center', fontStyle: 'italic'
    }).setOrigin(0.5);

    const nameLabel = this.add.text(W / 2, H / 2 + 25, '— ' + this.bossName, {
      fontSize: '10px', fontFamily: 'monospace', color: '#8b5cf6'
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      bg.destroy();
      txt.destroy();
      nameLabel.destroy();
      if (callback) callback();
    });
  }

  startPhase(phaseIndex) {
    this.currentPhase = phaseIndex;
    const phase = this.phases[phaseIndex];

    // Update phase indicators
    this.phaseIndicators.forEach((g, i) => {
      g.clear();
      g.fillStyle(i <= phaseIndex ? 0x30363d : (i === phaseIndex + 1 ? 0xf85149 : 0x30363d), 1);
      if (i > phaseIndex) {
        g.fillStyle(0xf85149, 1);
      } else {
        g.fillStyle(0x30363d, 0.5);
      }
      const x = this.scale.width / 2 - 80 + i * 80;
      g.fillRoundedRect(x - 30, 42, 60, 12, 3);
      g.lineStyle(1, 0x8b5cf6, 1);
      g.strokeRoundedRect(x - 30, 42, 60, 12, 3);
    });

    // Launch battle scene with phase encounter
    const encounter = {
      name: `${this.bossName} — ${phase.name}`,
      strategy: phase.strategy,
      cardPool: phase.cardPool,
      cardsPerTurn: phase.cardsPerTurn,
      startDelay: 0
    };

    this.scene.launch('Battle', {
      encounter,
      isElite: true,
      threshold: phase.threshold,
      onWin: () => this.onPhaseCleared(),
      onLose: () => this.onBossLoss()
    });

    this.scene.bringToTop('Boss');
    this.scene.sendToBack('Battle');

    // Make boss scene transparent overlay (only header visible)
    // Actually, let Battle scene handle everything, Boss just manages phases
    this.scene.setVisible(false, 'Boss');
    this.scene.setActive(false, 'Boss');
  }

  onPhaseCleared() {
    this.scene.stop('Battle');
    this.scene.setVisible(true, 'Boss');
    this.scene.setActive(true, 'Boss');

    const phase = this.phases[this.currentPhase];

    if (this.currentPhase < this.phases.length - 1) {
      // Show phase clear dialogue then start next
      this.showDialogue(phase.dialogueEnd, () => {
        this.time.delayedCall(500, () => {
          this.startPhase(this.currentPhase + 1);
        });
      });
    } else {
      // Boss defeated!
      this.showDialogue(phase.dialogueEnd, () => {
        this.time.delayedCall(1000, () => {
          const runState = Game.RunState.getState();
          if (runState) runState.wins++;
          Game.SaveManager.clearSave();
          this.scene.stop('Battle');
          this.scene.start('GameOver', { won: true });
        });
      });
    }
  }

  onBossLoss() {
    this.scene.stop('Battle');
    Game.SaveManager.clearSave();
    this.scene.start('GameOver', { won: false });
  }
}
