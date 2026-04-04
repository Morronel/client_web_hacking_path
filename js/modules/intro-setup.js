window.introSetup = (() => {
  let listeners = [];

  function init(container) {
    // Setup module has no interactive labs — just instructions
  }

  function cleanup() {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    listeners = [];
  }

  return { init, cleanup };
})();
