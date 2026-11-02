(() => {
  'use strict';
  const art=document.querySelector('.sisyphus-art');
  const button=document.querySelector('.motion-toggle');
  const seek=document.querySelector('.motion-progress');
  if(!art || !button || !seek || !window.SisyphusScene) return;
  const draw=window.SisyphusScene.mount(art);
  const duration=window.SisyphusScene.DURATION;
  seek.max=duration;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const label=button.querySelector('.motion-label');
  let paused=preference.matches, seconds=.8, previous=null, lastFrame=-1, request=0, manuallySet=false;
  function render() {
    draw(seconds);
    seek.value=seconds;
    seek.setAttribute('aria-valuetext',`${Math.round(seconds)} of ${duration} seconds`);
  }
  function tick(now) {
    if(paused || document.hidden) { request=0; previous=null; return; }
    if(previous!==null) seconds=(seconds+Math.min((now-previous)/1000,.15))%duration;
    previous=now;
    // Eighteen drawings per second give the movement a deliberately drawn cadence.
    const frame=Math.floor(seconds*18);
    if(frame!==lastFrame) { render(); lastFrame=frame; }
    request=requestAnimationFrame(tick);
  }
  function update() {
    cancelAnimationFrame(request); request=0; previous=null;
    button.classList.toggle('is-paused',paused);
    button.setAttribute('aria-label',paused?'Play animation':'Pause animation');
    label.textContent=paused?'Play':'Pause';
    if(!paused && !document.hidden) request=requestAnimationFrame(tick);
  }
  button.addEventListener('click',()=>{manuallySet=true;paused=!paused;update();});
  seek.addEventListener('input',()=>{
    seconds=Number(seek.value); previous=null; lastFrame=-1; render();
  });
  preference.addEventListener('change',event=>{if(event.matches || !manuallySet) {paused=event.matches;update();}});
  document.addEventListener('visibilitychange',update);
  render(); update();
  button.hidden=false; seek.hidden=false;
})();
