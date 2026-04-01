/* ============================================
   Game — Save/Load Manager
   ============================================ */

window.Game = window.Game || {};

Game.SaveManager = (() => {
  const SAVE_KEY = 'webhack_game_save';

  function save() {
    try {
      const state = Game.RunState.getState();
      if (!state) return;
      const data = {
        version: 1,
        timestamp: Date.now(),
        run: state
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // localStorage unavailable
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== 1) return null;
      Game.RunState.setState(data.run);
      return data.run;
    } catch {
      return null;
    }
  }

  function hasSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return data && data.version === 1 && data.run;
    } catch {
      return false;
    }
  }

  function clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // silently fail
    }
  }

  return { save, load, hasSave, clearSave };
})();
