/* Original ink boulder. A single imperfect contour rotates as a solid body.
 * SisyphusStone.sample(radius, rotationDegrees) returns:
 *   support  — exact lowest y of the rendered outer polygon;
 *   points   — that polygon, relative to the stone center;
 *   leftAt(y)— exact left edge at a center-relative y (clamped at extrema);
 *   svg      — centered SVG markup, with rotation already applied.
 * Position the stone at cy = groundY - support. The contour is deliberately
 * sampled as straight segments, so contact geometry and rendered ink agree.
 */
(function (global) {
  'use strict';
  const INK = '#181719';
  const COUNT = 192;
  const TAU = Math.PI * 2;
  const number = x => Number(x.toFixed(3));
  const point = p => `${number(p[0])} ${number(p[1])}`;
  const path = points => points.map((p, i) => `${i ? 'L' : 'M'}${point(p)}`).join('') + 'Z';
  const clamp = (x, low, high) => Math.max(low, Math.min(high, x));

  // Fixed bumps, a broad flattened shoulder, and small dry-brush irregularities.
  // No time or rotation enters the profile: these marks belong to the stone.
  function profile(a) {
    return 1 + .035 * Math.sin(3 * a + .72) + .021 * Math.cos(5 * a - .5)
      + .009 * Math.sin(9 * a + 1.8) + .0035 * Math.cos(17 * a + .4)
      + .0015 * Math.sin(43 * a + .8);
  }
  const base = Array.from({ length: COUNT }, (_, i) => {
    const a = i * TAU / COUNT, r = profile(a);
    return [Math.cos(a) * r * .978, Math.sin(a) * r];
  });

  function sample(radius, rotationDegrees = 0) {
    radius = Number.isFinite(Number(radius)) ? Math.max(.001, Number(radius)) : 1;
    const rotation = Number.isFinite(Number(rotationDegrees)) ? Number(rotationDegrees) : 0;
    const turn = rotation * Math.PI / 180, cos = Math.cos(turn), sin = Math.sin(turn);
    const rotate = p => [number(radius * (p[0] * cos - p[1] * sin)),
      number(radius * (p[0] * sin + p[1] * cos))];
    // These rounded coordinates are also used by SVG, rather than a second
    // approximated circle, so the bottom point is genuinely on the ground.
    const points = base.map(rotate);
    const support = Math.max(...points.map(p => p[1]));
    const top = Math.min(...points.map(p => p[1]));

    function leftAt(y) {
      y = Number.isFinite(Number(y)) ? clamp(Number(y), top, support) : 0;
      let left = Infinity;
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        if (y < Math.min(a[1], b[1]) || y > Math.max(a[1], b[1])) continue;
        if (Math.abs(b[1] - a[1]) < 1e-9) {
          left = Math.min(left, a[0], b[0]);
        } else {
          const t = (y - a[1]) / (b[1] - a[1]);
          left = Math.min(left, a[0] + (b[0] - a[0]) * t);
        }
      }
      return Number.isFinite(left) ? left : points.reduce((a, b) =>
        Math.abs(a[1] - y) < Math.abs(b[1] - y) ? a : b)[0];
    }

    // The rim carries its weight below, with an uneven loaded-brush shadow
    // under the left shoulder. Its white interior remains almost entirely open.
    const inner = points.map((p, i) => {
      const length = Math.hypot(p[0], p[1]);
      const down = Math.max(0, p[1] / length), left = Math.max(0, -p[0] / length);
      const grain = .5 + .5 * Math.sin(i * .63 + .8);
      const thickness = Math.max(1, radius * (.008 + .063 * down ** 2.6
        + .025 * down * left + .003 * grain));
      const scale = Math.max(.1, 1 - thickness / length);
      return [p[0] * scale, p[1] * scale];
    });

    const marks = [];
    // Tapered interior scars rotate with the solid contour. Their eccentric
    // spacing makes rotation legible without filling the rock with texture.
    for (const [start, span, depth, width] of [
      [-2.57, .39, .068, .009], [-.63, .22, .052, .006], [.97, .31, .082, .011]
    ]) {
      const outside = [], inside = [];
      for (let j = 0; j <= 12; j++) {
        const q = j / 12, a = start + span * q, edge = profile(a) - depth;
        const taper = Math.sin(Math.PI * q) ** .75;
        outside.push(rotate([Math.cos(a) * .978 * edge, Math.sin(a) * edge]));
        inside.push(rotate([Math.cos(a) * .978 * (edge - width * taper),
          Math.sin(a) * (edge - width * taper)]));
      }
      marks.push(`<path d="${path(outside.concat(inside.reverse()))}"/>`);
    }

    // Small white flecks sit inside the thick lower rim, never cutting away
    // the supporting outer edge. They suggest a brush losing its pigment.
    const flecks = [];
    for (let i = 3; i < COUNT; i += 19) {
      const p = points[i], q = inner[i], mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      if (p[1] < radius * .25 || Math.hypot(p[0] - q[0], p[1] - q[1]) < radius * .028) continue;
      const tangent = [-p[1] / radius, p[0] / radius], size = radius * .011;
      flecks.push(`<path d="${path([
        [mid[0] - tangent[0] * size, mid[1] - tangent[1] * size],
        [mid[0] + tangent[0] * size, mid[1] + tangent[1] * size],
        [mid[0] + tangent[0] * size * .25 - .6, mid[1] + tangent[1] * size * .25 - .7]
      ])}"/>`);
    }

    const svg = `<g fill="${INK}"><path d="${path(points)}"/><path fill="#fff" d="${path(inner)}"/>`
      + marks.join('') + `<g fill="#fff">${flecks.join('')}</g></g>`;
    return { support, points, leftAt, svg };
  }
  global.SisyphusStone = Object.freeze({ sample });
})(typeof window === 'undefined' ? globalThis : window);
