# JunjieAraoXiong.github.io

Personal website of Junjie Xiong - https://junjiearaoxiong.github.io

Static site hosted on GitHub Pages.

- `index.html` - landing page: Marcell Jankovics's *Sisyphus* (1974), hosted as a muted 1080p MP4 on warm paper, with a quote and copyright line
- `about.html` - biography, research, experience, and social links
- `classes.html` - course notes
- `stylesheet.css` - shared paper, ink, and EB Garamond styling for About, Notes, Projects, and posts

The film is served from `media/sisyphus-1080p.mp4`, with the black intro and ending trimmed. It loops with muted inline playback, shows a poster for reduced motion, and supports tap-to-play when autoplay is unavailable. The source is https://www.youtube.com/watch?v=LHJ_mNwrH3k (Sisyphus, 1974, Marcell Jankovics).

## Local preview

```sh
python3 -m http.server 8755
# then open http://localhost:8755/
```

The layout started from [Jon Barron's website template](https://github.com/jonbarron/jonbarron_website) and was rewritten into a custom student/portfolio design.
