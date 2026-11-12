---
name: afterglow
description: "Make short product demo films and matching posters in a retro-device style: a line-drawn terminal or monitor whose glowing screen runs the real product UI, driven chapter by chapter by a cursor, typed keys, a POWER button and a COLOR knob, with one captioned verb per chapter. Rendered to MP4 and PNG with a deterministic HTML canvas + Playwright + ffmpeg pipeline, in several looks (amber, green, white, cyan CRT, e-paper or a brand colour). Use for developer tools, CLIs, APIs, forms, themes and apps that are understood by watching them used. Not for hardware launches or films that need live action (use spotlight-film)."
---

# Afterglow

A film is **one device on a quiet stage**. Its screen shows the product. Each chapter a hand does one thing
(presses POWER, types a line, turns the knob, hits the action key) and the screen answers. A caption above says
the chapter in a few words with one word lit. The same scene renders stills: 16:9, 1:1, 9:16 and a three-look strip.

Everything is drawn from code (`scripts/kit.js`, `scripts/reel.js`), so every frame is reproducible.
You write **data** (chapters) and **one `screen()` function per chapter**; the runtime does the device, light,
keys, cursor, captions, camera, posters, sound events and checks.

## 0. When to use it, and when not

| Use afterglow | Use spotlight-film instead |
| --- | --- |
| A tool you understand by watching it used: CLI, API, form, editor, app flow, theme | A physical product, a launch film with people and places |
| 15–30 s, 2–5 chapters, one device on screen the whole time | Many angles, beams, oblique type, fast hard cuts |
| Real screenshots or faithfully redrawn UI states are available | The story is about mood and footage |

Both use the same frame-by-frame Playwright render approach and the PLAN.md truth table habit, but this skill is
self-contained: everything it needs is in `scripts/`.

## 1. Workflow

1. **Read the product's own sources** (README, website copy, docs, real screenshots). Write `PLAN.md` with a
   truth table: every caption and every line of text on the screen → the source sentence it comes from. Invented
   numbers, users or features are not allowed; a fictional product must say so on the end card.
2. **Pick the chapters** (§2). One verb each. Write them in PLAN.md as a table: caption · action · what the screen shows.
3. **Pick the look and device** (§3). One base look per film. Add a knob chapter only if colour or theme is part of
   the product story (or the user asks to show several looks).
4. **Set up** (§5), copy a template, replace the chapters. Do not keep a template's chapter order.
5. **Smoke test**: `node afterglow/render.mjs --root . --page film/film.html --timeline out/timeline.json --stills 1,5,9,13 --outdir out/st`.
   The page prints `[review]` lines; fix every `FIX` and read every `WARN`. Look at the stills.
6. **Render**: `python3 afterglow/sound.py out/timeline.json out/sound.wav`, then `bash afterglow/prender.sh out/v.mp4`
   (add `palette=paper` etc. as the second argument for another look; it stops with FIX if a segment came out
   short, so a crashed browser never ships a cut film), then `bash afterglow/mux.sh out/v.mp4 out/sound.wav out/film.mp4`
   (two-pass loudness to about −16 LUFS).
7. **Review**: `bash afterglow/review.sh out/film.mp4` (contact sheet, one frame per chapter, loudness). Look at
   both images. Run the gates in §6. Fix and re-render.
8. **Posters**: `node afterglow/poster.mjs --root . --page film/film.html --outdir out/posters --jobs "hero:<look>,square:<look>,story:<look>,triptych:<look>"`
   with the film's look (for example `green` for the starter template).
9. **Deliver** the MP4, the posters, the contact sheet and PLAN.md. Say what is authored (redrawn UI, sound) and
   what is real (screenshots), and any gap.

Timing: a 20–25 s film renders in about 2–3 minutes at 1080p30 on 4 cores. No motion blur is needed.

## 2. Chapters: the grammar

- **Boot (hook)**: the screen is off (`› press POWER to start`), the cursor presses POWER (`power: 1.4`), the
  screen opens from a line, a few boot lines, then the product's home screen. 4–5 s. Optional but strong.
- **2–4 feature chapters**: one physical action → one visible result. Actions: `typing` (keys light up as each
  character is typed), `press` (the action key, labelled per chapter: `⏎ SCAN`, `⏎ POST`, `⏎ SHARE`),
  `knob` (COLOR knob clicks), `cursor` (to any key, POWER, COLOR, or a point on the screen).
  Results: the screen changes state, a JSON/response block prints, a badge appears beside the caption
  (`✓ Recognized`, `201 Created`), glyphs rain (`rain()`), a card slides into place.
- **End card**: `>_ Title`, tagline, a chip (an install command or 2–3 words), one small line, one legal line.
- Chapter length 4–6 s (the page warns outside 3.5–7.5). Total 15–30 s.
- **Caption**: verb first, about 7 words, exactly one `'mark'` segment:
  `[['Hit '], ['⏎ POST', 'mark'], ['. It rains JSON.']]`. A badge may follow it.
- **Camera**: still by default. Allowed: a slow push (`{ from: [1, 0], to: [1.05, 10] }`) or a tilt down to show
  the lower half of the screen (`{ from: [1, -84], to: [1.03, -96] }`). The caption band stays fixed.
- **Screen content** must read like the product: its real words, real field names, real output. Large: a screen
  title of 46–64 px, body 17–22 px (screen space, 920 × 545). Put content in the whole screen; empty halves read as unfinished.
- Real screenshots go through `tinted(img, pal, w, h)`, which maps them into the look (white → phosphor, black → glass;
  ink on paper for light looks). That is what makes real material belong.

## 3. Looks and devices

Looks (`kit.js` → `PALETTES`): each has `stage, head, mark, glass, phos, dim, hot, ok, line` and an effect profile
`fx { glow, scan, roll, flick, curve }`.

| Look | Feel | Use for |
| --- | --- | --- |
| `amber` | warm CRT, the default | most tools |
| `green` | P1 terminal | CLIs, infra, security |
| `white` | cool blue-white CRT | design tools, docs |
| `cyan` | vacuum-fluorescent display, magenta accent | audio, hardware-adjacent, playful |
| `paper` | e-paper: pale stage, ink, no glow (`light: true`) | writing, reading, calm products |
| `lookFrom('#hex')` | a CRT look tinted with the brand's accent | when the brand has a strong colour |

Add your own in `reel({ looks: { name: {...} } })`. Rules the page checks: `mark` on `stage` ≥ 3:1, `phos` on `glass`
≥ 4.5:1, and `mark` must stand out from the caption ink (a light look needs its own mark colour, it cannot reuse the ink).

The **knob** steps through `knobStops` (the base look first). Between two dark looks the colours cross-fade (0.22 s).
Between a dark and a light look the screen collapses to a line, the whole stage swaps while it is dark, and the
screen returns with a degauss wobble (0.75 s): never a grey mix.

Devices (`reel({ device })` or `?device=`): `terminal` (monitor + keyboard; key presses visible) and `monitor`
(no keyboard, slightly larger screen, a foot; for app flows driven by the cursor). Keyboard typing is invisible
on `monitor`, so use cursor clicks there.

## 4. API (the parts you write)

```js
import { reel, loadImages, loadFonts } from '../afterglow/reel.js';
import { txt, rgba, rr, tinted, rain, ease, easeOut, lerp } from '../afterglow/kit.js';
const IMG = await loadImages({ home: '../assets/home.png' });
const FONTS = await loadFonts(['700 20px Inter', '500 20px "JetBrains Mono"' /* every weight you use */]);
await reel({
  brand: 'PRODUCT', footer: 'PRODUCT · AFTERGLOW', palette: 'amber', device: 'terminal', fonts: FONTS,
  knobStops: ['amber', 'green', 'white'],           // only if a chapter has knob: [...]
  chapters: [{ id, dur, caption, badge, action, power, typing, press, knob, cursor, camera, events,
               screen(s, w, h, x) { /* x.t, x.lt (local s), x.pal, x.p(a, b) local progress, x.typed(i) */ } }],
  end: { kicker, title, tagline, chip, small, legal },
  poster: { headline, kicker, storyLines, lines, triptych, times: { hero, square, story, triptych } },
});
```

All chapter times are **local** seconds. Sound events come from the chapters automatically (keys, enter, knob,
power, cuts, end); add `events: [{ at, type: 'scan' | 'ok' | 'rain' | 'click', dur }]` for the rest.
Draw with `txt()` (it tracks small screen text for the checks). Never use `Date`, timers or `Math.random()`: use `hash(n)`.

## 5. Setup

```
<project>/afterglow/   ← copy of scripts/
<project>/film/        ← film.html + shots.js from a template
<project>/assets/      ← screenshots (for the flightshot template: copy templates/flightshot/assets/ here)
<project>/node_modules ← npm i @fontsource/inter @fontsource/jetbrains-mono (+ @fontsource/noto-sans-tc for CJK)
```
`sound.py` needs NumPy in the Python that runs it (`python3 -m pip install numpy`).
Playwright and ffmpeg must be available (`require('playwright')`). Fonts are served from `node_modules` by the
render server, so `film.html` links `/node_modules/@fontsource/...`. Every font weight the film draws must be in
`loadFonts()`, or Chromium silently falls back to a serif.

Templates: `templates/starter/` (a fictional CLI, `monitor`, `green`, no screenshots: shows drawn UI) and
`templates/flightshot/` (a real app, `terminal`, `amber` with a knob chapter, tinted screenshots, the share
log and story frame). Read both before writing; copy the closer one.

## 6. Review gates

| Gate | Pass when |
| --- | --- |
| Page checks | `[review] OK` or only WARNs you can justify (captions ≤ ~7 words, one mark, chapters 3.5–7.5 s, fonts loaded, look contrast, no screen text < 15 px) |
| One action, one result | Each chapter on the chapter sheet shows the action's result clearly by its middle frame |
| Truth | Every caption and screen line is in PLAN.md's truth table with its source |
| Fill | No chapter's middle frame is more than about half empty screen; posters have no empty third |
| Legibility | At 50 % (the contact sheet), the screen title and the result are readable |
| Look | Mark word visibly lit in every look used; no grey mid-mix frames on a light↔dark knob step |
| Device | No line of the monitor body crosses the keyboard (the keyboard is opaque); the cursor lands on its target |
| Sound | `review.sh` says about −16 LUFS and true peak ≤ −1 dBTP |
| Posters | The poster's headline is the film's promise; triptych labels match their looks |

## 7. Style boundaries

- This style is borrowed from retro terminals in general. Do not copy another product's theme name, wordmark or
  layout details (for example Open Form's "Phosphor" theme); name the look by its colour, and vary the device.
- The device is line-art in the look's `line` colour, never a photo-real model.
- One look per film unless the knob chapter is the point.
- Do not invent product behaviour to make a chapter work. If the real product has no "action key", the action key
  is a stylisation of its main action and the caption must still be true.

## 8. Files

| File | What |
| --- | --- |
| `scripts/kit.js` | looks, contrast, screen pipeline (tint, glow, scanlines, roll, vignette, flicker), monitor, keyboard, knobs, cursor, typing, rain, captions |
| `scripts/reel.js` | the runtime: chapters → frames, knob transitions, camera, posters, events, `[review]` checks |
| `scripts/render.mjs` | frame-by-frame render to MP4 or stills, `--timeline` writes `window.__film` |
| `scripts/prender.sh` | 4-way parallel render + join; second argument is a page query (`palette=paper`) |
| `scripts/poster.mjs` | posters: `kind:look[:time]` jobs |
| `scripts/sound.py` | original sound from the event list (hum, keys, knob, power, chime, rain, pad); numpy only |
| `scripts/review.sh` | contact sheet, chapter frames, loudness check |
| `scripts/mux.sh` | picture + sound with two-pass loudness normalisation |
