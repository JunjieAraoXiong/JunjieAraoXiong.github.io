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
  function clip(polygon, a, b, c) {
    const result = [];
    for (let i = 0; i < polygon.length; i++) {
      const p = polygon[i], q = polygon[(i + 1) % polygon.length];
      const dp = a * p[0] + b * p[1] - c;
      const dq = a * q[0] + b * q[1] - c;
      if (dp <= 0) result.push(p);
      if ((dp <= 0) !== (dq <= 0)) {
        const t = dp / (dp - dq);
        result.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    }
    return result;
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
    const stretch = 1.16;
    const boundary = [[0, 0], [805 / stretch, 800], [-735 / stretch, 800]];
    const sites = [[0, 38]];
    // Unequal horizontal spacing and vertical drift avoid a visible masonry grid.
    for (let row = 1; row <= 12; row++) {
      const y = 52 + row * 60;
      const count = row + (row % 3 === 0 ? 1 : 0);
      const left = -0.91 * y, right = 1.0 * y;
      const widths = Array.from({ length: count }, () => 0.58 + random() * 0.94);
      const sum = widths.reduce((a, b) => a + b, 0);
      let cursor = left;
      for (const width of widths) {
        const span = (right - left) * width / sum;
        sites.push([(cursor + span * (0.4 + random() * 0.2)) / stretch, y + (random() - 0.5) * 51]);
        cursor += span;
      }
    }
    const stones = [];
    for (let i = 0; i < sites.length; i++) {
      const p = sites[i];
      let polygon = boundary.map(v => v.slice());
      for (let j = 0; j < sites.length && polygon.length; j++) {
        if (i === j) continue;
        const q = sites[j];
        polygon = clip(polygon, q[0] - p[0], q[1] - p[1], (q[0] * q[0] + q[1] * q[1] - p[0] * p[0] - p[1] * p[1]) / 2);
      }
      if (polygon.length < 3) continue;
      const cx = p[0] * stretch, cy = p[1];
      polygon = polygon.map(v => [v[0] * stretch, v[1]]);
      const center = [polygon.reduce((s, v) => s + v[0], 0) / polygon.length, polygon.reduce((s, v) => s + v[1], 0) / polygon.length];
      const expanded = [];
      // Small kinks in a handful of contours suggest the drag of a dry brush.
      for (let k = 0; k < polygon.length; k++) {
        const a = polygon[k], b = polygon[(k + 1) % polygon.length];
        expanded.push(a);
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 48 && random() < 0.62) {
          const t = 0.25 + random() * 0.5;
          expanded.push([a[0] + (b[0] - a[0]) * t + (random() - 0.5) * 17, a[1] + (b[1] - a[1]) * t + (random() - 0.5) * 14]);
        }
      }
      const shadow = expanded.map(v => [center[0] + (v[0] - center[0]) * 1.025, center[1] + (v[1] - center[1]) * 1.025]);
      const white = expanded.map(v => {
        const dx = v[0] - center[0], dy = v[1] - center[1];
        const illumination = Math.max(-1, Math.min(1, (dx * 0.36 + dy * 0.94) / (Math.hypot(dx, dy) || 1)));
        // White shoulders merge with the page; weight is carried by black undersides.
        const inset = 0.98 - illumination * (0.18 + random() * 0.13);
        return [center[0] + dx * inset - 2.5, center[1] + dy * inset - 2.5];
      });
      stones.push({ shadow, white, cx, cy, center, round: 0.38 + random() * 0.1 });
    }
    const markup = ['<g class="mountain-ink" aria-hidden="true" fill="#101010">'];
    // Shadows are drawn as a continuous ink mass, never outlined pebbles.
    for (const stone of stones) markup.push(`<path d="${contour(stone.shadow, stone.round)}"/>`);
    markup.push('<g fill="#fff">');
    for (const stone of stones) markup.push(`<path d="${contour(stone.white, 0.49)}"/>`);
    markup.push('</g>');
    // A few pale flecks break up the ink where the brush runs out of pigment.
    markup.push('<g fill="#fff" opacity=".85">');
    for (const stone of stones) {
      if (stone.cy < 160 || random() > 0.45) continue;
      const vertex = stone.shadow.reduce((a, b) => a[1] > b[1] ? a : b);
      const x = vertex[0] - 2 + random() * 4, y = vertex[1] - 4 - random() * 5;
      markup.push(`<path d="M${rounded(x)} ${rounded(y)}l${rounded(0.7 + random() * 1.8)} -3.8 .7 5.6Z"/>`);
    }
    markup.push('</g>');
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
