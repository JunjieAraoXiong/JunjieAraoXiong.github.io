# JunjieAraoXiong.github.io

Personal website of Junjie Xiong — https://junjiearaoxiong.github.io

Static site hosted on GitHub Pages.

- `index.html` — animation-first entrance, with the Sisyphus SVG inlined
- `landing.css` / `landing.js` — entrance layout and accessible play/pause control
- `sisyphus.svg` — source for the original ink illustration and its seamless SVG loop
- `about.html` — biography, research, experience, and social links
- `stylesheet.css` — styling for About, Projects, Notes, and posts
- `images/profile-v2.jpg` — profile photo

The entrance is an original browser-drawn study inspired by Marcell Jankovics's
*Sisyphus* (1974), with a link to the film in the footer. It has no video dependency.
The drawing remains visible without JavaScript, pauses while the tab is hidden,
and starts still when the visitor requests reduced motion. The Play control lets
the visitor explicitly opt into motion.

After editing `sisyphus.svg`, replace the matching SVG block in `index.html` with
the updated source. It is inlined so playback can be controlled without another
network request or a build step.

## Local preview

```sh
python3 -m http.server 8755
# then open http://localhost:8755/
```

The layout started from [Jon Barron's website template](https://github.com/jonbarron/jonbarron_website) and was rewritten into a custom student/portfolio design.
