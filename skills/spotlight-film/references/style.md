# Style: grammar, numbers, transitions

One reference for how a film looks and moves. Part 1 says what to build, part 2 gives the
measured numbers, part 3 says how to read and build each cut. Recipes for each family are in
`references/recipes.md`.

## 1. Grammar: graphic windows and spatial montage

Product imagery becomes a composition in space. Shaped windows, type, the product and black
negative space are arranged, then translate, turn, change scale and **cut** into contrasting
images. Clear proof moments punctuate the graphic sequence. It is an advertisement with a
strong visual system, not a walkthrough with decorative polygons.

### Seven traits to keep recognizable

1. **Black stage, designed negative space.** The anchor sits centred and the beam carries the content off-centre (key-frames wins); never a centred object
   with unrelated content above and below. Content keeps its own colour and exposure.
2. **Graphic windows** carry real footage/UI/output. Shapes are irregular 4–7-sided
   polygons (tapered quads, wedges, notched hexagons, V funnels) traced in
   `window-shapes.json`, each different, with edges along the footage's perspective lines.
   The subject often **breaks out** past the window edge. Windows sit in generous, uneven
   black space. A window's local shape is usually fixed; its plane, group or content moves.
3. **Spatial motion.** Planes turn, groups travel through the viewport, the camera creeps.
   Image texture and attached type share the plane's transform.
4. **Scale contrast.** Speck-sized object ↔ frame-filling type; macro ↔ wide; mosaic ↔
   single survivor. Avoid a run of similar-size panels.
5. **Type as composition.** Huge expanded figure + condensed words + tiny lead-ins.
   Type can share an oblique plane, ride a window edge, or stand alone; vary the role.
6. **Content with presence.** Every window needs a focal subject readable at its displayed
   size: a person, a hand, a vivid output, a product part, one UI control.
7. **Full-frame punctuation.** Saturated, frontal, crisp proof shots interrupt the graphic
   stage in fast bursts, then the film returns to a new arrangement.

### Composition families

| Family | Job | Recipe |
| --- | --- | --- |
| Tiny object on void | open, reset scale | `tumble` (`openShrink`, `macroPull`) |
| Kinetic title on oblique plane | identity | `title-oblique` (`titlePlane`), `type-slot` |
| Masked surface / window travel | graphic transition with live content | `window travel`, `breakout` |
| Full-frame proof | comprehension | `proof-burst` (`burst`), `full-insert` (`insert`) |
| Macro proof | tactility | a cropped close-up in `proof-burst` |
| Claim + evidence | persuasion | `v-window-ai` (`funnel`), `battery-edge`, `apex-claim` |
| Controlled mosaic (optional) | breadth | `mosaic`, or hard cuts with one beam each (`looks`) |
| Product hero / title hold | payoff | `heroHold()`, or `title-front` in `templates/film-anchor/shots.js` |
| Brand hold | close | `brand()` in `scripts/shots-lib.js` (`small-name` / `black-line`), or a closing from `references/structures.md` |

Energy comes from the **contrast between families**, not from effects at each cut.

### Typography roles

identity (name) · claim (one supportable statement) · geometry (letters form a plane or
edge) · transition partner (type moves with the surface). One dominant message per beat;
every claim has its evidence immediately before, during or after; perspective may be strong
in motion but resolves to a readable hold.

### Editorial rhythm

Phrase = compact setup → decisive cut or move → readable proof → type punctuation →
contrasting scale → payoff hold. Alternate bursts (0.5 s cuts) with holds, but break the
alternation at least once (a blackout, an interrupted beam, a long still) so the pattern never
settles. The film-level order and tempo come from `references/structures.md`.

### Drift warnings — stop and redesign when the film becomes

- a sequence of similarly tilted dark slabs, or a PowerPoint collage;
- regular geometric tiles (equilateral triangles, tight equal gutters) instead of traced, varied windows;
- a slow UI tour, typing of prose claims, or a shallow-focus tutorial (typing code inside a pull-back is fine);
- an effect at every cut (wipes, morphs, crossfades);
- one type layout reused for every claim;
- the same shot order, hold length or bloom turn as the last film (`references/film-log.md`), or a bloom whose
  next direction a viewer can call before it opens;
- energetic shapes that never show what the product does;
- another brand's product, logo or slogan.

## 2. Numbers

Measured from a 1920×1080, 23.98 fps keynote-style "new 14-inch" laptop reference (body ≈ 41 s,
then brand hold). Use these as defaults; replace them with your own measurements when a
new reference is supplied. Units: px at 1920×1080, seconds, degrees.

### Timing

| Item | Value |
| --- | --- |
| Frame rate | 24 (23.976 for broadcast deliveries) |
| Tempo grid | 120 bpm → beat 0.5 s; put cuts on beats or half beats |
| Opening object-on-void | 2.0–2.5 s (hold 0.7 s, then tumble/shrink 1.5 s) |
| Title / claim shots | shot-seconds and on-screen times: see the Timing table in SKILL.md (it wins). Claim text arrives 0.3–0.5 s after the cut |
| Full-frame proof | 0.5–1.0 s each; bursts of 2–4 back-to-back hard cuts |
| Travel phrases (window groups) | 2.0–3.0 s, internal content cut near the middle |
| Mosaic build (optional, see key-frames frames 7–8) | tiles pop every 0.2–0.25 s, survivor hold 0.5 s |
| Final title hold | 1.5 s; brand + legal hold ≥ 2.5 s |
| Ratio | about 60% graphic-window shots, 25% full-frame proof, 15% type/brand |

### Easing (engine.js `E`)

| Name | cubic-bezier | Use |
| --- | --- | --- |
| `snap` | (0.2, 0, 0, 1) | Entries: type sliding along its baseline, window apertures, group arrival (0.4–0.6 s) |
| `glide` | (0.45, 0, 0.2, 1) | Hold-to-hold moves, camera reframes |
| `launch` | (0.7, 0, 0.84, 0) | Exits that leave at speed into a cut (tumble, group exit) |
| `settle` | (0.16, 1, 0.3, 1) | Small overshoot-free landings |
| `drift` | linear | Camera creep during holds: 3–8% scale or 40–80 px per shot |

Never use bounce/elastic. Keep velocity continuous inside a travel phrase (snap in → drift →
launch out); let the hard cut reset it.

### Typography

One variable family (Archivo Variable as the display face), uppercase.

| Role | Width / weight | Size (cap ≈ font-size × 0.72) |
| --- | --- | --- |
| Hero figure ("13X", "M6", "L1") | wdth 125, wght 900 | 150–430 px; oblique titles may run 380–430 |
| Claim words ("FASTER AI PERFORMANCE") | wdth 62, wght 800–850 | 0.9 × hero figure |
| Lead-in ("UP TO", "NEW", "WITH") | wdth 62–70, wght 700–800, track 0.04em | 0.3–0.36 × hero, bottom-aligned to baseline; never below 44 px |
| Minimum on screen | — | claim words 56 px, lead-ins 44 px, text inside materials 28 px (phone portrait feed) |
| Rows | — | 2–3 words per row on a beam edge; the whole block 24 px inside the frame |
| Claim line width | — | 70–90% of frame width |
| Legal | Inter 500, 15 px, #6e6e73 | centred, 80 px from bottom |

Fill: metallic gradient `linear-gradient(100deg,#7d7f86,#d9dade 38%,#fff 55%,#a9abb2)` (dark);
graphite `linear-gradient(100deg,#111113,#3d3e44 40%,#6b6c73 55%,#1d1d1f)` (light). Both come from `THEME.metal`.
Claims brighten in (brightness 0.08 → 1 over ~1 s, `glide`) or slide along their baseline
(-260 px → 0, `snap`, staggered 0.07 s per line). Never a typewriter for prose claims (only for code content, `typeIn`), never glow.

### Geometry

Traced from the reference (82 frames, 161 windows). The
shapes themselves are in `window-shapes.json`; use them instead of inventing polygons.

| Item | Measured value |
| --- | --- |
| Stage | pure #000 |
| Window base shape | irregular 4–7-sided polygons: tapered quads, wedges, pentagons, hexagons. **Not** equilateral triangles. Every window in a phrase has a different shape |
| Signature cut | a chevron or V **notch** cut into one edge (12.5 s, 22.5 s, 25 s in the reference) |
| Edges | follow the perspective lines of the footage (room edges, desk edges, a laptop lid), so the silhouette looks cut out of the scene |
| Subject breakout | the person, hand or product extends **past** the window edge (10.5 s, 18.5 s, 33.5 s). This is the most recognizable trait; see `recipes.md` › breakout |
| Aspect | median 1.6 : 1 (landscape); 10–90% range 0.8–2.1 |
| Area share of frame | median 9%; small accents ≈ 1%; hero windows 50–80% |
| Windows on screen | usually 1; mosaics 3–5 |
| Gutters between windows | median 2% of frame width, but uneven: 1.4% to 11%. Never a tight equal-gap lattice |
| Frame edges | about half the windows touch or bleed off a frame edge |
| Oblique title plane | rotateZ 30–38°, rotateY −10 to −16°, rotateX 6–10°, perspective 2200–2600 px; the window shares the plane, its lower edge on the title baseline |
| Edge-attached type | anchor 26 px outside the window's long diagonal edge; a second line 100–130 px further out |
| Beam apex (anchor) | the window's narrowest vertex or neck sits on the anchor; anchor overlaps the edge by 10–40% of its own size and is drawn above the window |
| Edge angle vocabulary | oblique 24–27° / 145–152°, 45° (45–46°, 130–139°), 60° (59–62°, 114–122°), plus 0°/90° frame-aligned edges. Max two families per shot |
| Funnel neck | 18–30% of the funnel's wide end; sides at 46°/133° (V) or 59°/122° (lift) |
| Light anchor (no product) | `glow()` core 200–360 px, warm; window content brightest at the apex, falloff to ≈ 35% at the wide end (`lit()`) |
| Product (top view) | 30–35% of frame width at first frame; shrinks to ≈ 3% |

### Colour and light

- Dark theme: black stage, no grade on window content; content stays saturated (reds, oranges, teal).
- Light theme: stage `#f5f5f3`, ink `#1d1d1f`, legal `#86868b`, material edges `#e9e8e4`; a light
  UI's wedge is pressed down to 0.86 so it reads as a pale shape; the warm glow at the neck makes
  the wedge brightest at the anchor; a cut-out anchor casts `drop-shadow(0 26px 34px rgba(0,0,0,.24))`.
  Full-frame bursts keep their photos as they are (a dark photo in a light film is fine).
- 3D product: aluminium `#c4c6cc`, metalness 1, roughness 0.32, ACES tone mapping.
  Top views look straight into the environment's bright ceiling: use exposure ≈ 0.5 and
  environment intensity ≈ 0.55 for them; 3/4 views use 1.0 / 1.0.

### Shot list table (PLAN.md)

| # | Time | Family | Subject / source | Edit in | Motion | Type role | Claim/proof |
| --- | --- | --- | --- | --- | --- | --- | --- |

Families: tiny object on void · kinetic title (oblique plane) · masked surface · full-frame
proof · macro proof · controlled mosaic · claim + evidence · product hero · brand hold.

## 3. Transitions: classify before you animate

Look at **consecutive native frames** around each boundary (`analyze-reference.sh` strips
or `ffmpeg -ss <t-0.1> -frames:v 6`). Sparse sheets make hard cuts look like morphs.

| Operation | Evidence | Build it with |
| --- | --- | --- |
| Direct / match cut | frame N and N+1 are different compositions | a new shot in `shots` (runtime switches atomically) |
| Group travel | the whole arrangement + its type move along one axis | `xf(group, {x: kf(...)})`: snap in → drift → launch out |
| Perspective turn | outline changes but texture foreshortens consistently | animate the plane's `rx/ry/rz`; keep the mask fixed |
| Aperture opening | outline grows from a corner/edge while content stays put | `setPoly` scaled from the anchor corner with `E.snap` |
| Foreground occlusion | an object covers the region at the edit frame | cut under coverage; track the object's speed on both sides |
| Internal content cut | outer window continuous, content changes | `win.setContent()` at the cut time inside one shot |
| Morph (rare) | consecutive frames show the contour bending | `lerpPoly` with matched vertex order; only with evidence |

Rules:
- A hard cut has zero duration and no midpoint. Never crossfade it.
- Motion blur is rendered per shot (`render.mjs --blur`), so it never blends across a cut.
- Keep velocity through a travel phrase; let the cut reset it.
- Opacity is a support tool (type arrival), not a substitute for geometry.
- Record each boundary in PLAN.md: time, operation, moving layer, evidence frame.
