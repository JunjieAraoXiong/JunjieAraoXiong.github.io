/*
 * Original ink mountain for the Sisyphus landing animation.
 * Usage: svgGroup.innerHTML = window.SisyphusMountain.create();
 * Coordinates: summit (0, 0), base y=800, x=-735..805.
 * The left climbing silhouette follows x≈-0.92*y below the summit ledge.
 * The rough summit cap supports a figure at local x=-65,y=0 (world x≈-47 after scaleX .72).
 * Mount once; animate the parent group/camera. No per-frame update is needed.
 */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const rounded = value => Math.round(value * 10) / 10;
  function randomFactory(seed) {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }
  function point(p) { return `${rounded(p[0])} ${rounded(p[1])}`; }
  function contour(points, roundness = 0.3) {
    const rough = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i], prev = points[(i + points.length - 1) % points.length];
      const next = points[(i + 1) % points.length];
      const enter = [p[0] + (prev[0] - p[0]) * roundness, p[1] + (prev[1] - p[1]) * roundness];
      const leave = [p[0] + (next[0] - p[0]) * roundness, p[1] + (next[1] - p[1]) * roundness];
      const steps = Math.max(3, Math.ceil((Math.hypot(p[0] - enter[0], p[1] - enter[1]) + Math.hypot(leave[0] - p[0], leave[1] - p[1])) / 3.2));
      for (let j = 0; j <= steps; j++) {
        const t = j / steps, u = 1 - t;
        const x = u * u * enter[0] + 2 * u * t * p[0] + t * t * leave[0];
        const y = u * u * enter[1] + 2 * u * t * p[1] + t * t * leave[1];
        const dx = 2 * u * (p[0] - enter[0]) + 2 * t * (leave[0] - p[0]);
        const dy = 2 * u * (p[1] - enter[1]) + 2 * t * (leave[1] - p[1]);
        const length = Math.hypot(dx, dy) || 1;
        const grain = (Math.sin(x * 2.34 + y * 3.15) * 0.7 + Math.sin(x * 0.41 - y * 0.89) * 0.55) * Math.sin(Math.PI * t);
        rough.push([x - dy / length * grain, y + dx / length * grain]);
      }
    }
    return rough.map((p, i) => `${i ? 'L' : 'M'}${point(p)}`).join('') + 'Z';
  }
  let cache;
  function create() {
    if (cache) return cache;
    const random = randomFactory(1974112);
    // The heap has shoulders, shelves, and a long broken right flank. Individual
    // stones determine its actual edge; this is only a loose packing envelope.
    const leftEdge = [[70,-55],[150,-118],[220,-139],[298,-226],[360,-224],[425,-348],[500,-385],[568,-500],[632,-522],[701,-647],[785,-735]];
    const rightEdge = [[70,44],[145,81],[217,151],[280,172],[342,275],[404,291],[475,403],[548,455],[609,571],[683,665],[785,805]];
    function edgeAt(edge, y) {
      for (let i = 1; i < edge.length; i++) {
        if (y <= edge[i][0]) {
          const t = (y - edge[i - 1][0]) / (edge[i][0] - edge[i - 1][0]);
          return edge[i - 1][1] + (edge[i][1] - edge[i - 1][1]) * t;
        }
      }
      return edge[edge.length - 1][1];
    }
    const stones = [];
    function addStone(x, y, rx, ry, tilt) {
      stones.push({ x, y, rx, ry, tilt: tilt === undefined ? (random() - 0.5) * 0.85 : tilt });
    }
    addStone(-20, 96, 65, 49, -0.27);
    addStone(-49, 172, 65, 58, 0.21);
    // Place large, old burdens first, then pack smaller attempts around them.
    // Collision uses ellipses and permits overlap, without rows or tessellation.
    for (const pass of [
      { attempts: 900, min: 68, max: 117, threshold: 0.89, ceiling: 22 },
      { attempts: 1900, min: 35, max: 67, threshold: 0.79, ceiling: 76 },
      { attempts: 2400, min: 20, max: 37, threshold: 0.76, ceiling: 148 },
      { attempts: 1400, min: 12, max: 22, threshold: 0.75, ceiling: 181 }
    ]) {
      for (let attempt = 0; attempt < pass.attempts && stones.length < pass.ceiling; attempt++) {
        const y = 126 + random() * 637;
        const rx = pass.min + random() * (pass.max - pass.min);
        const ry = rx * (0.58 + random() * 0.49);
        if (y - ry < 69 || y + ry * 1.12 > 804) continue;
        const left = edgeAt(leftEdge, y), right = edgeAt(rightEdge, y);
        const x = left + rx * 0.5 + random() * Math.max(0, right - left - rx);
        if (x + rx * 0.45 > right || x - rx * 0.45 < left) continue;
        if (stones.some(s => Math.hypot((x - s.x) / (rx + s.rx), (y - s.y) / (ry + s.ry)) < pass.threshold)) continue;
        addStone(x, y, rx, ry);
      }
    }
    stones.sort((a, b) => a.y - b.y);
    const markup = ['<g class="mountain-ink" aria-hidden="true" fill="#101010">'];
    // Each burden has its own asymmetry, lean, and brush weight. Foreground
    // stones cover the stones behind them, like an accumulated heap.
    for (const stone of stones) {
      const {x, y, rx, ry, tilt} = stone;
      const count = 10 + Math.floor(random() * 4);
      const cos = Math.cos(tilt), sin = Math.sin(tilt);
      const lightTilt = 0.16 + random() * 0.64;
      const outline = [], face = [];
      for (let i = 0; i < count; i++) {
        const angle = i / count * Math.PI * 2;
        const radius = 0.85 + random() * 0.28;
        const dx = Math.cos(angle) * rx * radius;
        const dy = Math.sin(angle) * ry * radius;
        const ox = dx * cos - dy * sin, oy = dx * sin + dy * cos;
        outline.push([x + ox, y + oy]);
        const weight = Math.max(-1, Math.min(1, (ox * Math.sin(lightTilt) + oy * Math.cos(lightTilt)) / (Math.hypot(ox, oy) || 1)));
        const shoulder = 0.94 - weight * (0.16 + random() * 0.13);
        face.push([x + ox * shoulder - 1.2, y + oy * shoulder - 1.2]);
      }
      markup.push(`<path d="${contour(outline, 0.43)}"/>`);
      markup.push(`<path fill="#fff" d="${contour(face, 0.47)}"/>`);
      // Short cuts of paper within the dark undercut make the ink feel dragged.
      const chips = rx > 48 ? 3 : 1;
      for (let i = 0; i < chips; i++) {
        const t = 0.35 + random() * 1.7;
        const px = x + Math.cos(t) * rx * 0.87;
        const py = y + Math.sin(t) * ry * 0.89;
        const length = 2 + random() * Math.min(10, rx * 0.16);
        markup.push(`<path fill="#fff" d="M${rounded(px)} ${rounded(py)}l${rounded(length * 0.52)} ${rounded(-length)} .8 ${rounded(length * 0.85)} -1.2 ${rounded(length * 0.3)}Z"/>`);
      }
      if (rx > 69 && random() < 0.14) {
        const px = x - rx * 0.23, py = y + ry * 0.31;
        markup.push(`<path d="M${rounded(px)} ${rounded(py)}q${rounded(rx * 0.2)} ${rounded(ry * 0.11)} ${rounded(rx * 0.4)} ${rounded(-ry * 0.02)}q${rounded(-rx * 0.19)} ${rounded(ry * 0.05)} ${rounded(-rx * 0.36)} ${rounded(-ry * 0.04)}Z"/>`);
      }
    }
    // A broad, irregular cap gives the final standing figure an actual foothold.
    // Its left shoulder meets the first row of stones at y≈75.
    markup.push('<g class="summit-ledge">');
    markup.push(`<path d="${contour([[-88,5],[-78,0],[-66,0],[-56,1],[-44,0],[-31,2],[-17,1],[-2,0],[15,5],[33,29],[43,57],[34,72],[4,85],[-30,80],[-61,59],[-80,34]], 0.15)}"/>`);
    markup.push(`<path fill="#fff" d="${contour([[-87,7],[-73,3],[-60,3],[-48,4],[-32,4],[-15,4],[-2,3],[12,7],[26,30],[31,52],[22,63],[-5,71],[-33,67],[-61,50],[-78,31]], 0.22)}"/>`);
    markup.push('<path fill="#fff" d="M-72 48l2 8 1-3-1-6zM22 66l5-3-2 4-3 1z"/>');
    markup.push('</g>');
    // Let the last stones disappear into paper instead of ending in a ruler-straight baseline.
    markup.push('<defs><linearGradient id="mountain-paper-base" x1="0" y1="752" x2="0" y2="812" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".54" stop-color="#fff" stop-opacity=".15"/><stop offset=".87" stop-color="#fff" stop-opacity=".83"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>');
    markup.push('<path fill="url(#mountain-paper-base)" d="M-760 752H830V818H-760Z"/>');
    markup.push('</g>');
    cache = markup.join('');
    return cache;
  }
  function mount(parent) {
    const wrapper = document.createElementNS(NS, 'g');
    wrapper.innerHTML = create();
    parent.appendChild(wrapper);
    return wrapper;
  }
  window.SisyphusMountain = Object.freeze({ create, mount, bounds: Object.freeze({ x: -735, y: 0, width: 1540, height: 800 }), summit: Object.freeze({ x: 0, y: 0 }) });
})();
