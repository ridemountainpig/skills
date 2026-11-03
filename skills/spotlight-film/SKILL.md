---
name: spotlight-film
description: "Build keynote-style spotlight product films (black stage, one anchor whose beams of light carry content out at different angles, oblique perspective type, hard-cut proof shots) as real rendered MP4s with a deterministic HTML/three.js + Playwright + ffmpeg pipeline, for any product: hardware, apps, developer tools, services. Use for product-launch or feature films and for reviewing such films against a reference. Not for tutorials, screen recordings or slow UI walkthroughs."
---

# Spotlight Film

You turn a product brief (plus optional reference video and footage) into a rendered film.
Claude cannot film people or locations, so the pipeline composites **supplied or authored
material** into the style: an anchor, beams, type, cuts and 3D product. Everything is
rendered from code, so every frame is reproducible and inspectable.

## 0. What this skill can and cannot deliver: say this up front

| Layer | Who supplies it |
| --- | --- |
| Live-action people, places, hands (≈70% of a real keynote film) | **User footage** or a video-generation model, played frame-accurately with `footage()`. Never invent it. |
| Product hero | User GLB/USDZ→GLB model (`productFace(loadGLB(...))`), a product photo made solid (`productFace(slabObject(photo))`), or a graphic stand-in (icon, card) |
| Software proof | Real screen captures/recordings, or faithful authored app states (canvas `material`) |
| Anchor, beams, type, cuts, motion blur | This skill (`scripts/`) |
| Sound | None: films render silent. Music and sound design are added afterwards in an editor, by the user |

If live-action is missing, build the film from product, UI and output material and state
the gap in the delivery. Do not stop and ask unless the brief is literally unbuildable.

## 0.5 Which document wins

When two documents disagree, follow this order:
**SKILL.md › `references/structures.md` › `references/key-frames.md` › `references/style.md` › `references/recipes.md`.**
The templates are examples, not rules: never copy a template's shot list for a new product.

## 0.6 The core idea: one anchor, beams at different angles

Read `references/key-frames.md` first. A film is built around **one anchor** with
windows that leave it as beams at different angles (oblique 27°, 45°, 60°). The anchor sits at
each beam's narrow end; the content is lit from it. Choose the anchor once per film:

| The product… | Anchor | Face |
| --- | --- | --- |
| is a physical object (laptop, phone, headphones, camera) | `object` | a lit 3D object: `useFace(productFace(obj, { view }), { cutout: true })` with `obj` = `await loadGLB(url)` (best), or `slabObject(photoMaterial, { depth, radius })` when only a front or back photo exists. When the user wants the real product look and has a clean render on a plain background (an isometric or hero shot), cut it out to alpha (outline only: fill the holes inside it) and use it directly: `useFace(photoMaterial, { cutout: true })`. A flat photo cannot press keys or open, so its signature moves light over it (a glow clipped to its alpha with `destination-in`) or the camera, not the object. Never a printed card |
| is software that can be shown as one object (app icon, a form card, a window, a logo slab) | `object` | that graphic, via `useFace(material)` |
| has no visual stand-in at all (an API, a protocol, an idea) | `light` | `glow()` hot core |

When in doubt for software, prefer `object`: a recognisable shape gives the film a subject.

**An object that changes shape (a foldable opening, a laptop lid, a case).** `productFace()` frames
its object once, and `useFace()` measures the outline once, so one face cannot be both the closed and
the open product. Build two copies: the film's face (closed, framed tight) and a second
`productFace()` for the signature shot, framed for the open state. In that shot call
`useFace(second, { cutout: true })` while the object is open, build the anchor and its `shine()`
beams (the necks come from the open outline), then call `useFace(first, …)` again and override
`a.draw` to draw the second face. Delete that shot from `pins.js`: its card is a different canvas,
so the measured widths do not compare. See `templates/film-device/` (a phone, then a phone and a
tablet).

## 0.7 Core and free axes: what stays, what changes every film

When every film runs the same shots in the same order, with the same lengths and the same
clockwise bloom, viewers predict the next shot. The style lives in the
**core**; the **free axes** must be decided again for every film, and no free axis has a
default answer.

| Core (every film) | Free axes (decide per film, write them in PLAN.md › Film concept) |
| --- | --- |
| One anchor; beams leave its narrow end; one beam per frame | Structure: order of shots, number of acts (`references/structures.md`) |
| Black stage, irregular windows, content lit from the anchor | Tempo curve: where the film speeds up, breathes, stops |
| One type family on two widths, metallic fill | Opening and closing |
| Hard cuts, deterministic frames | Bloom order (cw / ccw / near / mirror) and link (return / chain / interrupt) |
| Every claim true and shown with its evidence | The signature moment (§2 step 2) |
| The anchor is the subject and never jumps | When the anchor first appears, how its size changes over the film |

A film that keeps every core rule but repeats the last film's free axes fails Gate 8
(`references/review-gates.md`).

## 0.8 Dark or light: the theme

Every shot renders in two looks from the same code. `dark` (default) is the black stage with
metallic type and warm light beams. `light` (`--query theme=light`, or `window.SF_THEME =
'light'` before the film loads) is a white stage (`#f5f5f3`), graphite type, beams as pale
wedges that are brightest at the anchor and darker toward the far end, and a soft drop shadow
under a cut-out anchor. `THEME` (from `engine.js`) carries the tokens: `bg`, `ink`, `muted`,
`edge`, `metal`. Write materials against `THEME.edge` (the colour their edges fade into) and
`THEME.ink`, never a hard-coded black or white, so one film renders both ways. Choose per
film (Film concept): light suits products sold on white (cameras, accessories, home goods)
and daytime footage; dark suits screens, light-emitting products and night footage. When the
user asks for both, render both and run every gate on each; the light wedge must pass
`wedgeContrast`.

**Light colour.** The light is one colour for the whole film, and by default it is the product's
own: `useFace(face, { light: 'auto' })` takes the face's accent (the mean of its saturated
pixels) and tints every beam's hot core, the halo, the sweep lines, the `lit()` ramp
and `glow()` toward it, at the strength of the classic warm white. A grey, white or black product
has no accent and keeps the warm white. Pass `light: 'warm'`, `'cool'` or `[r, g, b]` to choose
by hand (a brand colour from the user beats the measured one), or call `setLight()` from
`engine.js`. One beam can follow its own content instead: `tone: 'content'` on a bloom beat or
`typeSlot()`. Anything you draw as light in `shots.js` (a projector wash, a glowing frame) takes
its colour from `lc(s, k)` (`s` = how far from white: 0.2 the white-hot line, 0.43 the hot core,
0.75 the outer falloff; `k` = brightness), never a hard-coded `rgba(255, 2xx, …)`, or it stays
warm white while the rest of the film follows the product. The beam's base fill still comes
from the content's own edge colour.

**Dark content on the dark stage.** A dark UI (a dark-mode keyboard, a black app) samples a
near-black edge colour, so its beam reads as a black hole with a faint tint and the frame looks
empty. Set `THEME.beamGlow` (light strength, default 1; 1.6–2 for dark UIs) and
`THEME.beamReach` (how far the light carries, default 1; 1.4–1.7) at the top of `shots.js`, and
size content and anchor for the frame, not for safety: in beam shots the anchor is ~25 % of the
frame width (≈ 480 px) and footage cards ≥ 520 px. A frame that is 70 % black with a small
anchor and small cards looks empty.

**Claims beside a tall anchor.** The bloom claim runs out along the beam's edge, starting past
the anchor's half-diagonal. With a tall anchor (an upright phone) that pushes every claim into a
frame corner, far from what it describes. Pass `tat: [x, y]` on the beat to set the claim upright beside the anchor on the side away
from the beam (≈ ±250 px for a 480 px phone face; align follows the side), at `size` 90–105.

**The end card.** When the brand has an official logo, end on it; use the logo file the user
supplies. Keep the legal text to one short line; the full sourcing belongs in PLAN.md, not on
screen.

## 1. Setup (once per project)

```bash
npm init -y && npm i three@0.169.0 @fontsource-variable/archivo@5.1.0 @fontsource/inter@5.1.0
# playwright + chromium + ffmpeg + python3 must exist (check: node -e "require('playwright')")
cp -r <skill>/scripts ./sf                    # engine, anchor toolkit, 3D, render, review
cp -r <skill>/templates/film-starter ./film    # smallest product-neutral film, built from sf/shots-lib.js
cp <skill>/references/film-log.md ./film-log.md   # once, an empty log; keep it across films (skip if the project has one)
node sf/render.mjs --root . --page film/film.html --stills 1,3.5,7.5 --outdir out/stills   # smoke test (add --query theme=light for the light look)
```

If the npm registry is unreachable, get the real font from GitHub instead of a stand-in:
`git clone --depth 1 --filter=blob:none --sparse https://github.com/google/fonts && (cd fonts && git sparse-checkout set ofl/archivo)`,
copy `ofl/archivo/Archivo[wdth,wght].ttf` to `node_modules/@fontsource-variable/archivo/files/`
and write `standard.css` with one `@font-face` (`font-weight: 100 900; font-stretch: 62% 125%`).
Leave Inter to the system font (a `local('Inter')` rule that misses makes `ready()` fail).
A faked width (a heavy sans squeezed with `scaleX`, which `typeSlot()` does when the width axis
is missing) is a last resort and visibly worse: say so in the delivery.

Then replace `film/materials.js` (the face and the content) and write `film/shots.js` from your
Film concept with the shot library (`sf/shots-lib.js`) and `seq()`. Open `templates/film-anchor/shots.js` (a full 50-shot-second example for Formwright)
only to see how a move is built; take the technique, not the shots.

Project layout (the project root is the served root): `sf/` (scripts), `film/film.html`
(stage + import map), `film/shots.js` (shot list), `film/materials.js` (face + content),
`film/pins.js` (match-move positions), `film/PLAN.md`, `assets/` (footage as VP9 WebM or H.264 MP4, GLB), `out/`.

A clip cut from an edited video the user supplies must sit inside ONE of its shots: run
`ffmpeg -i in.mp4 -vf "select='gt(scene,0.25)',showinfo" -an -f null -` first and cut between the
listed times (a 1 s/frame contact sheet hides fast montages). Remember where a beam starts playing:
bloom beams draw the clip from t = 1 (`1 + 1.4 × local`), `burst()` from t = 2 (`2 + 2 × local`);
`start` may be negative to begin earlier.

Footage: `ffmpeg -i in.mov -c:v libvpx-vp9 -b:v 6M -an -vf scale=1920:-2 assets/run.webm`. Create each clip once at
module level (`const run = footage('/assets/run.webm', { start: 2.5 })`) and pass `m: () => run`; `render.mjs`
serves byte ranges, and each frame seeks the clip to its exact time (`footage()` in §4).

## 2. Workflow

1. **Brief and product truth** → write `film/PLAN.md`: product, source of truth (read the
   product's README, docs or site **before** writing anything), one main promise, 2–4 proof
   claims, duration, assets on hand, gaps. Every claim and every line of code shown on screen
   must match the source; cite it in PLAN.md. Never invent an API, a number or a feature.
   Fictional products and illustrative numbers must say so in the legal line.
2. **Film concept** (before any shot list): `node sf/plan-dice.mjs "<product>" --log film-log.md`
   draws structure, tempo, opening, closing, bloom order and link, bpm, pace and one rule break,
   avoiding the last film in the log. Paste its block into PLAN.md and add:
   - **Concept**: one sentence on how the film's form echoes the product (a phone whose back
     has 489 LEDs: the film counts up to 489).
   - **Signature moment**: one shot that would make no sense for any other product, derived from
     its most distinctive look or feature. It may break **one** non-core rule (the drawn rule
     break, or another one you name); write which and why.
   - **Override**: you may replace one drawn value; write the reason.
3. **Reference** (if supplied) → `bash sf/analyze-reference.sh ref.mp4 out/ref`, build the
   shot table with real timecodes and classify each boundary (`references/style.md` › Transitions).
   Without a new reference, `references/key-frames.md` and its `frames/` are the reference.
4. **Shot list** in PLAN.md (table in `references/style.md` › Shot list table) that realises
   the concept: the structure's shape from `references/structures.md`, lengths from the tempo
   curve and the ranges below, cuts on the drawn bpm grid.
5. **Implement** each shot as `{id, start, end, setup(root), frame(local, ctx)}` with the
   toolkit in §4. Use the numeric presets; do not invent easing.
6. **Stills first**: `node sf/render.mjs --root . --page film/film.html --stills 0.5,3,... --outdir out/stills`
   (still times are film seconds: shot-seconds × pace).
   Fix every `[review] … FIX` line it prints (§5), then tile the stills
   (`bash sf/review.sh stills out/stills`) and compare each with its key frame by eye.
7. **Match moves**: `node sf/measure-pins.mjs film --mode object` (or `light`) writes
   `film/pins.js`. Run it again after any layout change.
8. **Preview**: `--scale 0.5 --timeline out/timeline.json --out out/preview.mp4` (one command), then
   `bash sf/review.sh video out/preview.mp4 out/timeline.json`. Inspect; correct; repeat
   (max ~3 loops per issue, then change approach or report the limit).
9. **Final**: `node sf/render.mjs ... --blur 3 --out out/film.mp4`
   (or `bash sf/prender.sh out/film-video.mp4 3`, which renders four frame ranges at once and
   joins them: about 4× faster on a 4-core machine),
   run `references/review-gates.md` on it (Gate 8: `node sf/variety-check.mjs --log film-log.md
   --families "<codes>" --timeline out/timeline.json` plus the guess-the-next-frame test), and
   deliver: MP4, contact sheet, PLAN.md with correction log and separate verdicts for product
   truth, style fidelity, variety. The film is silent; say so in the delivery. Append the film's row to `film-log.md`.

### Timing (the one table to use)

Write shots in **shot-seconds**; `runFilm({ pace, bpm, beat0 })` plays them `pace` times slower.
Cuts sit on a tempo grid (`bpm`) so the edit has a pulse, and music can be laid under it later. Write every duration in **beats**: `const B = beats(bpm, pace)`, `dur: B(6)`;
a plain-seconds duration lands off the beat once paced, and `[review] grid` prints FIX for it
(`offbeat: true` on a shot that cuts between beats on purpose). Pace (1.1–1.5) and bpm (96–132) come from the Film concept. The table gives
**ranges**; where a shot lands in its range follows the tempo curve, not habit.

| Shot type | Shot-seconds |
| --- | --- |
| Opening (any of structures.md › Openings) | 1–3 |
| Deep title plane, V funnel + claim | 1.2–3.5 |
| Type slot (`typeSlot()`, name + figure) | 3.5–5 |
| Pull-back from code | 2.5–4 |
| Bloom beat: open 0.3–0.6, hold 1.5–3.5 (by content density), shut 0.25–0.5 or `shut: 0` (cut away) | 2–4.5 per beat |
| Full-frame proof burst | 0.4–0.8 per cut, 2–5 cuts; cuts may differ in length |
| Frieze, one-take travel | 4–8 |
| Content-only window / full-frame insert / type card | 0.5–1.5 |
| Blackout | 0.4–1 |
| Signature moment | 2–6 |
| Retract-all reprise (`retractAll()`) | ≥ 1.2 per beam, 3–4 beams; never 0.2 s flashes |
| Brand + legal hold | ≥ 2.5 |
| **Whole film** | **20–40 shot-seconds, 8–16 shots (25–50 s on screen)** |

Rhythm rules: at least one shot ≤ 0.8 s and one ≥ 4 s; at most two neighbouring shots within 10%
of each other's length. A claim needs about 0.3 s per word on screen and never less than 2.5 s
(a claim may be split across shots).

## 3. Non-negotiable rules

- **Deterministic frames.** Everything is a function of `t`. No CSS animations, transitions,
  `setTimeout`, `Date`, or `Math.random()` (use `rng(seed)`).
- **Hard cuts are atomic.** No crossfades or bridge morphs unless consecutive reference frames prove one.
- **One WebGL renderer** (`createStage3D`) re-parented between shots; never one per tile.
- **One anchor, one beam per frame.** The anchor is on top (`layers().top`), the beam on
  `.base`, its neck is the anchor's own edge (object) or centre (light). Every beam shot keeps the
  anchor in the **centre** (at least horizontally); only the deep title plane and the frieze
  leave it. A claim rides the beam edge past the anchor (`bloom` beat `type`), not a beam moved off-centre.
  The anchor never jumps between shots: match-move it (`pins.js`).
- **Content first.** Place the content where it reads (560–900 px wide), then the anchor
  across the frame, then `shine()` the beam to it. Content sits whole and legible; a light
  UI's background is dimmed in the beam (`fill: 'auto'`), so the beam never becomes a white wall.
- **Windows are irregular.** Traced or tangent-built polygons with uneven gutters; never
  equilateral triangles in a tight lattice. A window with no anchor (`contentOnly()`) bleeds off
  at least two frame edges and its content's edges fade into the stage colour; a light photo
  in a floating quadrilateral on the dark stage reads as a crooked print, not as light. A plain
  cut of the content is `insert()`, which is full frame.
- **Type** uses one variable family on two widths: condensed (wdth 62, wght 800–850) for
  words, expanded (wdth 125, wght 900) for the hero figure, metallic fill (graphite on the light
  theme). Type slides along its baseline or brightens in; a typewriter is only for code content
  (`typeIn`, pull-back), never for claims in prose.
- **Product names keep their case.** Type is set in capitals, but a word written in mixed case
  (`eBay`, `pH`, `mRNA`) keeps it: write it that way in the line and `text()` leaves it.
  "EBAY" is not the name.
- **Type is readable on a phone.** Films are watched in portrait phone feeds, where a 1080p
  frame is about 220 pt tall. Every claim word renders ≥ 56 px on the 1920 × 1080 frame and a
  lead-in ≥ 44 px (`lead` is 0.3 × `size`, so a lead-in needs `size` ≥ 147; below that write
  the line as `word`). Text drawn inside a material (captions, UI labels) is detail, not a
  claim, but still ≥ 28 px on screen. Every fully visible line stays 24 px inside the frame:
  break long claims into short rows (2–3 words). `block()` and `runFilm()` print
  `[review] type FIX` / `type off-frame FIX`; fix both before rendering.
- **Every claim is on screen with its evidence** in the same or adjacent shot.
- **No default film.** Never reuse a template's or the last film's order (`film-log.md`); the
  Film concept decides the structure. "Rhythm that works" in key-frames.md is one example.
  Fix a Gate 8 failure by changing the film, never by renaming a shot's family code.
- **No other brand's marks or slogans.** "Keynote-style" means the visual grammar only.
- **Claude cannot watch video.** Judge motion from strips, cut pairs and per-frame numbers
  produced by `review.sh`.

## 4. The toolkit (`scripts/anchor.js`)

Import from `../sf/anchor.js`; engine helpers (`E`, `prog`, `lerp`, `layers`, `el`, `ready`…)
come from `../sf/engine.js`. Coordinates are px on the shot's plane, origin at frame centre.

| Function | What it does | Use it for |
| --- | --- | --- |
| `useFace(material, { cutout, edge, radius, light })` | Sets the anchor's face (any canvas material; its aspect sets the slab). `light: 'auto'` tints the film's light to the face's accent (§0.8). `cutout: true` for a real product photo or a rounded app icon on alpha: only the visible shape shows, no card or edges. It measures the visible outline (alpha box and corner radius; `radius` for a drawn slab) so every beam's neck starts under the face's real edge: a rounded or inset face no longer leaves a dark gap at the light source. A cut-out also gets its outline: the neck is a chord across the product, square to the beam (the beam keeps its symmetric shape), pushed as close to the product's edge as it can go with both ends still on the product and tucked under it, so a product lying at an angle in its photo (an isometric keyboard) sends its light from beneath itself, not from the empty corner of its box. The cut-out must be solid: fill any holes in its alpha (dark gaps between keys or buttons often key out) or the beam shows through them | Once, at the top of `shots.js` |
| `anchor(L, { x, y, w, rz })` | The anchor on `L.top`: a slab with the face (object) or a hot core (light). `a.draw(t)`, `a.set({ x, y, s, rz })`, `a.neck(side)`, `a.pt(u, v)` | Every anchor shot |
| `shine(L.base, a, mat, { x, y, w, m }, opts, id, extra)` | Content first: aims a beam from the anchor edge facing the content so its sides graze the content (+ margin `m`). `opts.bg`: `'auto'` / `'sample'` / `'dim'`; `opts.plane: true` on oblique title planes. Prints `[review]` | Title plane, V funnel, apex claim, pull-back |
| `beam(L.base, a, side, far, mat, fill)` | A beam with explicit far vertices | Frieze and hand-built wedges |
| `bloom(L, a, beats)` + `bloomFrame(a, beats, l, { rz })` | Centred anchor; one beam per beat sweeps open, holds, sweeps shut; the beats' `at` set each direction (place them in the drawn bloom order). Beat: `{ m, at, w, t0, t1, tone, bg, type, size, open, shut, dir }`; `shut: 0` is a hard cut: the beam is gone at `t1` and the next beat or shot takes over, `dir: -1` sweeps the other way, overlapping `t0`/`t1` chains beats | Feature sequences and claims |
| `block(parent, lines, { x, y, size, align, top, rot })` | Aligned type block; parts are `[text, 'lead' \| 'word' \| 'fig']` | All type |
| `reveal(rows, l, t0)` / `typeIn(rows, l, t0, cps)` | Baseline slide-in / typewriter (code only) | Type arrival |
| `growIn(w, l, t0, d)`, `drift(w, l, dur, dx, dy)` | Beam aperture from the anchor; slow content drift | Any beam |
| `runFilm({ shots, duration, pace, bpm, beat0, pins, events })` + `beats(bpm, pace)` | Applies pace, match moves and grain, checks every cut against the beat (`[review] grid`), then `defineFilm` | Last lines of `shots.js`; `B(n)` for every duration |
| `footage(src, { start, rate, loop, fit })` (engine.js) | A supplied clip as a material; every rendered frame (and every `--blur` sub-sample) seeks it to its exact time | Live action, screen recordings, any moving proof |
| `productFace(obj, { w, h, view, tick })`, `slabObject(mat, { depth, radius, edge })`, `loadGLB(url)` (product3d.js) | A three.js object rendered on alpha as the anchor's face (shared WebGL renderer). `view(t)` → `{ yaw, pitch, roll }` in degrees, keep within ±25°: the neck is measured at t = 0. `slabObject` turns a photo into a solid with rounded metal sides | Every physical product |

Whole shots come ready-made from `sf/shots-lib.js`, with no order implied: `openShrink`,
`macroPull`, `typeCard`, `titlePlane`, `typeSlot` (the anchor and its beam set into giant diagonal type, frame 9350's layout; a face that is not square, such as an upright phone, keeps its own aspect; `enter: 'cut'` puts the anchor on frame 1 so a shrink or macro pull-back that ends on the anchor's pose cuts straight into it, default `'pop'` arrives 0.2 s in), `bloomShot`, `retractAll`, `funnel` (up / down), `burst` (uneven cuts),
`insert`, `blackout`, `heroHold` (must carry `line` and/or `cta`; with `legal` it is the end card, so skip `brand`), `brand` (`small-name` / `black-line`), and `seq([...])` to lay
them end to end. Write the signature moment yourself; it should not come from the library.

**Screens in a beam.** A beam shows one readable thing, not a whole app window: crop each
screenshot to the part that proves the claim (the chat message and the agent's reply, the comment
box, the one panel), so its text lands at ≥ 16 px on the 1920 frame; a full window at 500 px wide
is a grey blur with 8 px text. Beam content sits on top of the light as a crisp card (rounded
corners and a soft shadow, `beam()` does this); `fill: { under: true }` puts it back under the hot
core and edge shade, which greys a light UI by about a third. When most source screens show the
same document, crop to the UI around it instead of showing the same cover in every beam.

Recipes with code for each composition: `references/recipes.md`.

## 5. Reading the `[review]` line

| Metric | Target | If it fails |
| --- | --- | --- |
| `spread` | 25–100° | > 100: move the content away or shrink it; < 25: bring it closer |
| `beamShare` | 15–50% | > 50: smaller content or narrower margin |
| `brightWedge` (dark theme) | ≤ 0.15 | a light flat background fills the beam: keep `bg: 'auto'` or set `'dim'` |
| `wedgeContrast` (light theme) | ≥ 0.05 | the wedge vanishes into the white page: keep `bg: 'auto'` or set `'dim'` with `dim: 0.8` |
| `type FIX` | none | a part renders below 56 px (lead 44): raise `size` or turn the lead into a `word` |
| `type off-frame FIX` | none | a visible line leaves the 24 px safe area: break it into shorter rows or lower `size` |
| `only FIX` | none | `contentOnly()` content clashes with the stage, or the window bleeds off fewer than two edges |
| `hero FIX` | none | `heroHold()` shows only the icon and name (a still that says nothing, then repeats in the brand shot): give it `line` (the main promise, verbatim) and `cta` (install or buy line); keep it ≤ 2.5 shot-s unless both arrive during the hold |
| `slot FIX` | none | `typeSlot()`: `beamShare` outside 0.15–0.35 → change `lean` / `leanL`; `contentW` < 560 → lower `pin` or raise `lean`; `typeSpan` < 0.55 → raise `size`; `type off-frame` → lower `size` / `highScale` or shorten the words; `bleedTop` false → the beam must leave the top edge |
| `grid FIX` | none | a cut misses the beat: write the shot's duration (and the ones before it) as `B(n)`, or mark it `offbeat: true` on purpose |
| `contentInBeam` | ≥ 0.9 | tangents wrong: check the anchor side |
| `contentInFrame` | ≥ 0.95 | move the content inward (not reported for `plane` shots) |
| `bloom N timing FIX` | none | a bloom beat opens faster than 0.2, shuts faster than 0.16 or is held under 0.3 shot-seconds: give it more time or show fewer beams |
| `neck FIX` | none | a `shine()` beam starts off the product (checked on cut-out faces: each neck point must sit on an opaque pixel). The face's alpha was not measured: pass `cutout: true`. For drawn rounded slabs, still zoom one still at the anchor by eye and set `radius` |
| `anchorMargin` | ≥ 40 px | move the anchor in |
| `balance` | ≤ 0.18 | move anchor, content and type so their midpoint nears the centre (centred anchors are exempt) |

## 6. Files

| File | Use |
| --- | --- |
| `scripts/engine.js` | Easing presets, keyframes, planes, windows, `polyWin`, `funnel`, `slab`, `glow`, `layers`, `grain`, type, film runtime |
| `scripts/anchor.js` | The anchor/beam toolkit in §4 |
| `scripts/product3d.js` | three.js stage, GLB loader, `productFace()` (3D anchor face), `slabObject()` (photo → solid), aluminium material |
| `scripts/measure-pins.mjs` | Measures each shot's anchor pose into `film/pins.js` (workflow step 7) |
| `scripts/render.mjs` | Static server + Playwright frame capture → ffmpeg; `--stills`, `--scale`, `--blur`, `--timeline`, `--query` |
| `scripts/shots-lib.js` | Ready shots with no order (§4) and `seq()` |
| `scripts/plan-dice.mjs` | Draws the free axes for the Film concept, avoiding the last film in `film-log.md` |
| `scripts/variety-check.mjs` | Gate 8 numbers: difference from earlier films, shot-length shape |
| `references/structures.md` | **Read before the shot list.** Structures, tempo curves, openings, closings, bloom links, rule breaks, signature moments |
| `references/film-log.md` | Empty log of finished films (family codes + one row per film); copy to the project root and append each film |
| `scripts/review.sh` | Contact sheets, native cut pairs, motion strips |
| `scripts/analyze-reference.sh` | Reference analysis (contact sheets, scene candidates) |
| `references/key-frames.md` + `frames/` | **Read first.** The 12 key frames and the motion vocabulary |
| `references/recipes.md` | Code for each composition family |
| `references/style.md` | Composition families, drift warnings, the numbers (timing, easing, type, geometry, colour), transitions, the shot list table |
| `references/review-gates.md` | Review gates and report format |
| `references/window-shapes.json` | 16 traced window shapes + one mosaic layout for `traced()` |
| `templates/film-starter/` | **Start here.** Small film for a fictional app built from `shots-lib.js` with a cold-open structure; shows the Film concept block in PLAN.md. Its order is not a pattern to repeat |
| `templates/film-anchor/` | Full example (Formwright, a developer tool): all 12 key frames plus bloom, frieze, depth, pull-back, typing; `?anchor=object\|light` |
| `templates/film-device/` | A phone app on 3D devices (fictional "Keyline" keyboard, no assets needed): a phone built in three.js (`device3d.js`: rounded metal body, glass, camera cut-out, an authored screen) as a tall anchor with claims beside it (`tat`), a second face with the phone and a tablet for the signature (two beams once), dark UI on the dark stage (`beamGlow`/`beamReach`), a captioned burst, two acts |
| `templates/film-object/` | A physical product as a 3D anchor (fictional phone made with `slabObject`) and a footage beam; on the beat with `B(n)` |
