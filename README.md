# JunjieAraoXiong.github.io

Personal website of Junjie Xiong — https://junjiearaoxiong.github.io

Static site hosted on GitHub Pages.

- `index.html` — animation-first entrance with a link to the existing About page
- `landing.css` / `landing.js` — responsive layout, playback, seeking, reduced motion
- `scene.js` — 43-second narrative, growing stone, camera, and timeline
- `figure.js` — anatomical ink figure with continuous joint contours, authored body acting, and planted feet
- `stone.js` — rotating irregular contour, ground support, and palm intersections
- `mountain.js` — deterministic mountain assembled from irregular stones
- `sisyphus.svg` — static first-frame fallback for JavaScript-free browsing
- `about.html` — biography, research, experience, and social links
- `stylesheet.css` — styling for About, Projects, Notes, and posts

The entrance is an original browser-drawn study inspired by Marcell Jankovics's
*Sisyphus* (1974), credited in the footer. It needs no video, animation library,
or external fonts. The figure braces, crouches, crawls, heaves, and finally rests.
The boulder grows with each attempt. Feet remain planted until recovery steps;
long load holds break into short heaves and abrupt failures. The body compresses
and buckles under the growing load. After arrival, a silent pause precedes an
nine-second retreat revealing an irregular mountain of earlier stones. The final
image holds for four seconds before fading through white.

The figure and stone drawings hold at 18fps while the camera and dissolves run
at the display refresh rate. Framing adapts to both portrait and landscape screens.
Playback pauses while the tab is hidden and starts still when the visitor requests
reduced motion. Play explicitly opts into motion. A keyboard-accessible progress
slider and time counter let visitors revisit any part of the film; dragging the
slider suspends playback until release. The mountain is generated once, and the
resting figure stops redrawing during the final camera move.

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
