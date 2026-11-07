# Max Verstappen Racing (fan site)

A one-page site modelled on ak-racing-site.vercel.app, rebuilt for Max Verstappen.
It reuses the reference site's markup and CSS (`css/base.css`), with new scripts and Max content.

## Run it

```bash
python -m http.server 5190 --directory D:/PROJECTS/ak_assets/max
```

Then open http://localhost:5190. It needs a local server because the 3D garage loads as a module.

## Files

- `index.html`: page markup
- `css/base.css`: reference site styles, merged and cleaned
- `css/max.css`: MV colours, fonts and small additions
- `js/data.js`: all editable content (race calendar, career numbers, timeline, garage specs, socials)
- `js/main.js`: loader, header/menu/theme/sound, hero and helmet lens, marquees, manifesto, career numbers, timeline, racing line
- `js/garage-photo.js`: the garage (animated RB18 photo: drive-in, tilt, studio light, reflection sweep)
- `js/garage.js`: the small 3D car in the hero (Three.js, built in code)
- `images/ph/`: designed placeholders shown until real photos exist
- `tools/make_placeholders.py`: regenerates the placeholders

## Photos

The two supplied photos are kept in `images/src/`. `tools/prepare_photos.py` turns them into:

- `images/hero/max-face.webp`: the hero portrait, cut out from the studio background
- `images/car/rb18-studio.webp`: the marquee card, the 2022 timeline entry, the On Track panel and the garage fallback
- `images/social/s2.webp` and `s4.webp`: two of the social cards

The helmet photo (`images/src/max-helmet.png`) is cut out by `tools/prepare_helmet.py` into `images/hero/max-helmet.webp`. It drops over his head when you hover the portrait.

To rerun them (from this folder):

```bash
python tools/prepare_photos.py images/src/max-portrait.jpg images/src/rb18-studio.jpg
```

```bash
python tools/prepare_helmet.py images/src/max-helmet.png
```

If you swap in a different helmet photo, adjust `--hx`, `--ht` and `--hw` on `.hero__portrait` in `index.html` to line it up.

These slots still show placeholders. Drop files at these paths and they replace the placeholders automatically:

| Slot | Path |
|---|---|
| Timeline | `images/history/2013-karting.webp`, `2014-f3.webp`, `2015-debut.webp`, `2016-barcelona.webp`, `2021-champion.webp`, `2023-champion.webp`, `2024-champion.webp` |
| Off track (sim) | `images/offtrack/sim-rig.webp` |
| Social cards (9:16) | `images/social/s1.webp`, `s3.webp`, `s5.webp` |

Use photos you have the rights to.

## Check before publishing

- Race start times in `js/data.js` are approximate; confirm them against the official F1 calendar.
- The footer says the site is a fan-made tribute that isn't affiliated with Max Verstappen. Keep that line.
