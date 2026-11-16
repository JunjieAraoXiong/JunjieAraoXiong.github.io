// Click the profile photo to set it loose like a bouncing DVD logo.
// Text makes way as it passes (words slide aside along their lines) and settles back.
// Click it again (or press Escape) and it flies home.
(() => {
  'use strict';
  const photo = document.querySelector('.intro-photo img');
  const page = document.querySelector('.page');
  if (!photo || !page) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const SPEED = 190;    // px per second along each axis
  // Text makes way the way a crowd does: words slide sideways along their own
  // line toward the nearer edge of the photo, neighbours shuffle a little less
  // the further they are, and lines just above and below bulge gently.
  const GAP = 10;        // px of paper kept between the photo and a word
  const NUDGE = 18;      // px a word just beside the photo still shifts
  const SPREAD = 46;     // px over which that nudge fades along the line
  const LINE_REACH = 26; // px above/below the photo where lines are affected
  const BULGE = 9;       // px lines above/below are lifted away
  // Each item rides a spring with a small overshoot and a quick settle
  // (damping ratio about 0.6). Lower DAMPING = bouncier.
  const STIFFNESS = 210;
  const DAMPING = 17;

  let flyer = null, words = [], lines = [], raf = 0, last = 0, state = 'home';
  let measuredWidth = 0;
  let x = 0, y = 0, vx = SPEED, vy = SPEED * 0.82, w = 0, h = 0, tilt = 0;
  // Squash on impact: sx/sy spring back to 1 after the photo hits a wall.
  let sx = 1, sy = 1, svx = 0, svy = 0;

  photo.style.cursor = 'pointer';
  photo.title = 'Click me';

  // Wrap each word in the page so it can move independently. Words stay plain
  // inline spans moved by relative offsets, so line breaks (after hyphens too),
  // text-wrap balancing and link underlines are exactly as before release.
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
    // Split after hyphens too, so no span is ever broken across two lines.
    const parts = nodes.map(node => node.nodeValue.split(/(\s+)|(?<=-)(?=\S)/).filter(Boolean));
    // Where every word sits now, so the wrapped text can be checked against it.
    const range = document.createRange();
    const spots = parts.map((list, i) => {
      let at = 0;
      return list.map(part => {
        range.setStart(nodes[i], at); range.setEnd(nodes[i], at += part.length);
        return /^\s+$/.test(part) ? null : range.getClientRects()[0];
      });
    });
    const placed = [];
    nodes.forEach((node, i) => {
      const frag = document.createDocumentFragment();
      parts[i].forEach((part, j) => {
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const span = document.createElement('span');
        span.className = 'bw';
        span.textContent = part;
        frag.appendChild(span);
        if (spots[i][j]) placed.push([span, spots[i][j]]);
      });
      node.parentNode.replaceChild(frag, node);
    });
    keepLineBreaks(placed);
    document.documentElement.classList.add('is-bouncing');
    measure();
  }
  // Separate spans can measure a hair wider than one run of text, which can tip
  // a word that only just fitted onto the next line. Give any such block a
  // pixel or two more room so every line breaks exactly where it did.
  const BLOCKS = 'p, li, h1, h2, h3, .role-head, div';
  function keepLineBreaks(placed) {
    const moved = () => {
      const blocks = new Set();
      for (const [span, was] of placed) {
        const now = span.getClientRects()[0];
        if (now && (Math.abs(now.top - was.top) > 2 || Math.abs(now.left - was.left) > 2)) blocks.add(span.closest(BLOCKS) || page);
      }
      return blocks;
    };
    for (let room = 1; room <= 4; room++) {
      const blocks = moved();
      if (!blocks.size) return;
      for (const block of blocks) { block.style.marginRight = `-${room}px`; block.dataset.bwRoom = ''; }
    }
  }
  function releaseLineBreaks() {
    for (const block of page.querySelectorAll('[data-bw-room]')) { block.style.marginRight = ''; delete block.dataset.bwRoom; }
  }

  // Words and the page's other images (logos, thumbnails) all get pushed.
  // Images are heavier, so they swing a little slower than words.
  const IMAGES = 'img:not(.intro-photo img), .project-thumb';
  function measure() {
    const items = [...page.querySelectorAll('.bw'), ...page.querySelectorAll(IMAGES)];
    // On a re-measure (resize mid-flight) springs carry on from where they were.
    const previous = new Map(words.map(word => [word.el, word]));
    // Reset every item first, then read every rect, so layout is computed once.
    for (const el of items) place(el, 0, 0);
    const rects = items.map(el => el.getBoundingClientRect());
    measuredWidth = innerWidth;
    words = items.map((el, i) => {
      const r = rects[i];
      const image = !el.classList.contains('bw');
      // Words share one mass so a line moves together (the cascade gives the stagger);
      // images are heavier and swing a little slower.
      const mass = image ? 1.8 : 1;
      const old = previous.get(el);
      return { el, cx: r.left + r.width / 2 + scrollX, cy: r.top + r.height / 2 + scrollY, hw: r.width / 2, hh: r.height / 2,
        ox: old ? old.ox : 0, oy: old ? old.oy : 0, vx: old ? old.vx : 0, vy: old ? old.vy : 0, mass, tx: 0, ty: 0 };
    });
    for (const word of words) if (word.ox || word.oy) place(word.el, word.ox, word.oy);
    // Group into visual lines (same column, same baseline), ordered left to right,
    // so a push can be passed along the line from word to word.
    const byColumn = new Map();
    for (const word of words) {
      const column = word.el.closest('p, li, h1, h2, h3, .role-head, .course, div') || page;
      if (!byColumn.has(column)) byColumn.set(column, []);
      byColumn.get(column).push(word);
    }
    lines = [];
    for (const list of byColumn.values()) {
      list.sort((a, b) => a.cy - b.cy);
      let row = [];
      for (const word of list) {
        if (row.length && Math.abs(word.cy - row[0].cy) > 6) { lines.push(row); row = []; }
        row.push(word);
      }
      if (row.length) lines.push(row);
    }
    lines = lines.map(row => {
      row.sort((a, b) => a.cx - b.cx);
      return { words: row, cy: row[0].cy, hh: Math.max(...row.map(w => w.hh)) };
    });
  }
  function unwrapWords() {
    for (const el of page.querySelectorAll(IMAGES)) place(el, 0, 0);
    for (const span of page.querySelectorAll('.bw')) span.replaceWith(span.textContent);
    releaseLineBreaks();
    page.normalize();
    document.documentElement.classList.remove('is-bouncing');
    words = []; lines = [];
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
      if (x <= 0 || x >= maxX) { vx = -vx; x = Math.max(0, Math.min(maxX, x)); tilt = vx > 0 ? -1.5 : 1.5; sx = 0.93; sy = 1.04; }
      if (y <= 0 || y >= maxY) { vy = -vy; y = Math.max(0, Math.min(maxY, y)); tilt = vy > 0 ? 1 : -1; sy = 0.93; sx = 1.04; }
      tilt *= 0.95;
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
    // Spring the squash back to round (slightly underdamped, so it jiggles once).
    svx += (260 * (1 - sx) - 14 * svx) * dt; sx += svx * dt;
    svy += (260 * (1 - sy) - 14 * svy) * dt; sy += svy * dt;
    flyer.style.transformOrigin = 'center';
    flyer.style.transform = `translate(${x}px, ${y}px) rotate(${tilt}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    pushWords(state === 'flying', dt);
    raf = requestAnimationFrame(step);
  }

  // Words move by relative offset (no new layers, no reflow, crisp text);
  // images keep using transform.
  function place(el, ox, oy) {
    if (el.classList.contains('bw')) {
      if (!ox && !oy) { el.style.position = el.style.left = el.style.top = ''; return; }
      el.style.position = 'relative';
      el.style.left = ox.toFixed(2) + 'px'; el.style.top = oy.toFixed(2) + 'px';
    } else {
      el.style.transform = (ox || oy) ? `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px)` : '';
    }
  }

  // Smooth 1 -> 0 falloff.
  const fade = (d, range) => { const t = Math.max(0, 1 - d / range); return t * t * (3 - 2 * t); };

  const SPACE = 5;   // px kept between neighbouring words when they shuffle along

  function pushWords(active, dt) {
    const left = x - GAP, right = x + w + GAP, top = y, bottom = y + h, mx = x + w / 2;
    for (const word of words) { word.tx = 0; word.ty = 0; }
    if (active) {
      for (const line of lines) {
        const py = line.cy - scrollY;
        const lineGap = Math.max(top - (py + line.hh), (py - line.hh) - bottom, 0);
        const weight = fade(lineGap, LINE_REACH);
        if (weight > 0) {
          // Pass the push along the line: the word nearest the photo clears it,
          // each neighbour moves just enough to keep a word space, so nothing overlaps.
          const lefts = line.words.filter(wd => wd.cx - scrollX < mx).reverse();
          const rights = line.words.filter(wd => wd.cx - scrollX >= mx);
          // A word under the photo's middle eases back to rest (hidden by the
          // photo) instead of jumping from one side to the other.
          const centre = wd => Math.min(1, Math.abs(wd.cx - scrollX - mx) / (w * 0.3));
          const startL = left - NUDGE * 0.4, startR = right + NUDGE * 0.4;
          // Each neighbour keeps the gap it had at rest (a word space, or none
          // between a word and its punctuation or the two halves of a hyphenated word).
          let limit = startL, prev = null;
          for (const wd of lefts) {
            if (prev) limit = Math.min(startL, prev.cx - scrollX + prev.eased - prev.hw - Math.max(0, (prev.cx - prev.hw) - (wd.cx + wd.hw)));
            const edge = wd.cx - scrollX + wd.hw;
            const shift = Math.min(0, limit - edge);
            if (!shift && edge < limit - SPREAD) break;
            wd.eased = shift * centre(wd);
            wd.tx = wd.eased * weight;
            prev = wd;
          }
          limit = startR; prev = null;
          for (const wd of rights) {
            if (prev) limit = Math.max(startR, prev.cx - scrollX + prev.eased + prev.hw + Math.max(0, (wd.cx - wd.hw) - (prev.cx + prev.hw)));
            const edge = wd.cx - scrollX - wd.hw;
            const shift = Math.max(0, limit - edge);
            if (!shift && edge > limit + SPREAD) break;
            wd.eased = shift * centre(wd);
            wd.tx = wd.eased * weight;
            prev = wd;
          }
        } else if (lineGap < LINE_REACH + 24) {
          // Lines just above/below lift away a little where they pass over the photo.
          const above = py < top, lift = BULGE * fade(lineGap - LINE_REACH, 24);
          for (const wd of line.words) {
            const px = wd.cx - scrollX;
            const outside = Math.max(left - (px + wd.hw), (px - wd.hw) - right, 0);
            const t = lift * fade(outside, 80);
            if (t) wd.ty = above ? -t : t;
          }
        }
      }
    }
    for (const word of words) {
      const tx = word.tx, ty = word.ty;
      if (!tx && !ty && !word.ox && !word.oy && !word.vx && !word.vy) continue;
      const ax = (STIFFNESS * (tx - word.ox) - DAMPING * word.vx) / word.mass;
      const ay = (STIFFNESS * (ty - word.oy) - DAMPING * word.vy) / word.mass;
      word.vx += ax * dt; word.vy += ay * dt;
      word.ox += word.vx * dt; word.oy += word.vy * dt;
      // Keep the spring's overshoot small so a word never lands on its neighbour.
      if (tx && Math.sign(word.ox) === Math.sign(tx) && Math.abs(word.ox) > Math.abs(tx) * 1.15) { word.ox = tx * 1.15; word.vx = 0; }
      if (ty && Math.sign(word.oy) === Math.sign(ty) && Math.abs(word.oy) > Math.abs(ty) * 1.15) { word.oy = ty * 1.15; word.vy = 0; }
      if (!tx && !ty && Math.abs(word.ox) < 0.05 && Math.abs(word.oy) < 0.05 && Math.abs(word.vx) < 0.5 && Math.abs(word.vy) < 0.5) {
        word.ox = word.oy = word.vx = word.vy = 0; place(word.el, 0, 0); continue;
      }
      place(word.el, word.ox, word.oy);
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
  // Only a width change reflows the text; iOS toolbar resizes change height alone.
  addEventListener('resize', () => { if (state === 'flying' && innerWidth !== measuredWidth) measure(); });
})();
