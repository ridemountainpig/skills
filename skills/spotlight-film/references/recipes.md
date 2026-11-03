# Shot recipes

The anchor/beam functions live in `scripts/anchor.js` (see SKILL.md §4); ready shots live in
`scripts/shots-lib.js` (no order; `seq()` lays them out). Full films: `templates/film-starter/shots.js`
(smallest), `templates/film-anchor/shots.js` (all key frames), `templates/film-device/shots.js`
(3D phone and tablet), `templates/film-object/shots.js` (a 3D product, GLB or photo slab); search the
shot `id`. Each shot is `{ id, dur, setup(root) -> ctx, frame(local, ctx) }`; `setup` builds DOM once
per shot, `frame` only sets transforms/opacity and redraws content canvases.

## anchor + beam — the core system (see `key-frames.md`)
Every shot places the anchor first, then aims beams whose narrow end is the anchor.
```js
import { layers } from '../sf/engine.js';
import { useFace, anchor, shine, grow, growIn, block, reveal } from '../sf/anchor.js';
useFace(face(), { cutout: true });              // the product's face (a material); ?anchor=light: a hot core instead
const L = layers(root, { perspective: 2600 });  // beams/type on L.base, the anchor on L.top
const a = anchor(L, { x: 0, y: 0, w: 180 });
// a beam from the anchor's best edge to content placed at (x, y), w px wide, m px margin
const w = shine(L.base, a, terminal(), { x: 560, y: -220, w: 680, m: 40 }, {}, 'my-shot');
// frame(): grow it out of the anchor, then move both layers together
growIn(w, l, 0, 0.55);                          // or w.setPts(grow(w.pts, w.src, p))
L.set({ rz: 3, s: lerp(1, 1.04, l / dur) });
```
`shine()` prints `[review]` numbers for the composition when given an id. Also in `anchor.js`:
`ray()` (a beam at any angle from the anchor's edge) and `drift()`.
Rules: one beam per frame; the anchor is drawn above the window and overlaps its edge by 10–40% of its size;
the beam's wide end bleeds off the frame; light falloff runs from the anchor outward.
Turn the beam between shots while the anchor stays put.

## motion vocabulary — bloom, frieze, depth, pull-back, typing
Copy from `templates/film-anchor/shots.js`; the table in `key-frames.md` maps each move to
its shot. Key pieces:
```js
const a = anchor(L, { x: 0, y: 0, w: 180 });         // dead centre
const beats = bloom(L, a, [{ m, at: [540, -250], w: 720, t0: 0, t1: 1.3 }, /* next: new direction, size, feature */]);
bloomFrame(a, beats, l, { rz });  // open → hold → shut → next beat's direction; shut: 0 = cut away
panel.style.filter = `blur(${lerp(7, 0, p)}px)`;   // depth: far→near pulls into focus
L.set({ x: -s * P[0] * k, y: -s * P[1] * k, s });  // pull back from point P (k = (s-1)/(s0-1))
typeIn(block.rows, l, t0, cps);           // typewriter type, layout fixed
```

## type-slot — giant diagonal type laid out around the anchor and its beam (frame 9350)
Take only the TYPE LAYOUT from 9350; the anchor and the beam stay the film's own. Earlier
versions built 9350 with `titlePlane()`: small type under a beam on a tilted plane. The look is
different: the words are giant and cross most of the frame on a diagonal, and the anchor and
its beam sit in the gap the words leave, so type, anchor and beam fit together like one puzzle.
```js
useFace(face(), { cutout: true });
typeSlot({ id: 'name', dur: 4.8, m: agent,               // m: the beam's content, as in any beam
  low:  [[['MEET', 'lead']], [['FORMWRIGHT', 'word']]],   // long row: short lead-in + the name
  high: [[['BUILT FOR', 'lead']], [['AGENTS', 'word']]],  // short row: lead-in + figure or word
  size: 240, highScale: 0.95 })
```
- Layout, all on one plane: the low row runs under the anchor; the anchor (`neck` × size wide)
  stands on that row's cap line one gutter up, `along` (0.55) of the way along the long word (or
  after the lead-in, if that is longer); the beam leaves the anchor's top edge (from under the
  face) and opens up and off the top of the frame, its right side leaning out by `lean`, its
  left by `leanL`; the high row stands beside the anchor on the same line, one gutter past the
  beam's leaning side, its lead-in above. Keep lead-ins short (1–2 words, like "NEW", "MEET").
- `pin` places the whole layout: the beam's neck lands on that point of the frame (default
  0.48, 0.44) at mid-shot, so the anchor sits near the centre whatever the words' lengths.
- The anchor's face lies ON the type plane (a second copy of the plane, painted above the beam),
  so it takes the same perspective and angle as the words and its edges run parallel to their
  baselines. (Drawn upright and only turned to the baseline angle, it looks crooked against the
  perspective type.) The beam's content stays upright: it is placed whole and
  legible in the visible beam (largest
  box that fits, found once at the mid-shot pose and carried with the neck), on its sampled
  background, hot from the anchor, as `beam()` does. Use real screenshots, not redrawn UI.
- The plane: `rz` 28–36° (text runs down to the right), `ry` −18…−26° (start of the line far,
  end near), `rx` ≈ 6°. A falloff mask dims the far start of the line to ~30%.
- Motion: words slide in along their baseline (far row first, 0–0.9 s; the low row from the start
  of the line, the high row from the far end, so no word passes under the anchor); the anchor lands
  (0.2–0.75 s, a short settle from 105%, small enough not to touch the words); the beam SWEEPS open (`sweep`, default 0.55–1.3 s): its
  right side starts along its left side and swings out, led by a line of light, while the content
  brightens; the camera creeps `travel` px along the baseline with a slight pull-back. Frame 0
  is black. Hold ≥ 3.5 shot-seconds. Render the final with `--blur 3` like every other shot.
- `fill: 'footage'` makes upright footage cover the beam instead (for supplied live action).
- `[review] slot` prints `beamShare` (0.15–0.35 of the frame), `typeSpan` (≥ 0.55 of the frame
  width), `bleedTop`, `contentW` (≥ 560 px) and `type off-frame` (every word whole, 24 px inside
  the frame). Fix with `lean` / `leanL` / `pin` (beam and content), `size` / `highScale` (type).

## apex-claim — type continues the beam edge past the apex (frames 9359 → 9360)
The anchor stays centred; the claim rides the beam's flatter edge, extended back past the
anchor on the side away from the window, starting past the anchor's corner. `bloom()` does the
geometry when a beat has `type`:
```js
const L = layers(root), a = anchor(L, { x: 0, y: 0, w: 180 });
const beats = bloom(L, a, [
  { m: studio(), at: [560, 230], w: 640, t0: 0, t1: 3,
    type: [[['THE', 'lead'], ['RESPONSES', 'word']], [['YOU OWN', 'fig']]], size: 64 },
]);
// frame: bloomFrame(a, beats, l, { rz }); a.draw(t); L.set({ rz });
```
The next line of the claim continues the same diagonal in the next beat or shot. Keep the
claim inside the frame with a 5% margin; shorten the words before shrinking the type.

## tumble — tiny object on void (`openShrink`, `macroPull`)
`openShrink({ dur: B(4), w: 180, s0: 3.2 })`: the anchor fills the centre top-down, then shrinks and
tips to isometric. `macroPull({ P: [40, -60], s0: 9, s1: 0.35 })`: start on a macro detail of the
anchor (point P in anchor px) and pull back to a speck. With a 3D face (`productFace`, film-object)
the same shots turn a lit object instead of a printed card.

## title-oblique — type and a beam share one deep plane (`titlePlane`)
```js
titlePlane({ id: 'title', dur: B(5), m: hero, w: 230, size: 170, rz: 30,
  lines: [[['NEW', 'lead']], [['FORMWRIGHT', 'word'], ['2', 'fig']]] })
```
The anchor sits at the lower-left apex, the beam opens to the content, the name runs along the
plane's baseline under the anchor. For giant diagonal type around the anchor use `typeSlot()`.

## claim line — lead-in + expanded figure + condensed words (`block`)
`block(parent, [[['UP TO', 'lead'], ['6X', 'fig']], [['FASTER EXPORTS', 'word']]], { size: 150, y: 400 })`;
`lead` / `fig` / `word` set the role (STYLE in `anchor.js`). Arrive by cut on the half beat, slide in
with `reveal(rows, l, t0)`, or brighten:
`row.style.filter = brightness(lerp(.08, 1, prog(l, .3, 1.4, E.glide)))`. Ready shots: `typeCard()`
(type alone on black) and `funnel()` (claim under a V beam).

## window travel — one traced window travels, its content cuts internally
```js
import { traced, xf, kf, group, E } from '../sf/engine.js';
const SHAPES = await (await fetch('window-shapes.json')).json();  // copy references/window-shapes.json into film/
const byName = (n) => SHAPES.shapes.find((s) => s.name === n);
const g = group(root), w = traced(g, byName('arrow-notch-hexagon'), { content: A.canvas });
// frame: group travel snap in -> drift -> launch out; swap content mid-move
xf(g, { x: kf(l, [[0, 900, E.snap], [1, 60, E.drift], [2.1, -60, E.launch], [2.5, -900]]) });
if (l >= cutAt) w.setContent(B.canvas);
```
Usually ONE window per travel phrase, wide and landscape. Next phrase: a different shape.

## proof-burst — full-frame hard cuts inside one shot (`burst`)
`burst({ mats: [a, b, c], cut: [B(1), B(1), B(2)], crop: [1.04, 1.08] })`: exactly one material per
segment, each with its own content clock and a slight fixed crop so a UI detail leads. A macro
proof is the same burst on a cropped close-up. `templates/film-device` adds captions on top.

## full-insert — one full-frame cut (`insert`, `contentOnly`)
`insert({ dur: B(2), m })` is a plain full-frame cut with a slow push. `contentOnly({ m, poly })` is one
big irregular window with no anchor that bleeds off two frame edges.

## v-window-ai — V beam above the anchor, claim below (`funnel`)
`funnel({ m, lines, dir: 'up', w: 220, cw: 520 })`: the anchor at the neck, the beam opens upward at
46°/134°, the claim sits under the anchor.

## mosaic — 3–5 traced windows cut on in sequence, then one survivor
Start from `SHAPES.mosaic_layout` (the reference's own arrangement) or pick 3–5
`mosaic-*` shapes and place them with **uneven** gutters (1.5–11% of width), at least one
touching a frame edge. Windows cut on one by one (0.2–0.25 s apart, no fade); at the end hide all
but the survivor and scale it up. Never a tight equal-gap lattice of identical triangles.
Without traced windows, hard cuts with one beam each (`looks` in film-anchor) do the same job.

## breakout — the subject extends past the window edge
The anchor already does this: it sits on `L.top`, above the beam, and overlaps the neck. For a
subject inside footage, use two layers with the same transform: the window (clipped) and the
subject on top (unclipped), e.g. a matte clip
`el('video', layerAbove, ..., { src: '/assets/person-matte.webm' })` exported as VP9 WebM with
alpha (`-pix_fmt yuva420p`) and played in sync with the window's footage. For software products
the subject can be the product object (card, device, icon) or a UI card lifted out of the screen.

## battery-edge — type riding a slanted window edge
```js
const e = edgeAnchor(B, A, frac, -26);      // B = bottom of edge, A = top → reads upward
const pin = el('div', plane, { position: 'absolute', left: `${e.x}px`, top: `${e.y}px`, transform: `rotate(${e.angle}deg)` });
block(pin, [[['UP TO', 'lead'], ['22', 'fig'], ['HOURS', 'word']]], { size: 92, top: true });
```
Turn the plane (`ry 28 → 8`, `rz -14 → -6`, `E.snap`) so the type travels with it. A bloom beat
with `type` does this along the beam edge for you (apex-claim above).

## Using real footage
Use `footage(src, { start, rate, loop, fit })` from `engine.js`: it returns a material that is
frame-exact in stills and renders (the runtime seeks and waits before each frame). Create clips at
module level (`const run = footage('/assets/clip.webm')`, then `m: () => run`) and use them anywhere a
material goes: a beam, `insert()`, `burst()`, `typeSlot({ fill: 'footage' })`. Supply VP9 WebM or
H.264 MP4; for frame-exact seeking transcode with a short GOP:
`ffmpeg -i clip.mov -c:v libvpx-vp9 -crf 24 -b:v 0 -g 6 -an assets/clip.webm`.
`templates/film-object` shows a clip in a beam.
