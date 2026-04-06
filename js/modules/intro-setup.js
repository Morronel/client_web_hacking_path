window.introSetup = (() => {
  let listeners = [];

  function init(container) {
    // Setup module has no interactive labs — just instructions
    QuizEngine.init(container, 'intro-setup', { questions: [] });
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
    QuizEngine.cleanup('intro-setup');
  }

  return { init, cleanup };
})();
