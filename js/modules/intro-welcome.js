window.introWelcome = (() => {
  let listeners = [];

  function init(container) {
    // Welcome module has no interactive labs — just theory content
    QuizEngine.init(container, 'intro-welcome', { questions: [] });
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
    QuizEngine.cleanup('intro-welcome');
  }

  return { init, cleanup };
})();
