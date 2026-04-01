/* ============================================
   Game — Enemy AI Decision Logic
   ============================================ */

window.Game = window.Game || {};

Game.AI = (() => {

  function takeTurn(battleState, encounter, turnNumber) {
    const { enemySlots, playerSlots } = battleState;
    const budget = encounter.cardsPerTurn || 1;
    const pool = encounter.cardPool;
    const strategy = encounter.strategy;

    // Don't play on first turn if encounter has startDelay
    if (encounter.startDelay && turnNumber <= encounter.startDelay) {
      return [];
    }

    const emptyLanes = [];
    for (let i = 0; i < 4; i++) {
      if (!enemySlots[i]) emptyLanes.push(i);
    }

    if (emptyLanes.length === 0 || pool.length === 0) return [];

    const decisions = [];
    const usedLanes = new Set();

    for (let p = 0; p < Math.min(budget, emptyLanes.length); p++) {
      const available = emptyLanes.filter(l => !usedLanes.has(l));
      if (available.length === 0) break;

      let targetLane;
      let cardId;

      if (strategy === 'defensive') {
        targetLane = pickDefensiveLane(available, playerSlots);
        cardId = pickHighestHealth(pool, turnNumber);
      } else if (strategy === 'aggressive') {
        targetLane = pickAggressiveLane(available, playerSlots);
        cardId = pickHighestAttack(pool, turnNumber);
      } else {
        // Balanced: alternate
        if (turnNumber % 2 === 0) {
          targetLane = pickDefensiveLane(available, playerSlots);
          cardId = pickHighestHealth(pool, turnNumber);
        } else {
          targetLane = pickAggressiveLane(available, playerSlots);
          cardId = pickHighestAttack(pool, turnNumber);
        }
      }

      decisions.push({ cardId, lane: targetLane });
      usedLanes.add(targetLane);
    }

    return decisions;
  }

  function pickDefensiveLane(available, playerSlots) {
    // Find lane where player has the strongest card
    let bestLane = available[0];
    let bestAtk = -1;
    for (const lane of available) {
      const pCard = playerSlots[lane];
      if (pCard && pCard.currentAttack > bestAtk) {
        bestAtk = pCard.currentAttack;
        bestLane = lane;
      }
    }
    return bestLane;
  }

  function pickAggressiveLane(available, playerSlots) {
    // Prefer empty lanes (for direct damage)
    for (const lane of available) {
      if (!playerSlots[lane]) return lane;
    }
    // Otherwise pick lane with weakest player card
    let bestLane = available[0];
    let weakest = Infinity;
    for (const lane of available) {
      const pCard = playerSlots[lane];
      if (pCard && pCard.currentHealth < weakest) {
        weakest = pCard.currentHealth;
        bestLane = lane;
      }
    }
    return bestLane;
  }

  function pickHighestHealth(pool, turnNumber) {
    // Later turns pick stronger cards
    const weighted = pool.map(id => {
      const card = Game.Cards.getCard(id);
      return { id, score: card ? card.health + (turnNumber > 4 ? card.attack : 0) : 0 };
    });
    weighted.sort((a, b) => b.score - a.score);
    // Some randomness
    const topN = Math.min(3, weighted.length);
    return weighted[Math.floor(Math.random() * topN)].id;
  }

  function pickHighestAttack(pool, turnNumber) {
    const weighted = pool.map(id => {
      const card = Game.Cards.getCard(id);
      return { id, score: card ? card.attack + (turnNumber > 4 ? card.health : 0) : 0 };
    });
    weighted.sort((a, b) => b.score - a.score);
    const topN = Math.min(3, weighted.length);
    return weighted[Math.floor(Math.random() * topN)].id;
  }

  return { takeTurn };
})();
