# JunjieAraoXiong.github.io

Personal website of Junjie Xiong — https://junjiearaoxiong.github.io

Static site hosted on GitHub Pages.

- `index.html` — animation-first entrance with a link to the existing About page
- `landing.css` / `landing.js` — responsive layout, playback, seeking, reduced motion
- `scene.js` — 36-second narrative, growing stone, camera, and timeline
- `figure.js` — anatomical ink figure with five interpolated poses and planted contacts
- `mountain.js` — deterministic mountain assembled from irregular stones
- `sisyphus.svg` — static first-frame fallback for JavaScript-free browsing
- `about.html` — biography, research, experience, and social links
- `stylesheet.css` — styling for About, Projects, Notes, and posts

The entrance is an original browser-drawn study inspired by Marcell Jankovics's
*Sisyphus* (1974), credited in the footer. It needs no video, animation library,
or external fonts. The figure braces, crouches, crawls, heaves, and finally rests.
The boulder grows with each attempt. A long camera retreat reveals the mountain
of stones beneath it; a white fade closes the loop.

The animation draws at 18fps, pauses while the tab is hidden, and starts still
when the visitor requests reduced motion. Play explicitly opts into motion.
A keyboard-accessible progress slider lets visitors revisit any part of the film.
The mountain is generated once; only the actor changes during the climb.

To regenerate the static poster after editing the drawing:

```sh
node - <<'JS'
global.window = global;
const fs = require('fs');
require('./figure.js'); require('./mountain.js'); require('./scene.js');
const f = SisyphusScene.frame(.8);
fs.writeFileSync('sisyphus.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><title>Sisyphus</title><g transform="' + f.camera + '"><g transform="' + f.actor + '">' + f.ground + f.figure + f.stone + '</g></g></svg>');
JS
```

## Local preview

```sh
python3 -m http.server 8755
# then open http://localhost:8755/
```

The layout started from [Jon Barron's website template](https://github.com/jonbarron/jonbarron_website) and was rewritten into a custom student/portfolio design.
