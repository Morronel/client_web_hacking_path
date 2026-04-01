/* ============================================
   Game — Battle Scene (Core Card Combat)
   ============================================ */

class BattleScene extends Phaser.Scene {
  constructor() {
    super('Battle');
  }

  init(data) {
    this.encounter = data.encounter;
    this.isElite = data.isElite || false;
    this.isBoss = false;
    this.winThreshold = data.threshold || 5;
    this.onWin = data.onWin || null;
    this.onLose = data.onLose || null;

    this.playerSlots = [null, null, null, null];
    this.enemySlots = [null, null, null, null];
    this.playerSlotCards = [null, null, null, null];
    this.enemySlotCards = [null, null, null, null];
    this.hand = [];
    this.handContainers = [];
    this.drawPile = [];
    this.damageScale = 0;
    this.dataPoints = 2;
    this.maxDataPoints = 2;
    this.turnNumber = 0;
    this.phase = 'PLAYER_PLAY';
    this.animating = false;
    this.selectedCard = null;
    this.isTouchDevice = false;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d1117');
    this.W = this.scale.width;
    this.H = this.scale.height;
    const W = this.W;
    const H = this.H;

    // Title
    this.add.text(W / 2, 18, this.encounter.name, {
      fontSize: '16px', fontFamily: 'monospace', color: '#d29922', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Slot grid
    this.slots = Game.UI.createSlotGrid(this, W / 2, 190, 120);

    // Scale display
    this.scaleDisplay = Game.UI.createScale(this, W / 2, 80);
    this.scaleDisplay.update(0, this.winThreshold);

    // Data points
    this.dpDisplay = Game.UI.createDataPointsDisplay(this, 80, H - 40);
    this.dpDisplay.update(this.dataPoints, this.maxDataPoints);

    // Deck counter
    this.deckCounter = Game.UI.createDeckCounter(this, W - 60, H - 40);

    // End turn button
    this.endTurnBtn = Game.UI.createButton(this, W - 100, 400, 'END TURN', () => {
      if (this.phase === 'PLAYER_PLAY' && !this.animating) {
        this.endPlayerTurn();
      }
    }, { width: 130, height: 36 });

    // Detect touch device
    this.isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    // Setup drag (desktop only — touch uses tap-to-select)
    if (!this.isTouchDevice) {
      this.input.on('drag', (pointer, obj, dragX, dragY) => {
        obj.x = dragX;
        obj.y = dragY;
      });

      this.input.on('drop', (pointer, obj, zone) => {
        if (this.phase !== 'PLAYER_PLAY' || this.animating) return;
        this.handleCardDrop(obj, zone);
      });

      this.input.on('dragend', (pointer, obj, dropped) => {
        if (!dropped) {
          Game.UI.layoutHand(this, this.handContainers, this.W / 2, this.H - 100);
        }
      });
    }

    // Setup tap-to-place on player slot zones (works on both touch and mouse)
    for (let i = 0; i < 4; i++) {
      const slot = this.slots.player[i];
      slot.zone.setInteractive({ useHandCursor: true });
      slot.zone.on('pointerdown', () => {
        if (this.phase !== 'PLAYER_PLAY' || this.animating) return;
        if (this.selectedCard) {
          this.handleCardDrop(this.selectedCard, slot.zone);
          this.clearSelection();
        }
      });
    }

    // Initialize draw pile from deck
    const runState = Game.RunState.getState();
    this.drawPile = this.shuffleArray([...runState.deck]);

    // Draw initial hand
    for (let i = 0; i < 4 && this.drawPile.length > 0; i++) {
      this.drawCard();
    }
    this.deckCounter.update(this.drawPile.length);

    // Start first turn
    this.turnNumber = 1;
    this.startPlayerTurn();
  }

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  drawCard() {
    if (this.drawPile.length === 0) return;
    const cardId = this.drawPile.pop();
    const instance = Game.Cards.createInstance(cardId);
    this.hand.push(instance);

    const container = Game.CardRenderer.createCard(this, instance, 0, this.H + 80);
    container.setInteractive({ useHandCursor: true, draggable: !this.isTouchDevice });
    if (!this.isTouchDevice) {
      this.input.setDraggable(container);
    }
    container.cardInstance = instance;
    this.handContainers.push(container);

    // Tap-to-select handler (works on both touch and mouse)
    container.on('pointerdown', () => {
      if (this.phase !== 'PLAYER_PLAY' || this.animating) return;
      if (this.selectedCard === container) {
        this.clearSelection();
      } else {
        this.clearSelection();
        this.selectedCard = container;
        Game.UI.highlightCard(this, container);
      }
    });

    Game.UI.layoutHand(this, this.handContainers, this.W / 2, this.H - 100);
    this.deckCounter.update(this.drawPile.length);
  }

  clearSelection() {
    if (this.selectedCard) {
      Game.UI.unhighlightCard(this, this.selectedCard);
      this.selectedCard = null;
    }
  }

  handleCardDrop(cardContainer, zone) {
    if (zone.side !== 'player') return;
    const lane = zone.laneIndex;
    if (this.playerSlots[lane]) return; // slot occupied

    const card = cardContainer.cardInstance;
    if (card.cost > this.dataPoints) {
      Game.UI.showFloatingText(this, cardContainer.x, cardContainer.y - 40, 'Not enough DP!', '#f85149');
      Game.UI.layoutHand(this, this.handContainers, this.W / 2, this.H - 100);
      return;
    }

    // Place card
    this.dataPoints -= card.cost;
    this.dpDisplay.update(this.dataPoints, this.maxDataPoints);

    // Remove from hand
    const hIdx = this.hand.indexOf(card);
    if (hIdx >= 0) this.hand.splice(hIdx, 1);
    const cIdx = this.handContainers.indexOf(cardContainer);
    if (cIdx >= 0) this.handContainers.splice(cIdx, 1);

    // Disable drag
    this.input.setDraggable(cardContainer, false);
    cardContainer.disableInteractive();

    // Move to slot
    const slot = this.slots.player[lane];
    this.playerSlots[lane] = card;
    this.playerSlotCards[lane] = cardContainer;

    this.tweens.add({
      targets: cardContainer,
      x: slot.x, y: slot.y,
      duration: 200, ease: 'Power2'
    });

    // Re-layout remaining hand
    Game.UI.layoutHand(this, this.handContainers, this.W / 2, this.H - 100);

    // Execute on-play sigils
    this.resolveOnPlaySigil(card, lane, 'player');
  }

  resolveOnPlaySigil(card, lane, side) {
    if (!card.sigil) return;

    switch (card.sigil) {
      case 'draw':
        this.drawCard();
        break;
      case 'rce':
        this.damageScale += 2;
        this.scaleDisplay.update(this.damageScale, this.winThreshold);
        Game.UI.showFloatingText(this, this.W / 2, 80, '+2 Direct!', '#3fb950');
        break;
      case 'drops_table': {
        const occupied = [];
        for (let i = 0; i < 4; i++) {
          if (this.enemySlots[i]) occupied.push(i);
        }
        if (occupied.length > 0) {
          const target = occupied[Math.floor(Math.random() * occupied.length)];
          this.destroyCardInSlot(target, 'enemy');
          Game.UI.showFloatingText(this, this.slots.enemy[target].x, this.slots.enemy[target].y, 'DROP TABLE!', '#f85149');
        }
        break;
      }
      case 'flood':
        for (let i = 0; i < 4; i++) {
          if (!this.playerSlots[i] && i !== lane) {
            this.placeTokenInSlot('ddos_token', i, 'player');
          }
        }
        break;
      case 'spread': {
        const adjacent = [lane - 1, lane + 1].filter(l => l >= 0 && l < 4 && !this.playerSlots[l]);
        if (adjacent.length > 0) {
          const target = adjacent[Math.floor(Math.random() * adjacent.length)];
          this.placeTokenInSlot('xss_token', target, 'player');
        }
        break;
      }
      case 'hijack': {
        if (this.enemySlots[lane]) {
          const stolen = this.enemySlots[lane];
          this.destroyCardInSlot(lane, 'enemy');
          // If player slot available elsewhere, skip (card already in this lane)
          // The hijack replaces enemy card
          stolen.currentAttack = stolen.attack;
          stolen.currentHealth = stolen.health;
          this.placeCardInSlot(stolen, lane, 'player');
        }
        break;
      }
      case 'enumerate':
        Game.UI.showFloatingText(this, this.W / 2, 150, 'Enemy cards revealed!', '#58a6ff');
        break;
    }
  }

  placeTokenInSlot(tokenId, lane, side) {
    const instance = Game.Cards.createInstance(tokenId);
    const slots = side === 'player' ? this.slots.player : this.slots.enemy;
    const slotArr = side === 'player' ? this.playerSlots : this.enemySlots;
    const cardArr = side === 'player' ? this.playerSlotCards : this.enemySlotCards;

    slotArr[lane] = instance;
    const container = Game.CardRenderer.createCard(this, instance, slots[lane].x, slots[lane].y, { small: true });
    cardArr[lane] = container;
  }

  placeCardInSlot(instance, lane, side) {
    const slots = side === 'player' ? this.slots.player : this.slots.enemy;
    const slotArr = side === 'player' ? this.playerSlots : this.enemySlots;
    const cardArr = side === 'player' ? this.playerSlotCards : this.enemySlotCards;

    slotArr[lane] = instance;
    const container = Game.CardRenderer.createCard(this, instance, slots[lane].x, side === 'enemy' ? -80 : this.H + 80, { small: true });
    cardArr[lane] = container;

    this.tweens.add({
      targets: container,
      y: slots[lane].y,
      duration: 300, ease: 'Power2'
    });
  }

  destroyCardInSlot(lane, side) {
    const slotArr = side === 'player' ? this.playerSlots : this.enemySlots;
    const cardArr = side === 'player' ? this.playerSlotCards : this.enemySlotCards;

    slotArr[lane] = null;
    if (cardArr[lane]) {
      Game.CardRenderer.animateDeath(this, cardArr[lane]);
      cardArr[lane] = null;
    }
  }

  startPlayerTurn() {
    this.phase = 'PLAYER_PLAY';
    this.dataPoints = this.maxDataPoints;
    this.dpDisplay.update(this.dataPoints, this.maxDataPoints);

    if (this.turnNumber > 1) {
      this.drawCard();
    }
  }

  async endPlayerTurn() {
    this.phase = 'PLAYER_ATTACK';
    this.animating = true;

    // Player attack phase
    await this.resolveAttacks('player');

    // Per-turn sigils
    this.resolvePerTurnSigils('player');

    if (this.checkWin()) return;

    // Enemy play phase
    this.phase = 'ENEMY_PLAY';
    const decisions = Game.AI.takeTurn(
      { playerSlots: this.playerSlots, enemySlots: this.enemySlots },
      this.encounter,
      this.turnNumber
    );

    for (const decision of decisions) {
      const instance = Game.Cards.createInstance(decision.cardId);
      this.placeCardInSlot(instance, decision.lane, 'enemy');
      await this.delay(300);
    }

    // Enemy attack phase
    this.phase = 'ENEMY_ATTACK';
    await this.delay(400);
    await this.resolveAttacks('enemy');
    this.resolvePerTurnSigils('enemy');

    if (this.checkWin()) return;

    // Next turn
    this.turnNumber++;
    const runState = Game.RunState.getState();
    if (runState) runState.turnsPlayed++;
    this.animating = false;
    this.startPlayerTurn();
  }

  resolveAttacks(side) {
    return new Promise(resolve => {
      const slotArr = side === 'player' ? this.playerSlots : this.enemySlots;
      const oppArr = side === 'player' ? this.enemySlots : this.playerSlots;
      const cardArr = side === 'player' ? this.playerSlotCards : this.enemySlotCards;
      const oppCardArr = side === 'player' ? this.enemySlotCards : this.playerSlotCards;
      const oppSlots = side === 'player' ? this.slots.enemy : this.slots.player;
      const direction = side === 'player' ? 1 : -1;

      let lane = 0;
      const attackNext = () => {
        if (lane >= 4) { resolve(); return; }
        const card = slotArr[lane];
        if (!card || card.currentAttack <= 0) { lane++; attackNext(); return; }

        const strikes = card.sigil === 'double_strike' ? 2 : 1;
        let strike = 0;

        const doStrike = () => {
          if (strike >= strikes) { lane++; attackNext(); return; }

          const target = oppArr[lane];
          const attackerContainer = cardArr[lane];
          const targetSlot = oppSlots[lane];

          if (attackerContainer) {
            Game.CardRenderer.animateAttack(this, attackerContainer, targetSlot.x, targetSlot.y, () => {
              if (target) {
                let damage = card.currentAttack;
                if (target.sigil === 'shield') damage = Math.max(0, damage - 1);
                target.currentHealth -= damage;
                if (card.sigil === 'deathtouch' && damage > 0) target.currentHealth = 0;

                if (oppCardArr[lane]) {
                  Game.CardRenderer.animateDamage(this, oppCardArr[lane], damage);
                }

                if (target.currentHealth <= 0) {
                  this.destroyCardInSlot(lane, side === 'player' ? 'enemy' : 'player');
                } else {
                  this.refreshSlotCard(lane, side === 'player' ? 'enemy' : 'player');
                }
              } else {
                // Direct damage
                this.damageScale += card.currentAttack * direction;
                this.scaleDisplay.update(this.damageScale, this.winThreshold);
                Game.UI.showFloatingText(this, targetSlot.x, targetSlot.y,
                  (direction > 0 ? '+' : '') + (card.currentAttack * direction), direction > 0 ? '#3fb950' : '#f85149');
              }

              strike++;
              this.time.delayedCall(200, doStrike);
            });
          } else {
            strike++;
            doStrike();
          }
        };

        doStrike();
      };

      attackNext();
    });
  }

  resolvePerTurnSigils(side) {
    const slotArr = side === 'player' ? this.playerSlots : this.enemySlots;
    for (let i = 0; i < 4; i++) {
      const card = slotArr[i];
      if (!card) continue;

      if (card.sigil === 'escalate') {
        card.currentAttack++;
        card.currentHealth++;
        this.refreshSlotCard(i, side);
      }
      if (card.sigil === 'encodes' && side === 'player') {
        const opp = this.enemySlots[i];
        if (opp && opp.currentAttack > 0) {
          opp.currentAttack--;
          this.refreshSlotCard(i, 'enemy');
        }
      }
    }
  }

  refreshSlotCard(lane, side) {
    const slotArr = side === 'player' ? this.playerSlots : this.enemySlots;
    const cardArr = side === 'player' ? this.playerSlotCards : this.enemySlotCards;
    const slotsUI = side === 'player' ? this.slots.player : this.slots.enemy;
    const card = slotArr[lane];
    if (!card) return;

    if (cardArr[lane]) cardArr[lane].destroy();
    cardArr[lane] = Game.CardRenderer.createCard(this, card, slotsUI[lane].x, slotsUI[lane].y, { small: true });
  }

  checkWin() {
    if (this.damageScale >= this.winThreshold) {
      this.animating = false;
      this.time.delayedCall(500, () => this.onBattleEnd(true));
      return true;
    }
    if (this.damageScale <= -this.winThreshold) {
      this.animating = false;
      this.time.delayedCall(500, () => this.onBattleEnd(false));
      return true;
    }
    return false;
  }

  onBattleEnd(playerWon) {
    if (this.onWin && playerWon) {
      this.onWin();
      return;
    }
    if (this.onLose && !playerWon) {
      this.onLose();
      return;
    }

    if (playerWon) {
      const runState = Game.RunState.getState();
      if (runState) runState.wins++;
      Game.SaveManager.save();
      this.scene.start('Reward', { isElite: this.isElite });
    } else {
      Game.SaveManager.clearSave();
      this.scene.start('GameOver', { won: false });
    }
  }

  delay(ms) {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }
}
