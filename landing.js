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
  const time=document.querySelector('.motion-time');
  let paused=preference.matches, seconds=.8, previous=null, request=0, manuallySet=false,
    scrubbing=false,lastProgress=-1,lastSecond=-1;
  function render(force=false) {
    draw(seconds);
    const progress=Math.floor(seconds*10),whole=Math.floor(seconds);
    if(force || progress!==lastProgress) {
      seek.value=seconds;
      seek.style.setProperty('--progress',`${seconds/duration*100}%`);
      lastProgress=progress;
    }
    if(force || whole!==lastSecond) {
      seek.setAttribute('aria-valuetext',`${whole} of ${duration} seconds`);
      if(time) time.textContent=`0:${String(whole).padStart(2,'0')} / 0:${duration}`;
      lastSecond=whole;
    }
  }
  function tick(now) {
    if(paused || scrubbing || document.hidden) { request=0; previous=null; return; }
    if(previous!==null) seconds=(seconds+Math.min((now-previous)/1000,.15))%duration;
    previous=now;
    // Scene.mount holds the ink drawings while moving the camera continuously.
    render();
    request=requestAnimationFrame(tick);
  }
  function update() {
    cancelAnimationFrame(request); request=0; previous=null;
    button.classList.toggle('is-paused',paused);
    button.setAttribute('aria-label',paused?'Play animation':'Pause animation');
    label.textContent=paused?'Play':'Pause';
    if(!paused && !scrubbing && !document.hidden) request=requestAnimationFrame(tick);
  }
  button.addEventListener('click',()=>{manuallySet=true;paused=!paused;update();});
  seek.addEventListener('pointerdown',()=>{scrubbing=true;update();});
  seek.addEventListener('input',()=>{
    seconds=Math.max(0,Math.min(duration,Number(seek.value)||0));
    previous=null;render(true);
  });
  function finishScrub() { if(scrubbing) {scrubbing=false;update();} }
  window.addEventListener('pointerup',finishScrub);
  window.addEventListener('pointercancel',finishScrub);
  window.addEventListener('blur',finishScrub);
  seek.addEventListener('change',finishScrub);
  preference.addEventListener('change',event=>{if(event.matches || !manuallySet) {paused=event.matches;update();}});
  document.addEventListener('visibilitychange',()=>{scrubbing=false;update();});
  render(); update();
  button.hidden=false; seek.hidden=false; if(time) time.hidden=false;
})();
