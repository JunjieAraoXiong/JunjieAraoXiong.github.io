(() => {
  'use strict';

  const art = document.querySelector('.sisyphus-art');
  const button = document.querySelector('.motion-toggle');
  if (!art || !button) return;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const label = button.querySelector('.motion-label');
  let paused = preference.matches;
  let started = false;

  function update() {
    // Stop rendering while the tab is hidden, preserving the current frame.
    const still = paused || document.hidden;
    if (!started && !still) {
      art.querySelectorAll('animate, animateTransform').forEach(animation => animation.beginElement());
      started = true;
    }
    if (still) art.pauseAnimations();
    else art.unpauseAnimations();
    art.classList.toggle('is-paused', still);
    art.classList.toggle('is-playing', !paused);
    button.classList.toggle('is-paused', paused);
    button.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
    label.textContent = paused ? 'Play' : 'Pause';
  }

  button.addEventListener('click', () => {
    paused = !paused;
    update();
  });
  preference.addEventListener('change', event => {
    paused = event.matches;
    update();
  });
  document.addEventListener('visibilitychange', update);
  update();
  button.hidden = false;
})();
