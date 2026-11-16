// Click the profile photo to set it loose like a bouncing DVD logo.
// Words part around it as it passes and drift back once it has gone.
// Click it again (or press Escape) and it flies home.
(() => {
  'use strict';
  const photo = document.querySelector('.intro-photo img');
  const page = document.querySelector('.page');
  if (!photo || !page) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const SPEED = 190;    // px per second along each axis
  const REACH = 78;     // px around the photo where words start to move
  const PUSH = 52;      // px: the furthest a word is pushed
  // Each word rides a damped spring (like react-spring's "wobbly"): it is shoved,
  // overshoots a little, wobbles and settles. Lower DAMPING = bouncier.
  const STIFFNESS = 180;
  const DAMPING = 11;

  let flyer = null, words = [], raf = 0, last = 0, state = 'home';
  let x = 0, y = 0, vx = SPEED, vy = SPEED * 0.82, w = 0, h = 0, tilt = 0;

  photo.style.cursor = 'pointer';
  photo.title = 'Click me';

  // Wrap each word in the page so it can move independently.
  function wrapWords() {
    const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT, {
      // Skip flex/grid parents (the header, nav, booking button): wrapping their
      // text would collapse the spaces between words.
      acceptNode: n => {
        const parent = n.parentElement;
        if (!n.nodeValue.trim() || parent.closest('script, style, svg, .topbar, .site-footer, .booking')) return NodeFilter.FILTER_REJECT;
        const display = getComputedStyle(parent).display;
        return /flex|grid/.test(display) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const frag = document.createDocumentFragment();
      for (const part of node.nodeValue.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
        const span = document.createElement('span');
        span.className = 'bw';
        span.textContent = part;
        frag.appendChild(span);
      }
      node.parentNode.replaceChild(frag, node);
    }
    measure();
  }
  function measure() {
    words = Array.from(page.querySelectorAll('.bw'), el => {
      el.style.transform = '';
      const r = el.getBoundingClientRect();
      // Slightly different mass per word so neighbours don't move in lockstep.
      const mass = 0.85 + ((el.textContent.length * 7 + words.length) % 9) / 20;
      return { el, cx: r.left + r.width / 2 + scrollX, cy: r.top + r.height / 2 + scrollY, ox: 0, oy: 0, vx: 0, vy: 0, mass };
    });
  }
  function unwrapWords() {
    for (const span of page.querySelectorAll('.bw')) span.replaceWith(span.textContent);
    page.normalize();
    words = [];
  }

  function release() {
    if (reduced.matches || state !== 'home') return;
    const r = photo.getBoundingClientRect();
    const scale = Math.min(1, (innerWidth < 600 ? 120 : 190) / r.width);
    w = r.width * scale; h = r.height * scale;
    x = r.left; y = r.top;
    wrapWords();
    flyer = photo.cloneNode();
    flyer.removeAttribute('fetchpriority');
    flyer.className = 'bounce-flyer';
    flyer.alt = '';
    flyer.title = 'Click to send me home';
    Object.assign(flyer.style, { width: r.width + 'px', height: r.height + 'px', transform: `translate(${x}px, ${y}px)` });
    document.body.appendChild(flyer);
    photo.style.visibility = 'hidden';
    requestAnimationFrame(() => {
      flyer.style.transition = 'width .5s ease, height .5s ease';
      flyer.style.width = w + 'px'; flyer.style.height = h + 'px';
    });
    flyer.addEventListener('click', goHome);
    state = 'flying';
    last = performance.now();
    raf = requestAnimationFrame(step);
  }

  function goHome() {
    if (state !== 'flying') return;
    state = 'returning';
  }

  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state === 'flying') {
      x += vx * dt; y += vy * dt;
      const maxX = innerWidth - w, maxY = innerHeight - h;
      if (x <= 0 || x >= maxX) { vx = -vx; x = Math.max(0, Math.min(maxX, x)); tilt = vx > 0 ? -3 : 3; }
      if (y <= 0 || y >= maxY) { vy = -vy; y = Math.max(0, Math.min(maxY, y)); tilt = vy > 0 ? 2 : -2; }
      tilt *= 0.96;
    } else if (state === 'returning') {
      const home = photo.getBoundingClientRect();
      x += (home.left - x) * 0.14; y += (home.top - y) * 0.14; tilt *= 0.8;
      w += (home.width - w) * 0.14; h += (home.height - h) * 0.14;
      flyer.style.transition = 'none';
      flyer.style.width = w + 'px'; flyer.style.height = h + 'px';
      if (Math.abs(home.left - x) < 0.6 && Math.abs(home.top - y) < 0.6 && Math.abs(home.width - w) < 0.6) {
        settle(); return;
      }
    }
    flyer.style.transform = `translate(${x}px, ${y}px) rotate(${tilt}deg)`;
    pushWords(state === 'flying', dt);
    raf = requestAnimationFrame(step);
  }

  // Words near the photo are pushed outward along a smooth falloff; a spring
  // carries each one there and back, so the motion overshoots and settles naturally.
  function pushWords(active, dt) {
    const mx = x + w / 2, my = y + h / 2, hw = w / 2, hh = h / 2;
    for (const word of words) {
      const px = word.cx - scrollX, py = word.cy - scrollY;
      let tx = 0, ty = 0;
      if (active) {
        // Distance from the word to the photo's edge (0 when touching or inside).
        const ex = Math.max(Math.abs(px - mx) - hw, 0), ey = Math.max(Math.abs(py - my) - hh, 0);
        const gap = Math.hypot(ex, ey);
        if (gap < REACH) {
          const f = 1 - gap / REACH, strength = PUSH * f * f * (3 - 2 * f);   // smoothstep
          const dx = px - mx, dy = py - my, len = Math.hypot(dx, dy) || 1;
          tx = dx / len * strength; ty = dy / len * strength;
        }
      }
      if (!tx && !ty && !word.ox && !word.oy && !word.vx && !word.vy) continue;
      const ax = (STIFFNESS * (tx - word.ox) - DAMPING * word.vx) / word.mass;
      const ay = (STIFFNESS * (ty - word.oy) - DAMPING * word.vy) / word.mass;
      word.vx += ax * dt; word.vy += ay * dt;
      word.ox += word.vx * dt; word.oy += word.vy * dt;
      if (!tx && !ty && Math.abs(word.ox) < 0.05 && Math.abs(word.oy) < 0.05 && Math.abs(word.vx) < 0.5 && Math.abs(word.vy) < 0.5) {
        word.ox = word.oy = word.vx = word.vy = 0; word.el.style.transform = ''; continue;
      }
      const tiltDeg = Math.max(-8, Math.min(8, word.vx * 0.02));
      word.el.style.transform = `translate(${word.ox.toFixed(2)}px, ${word.oy.toFixed(2)}px) rotate(${tiltDeg.toFixed(2)}deg)`;
    }
  }

  function settle() {
    cancelAnimationFrame(raf);
    photo.style.visibility = '';
    flyer.remove(); flyer = null;
    unwrapWords();
    state = 'home';
  }

  photo.addEventListener('click', release);
  addEventListener('keydown', e => { if (e.key === 'Escape') goHome(); });
  addEventListener('resize', () => { if (state === 'flying') measure(); });
})();
