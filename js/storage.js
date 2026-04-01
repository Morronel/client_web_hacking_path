/* ============================================
   localStorage Wrapper — Progress Tracking
   ============================================ */

const Storage = (() => {
  const PROGRESS_KEY = 'webhack_progress';

  function _read() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function _write(data) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    } catch {
      // localStorage unavailable or full — silently fail
    }
  }

  function setLabCompleted(moduleId, labId) {
    const data = _read();
    if (!data[moduleId]) data[moduleId] = {};
    data[moduleId][labId] = true;
    _write(data);
  }

  function isLabCompleted(moduleId, labId) {
    const data = _read();
    return !!(data[moduleId] && data[moduleId][labId]);
  }

  function getModuleProgress(moduleId) {
    const data = _read();
    if (!data[moduleId]) return { completed: 0, labs: {} };
    const labs = data[moduleId];
    return { completed: Object.keys(labs).length, labs };
  }

  function getAllProgress() {
    return _read();
  }

  function getModuleStatus(moduleId, totalLabs) {
    const progress = getModuleProgress(moduleId);
    if (progress.completed === 0) return 'none';
    if (progress.completed >= totalLabs) return 'completed';
    return 'partial';
  }

  function resetProgress() {
    try {
      localStorage.removeItem(PROGRESS_KEY);
    } catch {
      // silently fail
    }
  }

  return {
    setLabCompleted,
    isLabCompleted,
    getModuleProgress,
    getAllProgress,
    getModuleStatus,
    resetProgress
  };
})();
