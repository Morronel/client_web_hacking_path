/* ============================================
   Game — Phaser Config & Bootstrap
   ============================================ */

window.Game = window.Game || {};

Game.instance = null;

Game.boot = function (containerId) {
  if (Game.instance) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  const config = {
    type: Phaser.AUTO,
    parent: containerId,
    width: 960,
    height: 600,
    backgroundColor: '#0d1117',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MapScene, BattleScene, RewardScene, BossScene, GameOverScene],
    banner: false,
    audio: {
      noAudio: true
    },
    input: {
      activePointers: 2
    }
  };

  Game.instance = new Phaser.Game(config);
};

Game.destroy = function () {
  if (Game.instance) {
    Game.instance.destroy(true);
    Game.instance = null;
    // Clear the container
    const container = document.getElementById('game-container');
    if (container) container.innerHTML = '';
  }
};
