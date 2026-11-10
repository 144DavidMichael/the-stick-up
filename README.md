# The Stick Up — web reader

A static website for reading **The Stick Up**, a comic book by DavidMichael Bogard, companion to the song and music video [At The Bank](https://youtu.be/ql3aMtpoIs8) by DMB. The music video lives on the [DMB LAW](https://www.youtube.com/@DMB_LAW) YouTube channel.

The public site is meant to be served at:

**https://144davidmichael.github.io/the-stick-up/**

There is no build step and no external CDN. All asset paths are relative, so the site works from that GitHub Pages subfolder (or from the root of any other static host).

## Editions

| Edition   | Pages | Best for                                      | Source edition                         |
|-----------|------:|-----------------------------------------------|----------------------------------------|
| Portrait  |    15 | Phones held upright; classic comic pages      | *The Stick Up* comic book v7           |
| Landscape |    41 | Desktop, or a phone turned sideways; one panel per page | *The Stick Up* landscape v3 |

Readers pick an edition on the title screen. The last page of each edition is remembered in `localStorage` (`the-stick-up-reader`).

## Local preview

From this folder:

```bash
python3 -m http.server 8080
```

Then open [http://127.0.0.1:8080/](http://127.0.0.1:8080/).

## Deploy to GitHub Pages

The files in this folder should sit at the root of the `the-stick-up` GitHub repository (so `index.html` is at the repo root, not inside a nested folder). Then:

1. In the repository **Settings → Pages**, set the source to the default branch and the `/ (root)` folder.
2. The site will be at `https://144davidmichael.github.io/the-stick-up/`.

You can also drop this folder onto [Netlify Drop](https://app.netlify.com/drop) or any other static host. Do not run a bundler; publish the files as they are.

## Social preview (Open Graph)

`index.html` and `reader.html` already use the absolute image URL required by Open Graph and Twitter cards:

```
https://144davidmichael.github.io/the-stick-up/images/og-cover.jpg
```

The file itself also lives at the relative path `images/og-cover.jpg` (1200×630). If the site ever moves to another domain, update the `og:url`, `og:image`, and `twitter:image` tags to match.

## What’s in the folder

```
index.html                 Title screen and edition choice
reader.html                Page-by-page reader (?edition=portrait|landscape&page=N)
css/site.css
js/manifest.js             Edition metadata
js/home.js                 Resume-reading labels on the title screen
js/reader.js               Reader controls
fonts/                     Cinzel and EB Garamond (SIL Open Font License; see fonts/LICENSE.txt)
images/og-cover.jpg        Social preview
images/hero-art.jpg        Title-screen artwork
images/portrait/           15 pages, WebP + JPEG, plus thumbs/
images/landscape/          41 pages, WebP + JPEG, plus thumbs/
```

Page images are WebP with a JPEG fallback. Each page is shown fitted to the viewport (nothing is cropped). On a phone you can pinch to zoom; the page does not block native zoom.

## Keyboard in the reader

- Left / Right arrows, Page Up / Page Down, Space — previous / next page
- Home / End — first / last page
- T — page thumbnails
- F — fullscreen
- Escape — close thumbnails, or leave fullscreen

Tap or click the left and right sides of the page to turn it. Swipe works on a touch screen. The middle of the page shows or hides the toolbars.

## License notes

The comic *The Stick Up* and the song *At The Bank* are © DavidMichael Bogard. The bundled fonts are under the SIL Open Font License 1.1; see `fonts/LICENSE.txt`.
