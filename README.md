# JunjieAraoXiong.github.io

Personal website of Junjie Xiong — https://junjiearaoxiong.github.io

Static site hosted on GitHub Pages.

- `index.html` — animation-first entrance with a link to the existing About page
- `landing.css` / `landing.js` — responsive layout, playback, seeking, reduced motion
- `scene.js` — 56-second narrative, growing stone, camera, and timeline
- `figure.js` — anatomical ink figure with a solved skeleton, changing muscle volume, and a progressive ink silhouette
- `stone.js` — a circular boulder with analytic support, palm intersections, and rotating ink marks
- `mountain.js` — deterministic mountain assembled from irregular stones
- `sisyphus.svg` — static first-frame fallback for JavaScript-free browsing
- `about.html` — biography, research, experience, and social links
- `stylesheet.css` — styling for About, Projects, Notes, and posts

The entrance is an original browser-drawn study inspired by Marcell Jankovics's
*Sisyphus* (1974), credited in the footer. It needs no video, animation library,
or external fonts. A strong, upright figure begins with a manageable round stone.
The burden grows while his gait shortens, his back bends, and his muscular outline
reduces to a thin ink silhouette. A quiet release precedes the mountain reveal.

The fixed hillside, planted foot contacts, and circular stone share one world.
Legs and arms use two-bone inverse kinematics to preserve their lengths. The feet
alternate through stance and swing; stone rotation follows travelled distance
and current radius. The camera allows the burden to dominate the frame before
the final pullback. It does not continually resize the pair to keep them contained.

The figure drawings hold at 24fps while camera movement and dissolves run at the
display refresh rate. Framing adapts to portrait and landscape screens. Playback
pauses while the tab is hidden and starts still when the visitor requests reduced
motion. A keyboard-accessible timeline allows seeking; dragging suspends playback
until release. The mountain is generated once.

To regenerate the static poster after editing the drawing:

```sh
node - <<'JS'
global.window = global;
const fs = require('fs');
require('./figure.js'); require('./mountain.js'); require('./stone.js'); require('./scene.js');
const f = SisyphusScene.frame(.8);
fs.writeFileSync('sisyphus.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><title>Sisyphus</title><g transform="' + f.camera + '">' + f.ground + '<g transform="' + f.actor + '">' + f.figure + f.stone + '</g></g></svg>');
JS
```

## Local preview

```sh
python3 -m http.server 8755
# then open http://localhost:8755/
```

The layout started from [Jon Barron's website template](https://github.com/jonbarron/jonbarron_website) and was rewritten into a custom student/portfolio design.
