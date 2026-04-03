window.introWelcome = (() => {
  let listeners = [];

  function init(container) {
    // Welcome module has no interactive labs — just theory content
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
  }

  return { init, cleanup };
})();
