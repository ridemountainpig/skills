# Key frames: the anchor-and-beam system

Twelve frames from a keynote-style reference film define the look. `frames/` holds one layout
map per frame (640 px, 16:9): the traced outlines of its windows, type blocks and product in
yellow on black, with no picture content (the reference itself is not shipped);
`frames/layout-sheet.jpg` tiles all twelve. The table below says what each outline holds. Read
this file before designing any shot.

## The core rule

**A film is organized around one central anchor, and the windows are beams that come out of
it at different angles.** The anchor sits at the narrow end of each beam and usually breaks
out past the window's edge. Every shot answers one question: from which side, at which
angle, does the beam leave the anchor this time?

| Anchor mode | When | Built with |
| --- | --- | --- |
| `object` | The brief has a physical or graphic subject: a laptop, a phone, a card, a box, a logo slab | `slab()` (CSS 3D) or `product3d.js` (GLB or a photo slab) |
| `light` | No subject exists: a service, an API, a website, an idea | `glow()` spotlight hot core |

In both modes the beam's content is lit from the anchor with `lit()`: brightest at the
narrow end, falling off toward the wide end. This keeps dark UI legible against black and
makes the window read as light leaving the anchor. Do not swap modes mid-film.

## Angle vocabulary

Edge angles measured on the traced windows (degrees from horizontal, in frame space):

| Family | Measured | Use |
| --- | --- | --- |
| Oblique plane | 24–27° and 145–152° | Title plane and its windows; the most "isometric" look |
| 45° | 45–46°, 130–139° | Funnel sides, corner breakouts, type riding an edge |
| 60° | 59–62°, 114–122° | Mosaic sides, trapezoid windows |
| Frame-aligned | 0°, 90° | One edge of a window often lies on the frame edge or a horizontal |

These are the measured starting points, **not a limit**. Vary the angle, beam width,
length and anchor size from shot to shot to suit the content: a long thin beam for a single
line of code, a wide fan for a gallery of looks, a big anchor for a hero moment, a tiny one
for an opening. Within one shot keep to one or two angle families. Never use generic
equilateral triangles.

## Composing a shot: content first, then anchor, then beam

Design every shot backwards from what it must show:

1. **Place the content** where it reads best: a third of the frame, at a size where the UI
   is legible (560–900 px wide at 1920). This is the subject of the shot.
2. **Place the anchor across the frame from it**, on a line through the frame's middle, far
   enough that the beam opens at a calm angle. Anchor, content and any type block should
   average out near the centre (balance ≤ 0.18 of the half-diagonal).
3. **Let the beam come to the content**: `shine(parent, anchor, material, {x, y, w, m})`
   picks the anchor edge facing the content as the neck and makes each side the tangent from
   its neck corner to the content's corners plus margin `m`. The beam's sides graze the
   content and frame it; past the content it bleeds off frame.
4. **Read the review line** printed during `--stills` (`[review] <shot> OK|FIX {...}`):

| Metric | Target | If it fails |
| --- | --- | --- |
| `spread` (beam opening angle) | 25–100° (V funnels up to ~100°, travel beams 35–60°) | > 100: content too close or too wide; move the anchor away or shrink the content. < 25: a thin ray; bring the content closer |
| `beamShare` (beam area / frame) | 15–50% | too much white: smaller content or a narrower margin |
| `contentInBeam` | ≥ 0.9 | the tangents are wrong; check the anchor side |
| `contentInFrame` | ≥ 0.95 | move content inward |
| `anchorMargin` (px to frame edge) | ≥ 40 | move the anchor in |
| `balance` | ≤ 0.18 | move anchor and content so their midpoint (with type) nears the centre |

Numbers do not replace looking: after they pass, still put each frame beside its reference
and ask whether the beam's shape is pleasing from that angle and whether it makes the content
the obvious subject. Hard cuts can move the anchor; one anchor still means one subject.

## Placement rules (frames are mid-motion: do not copy positions)

The reference frames were grabbed during movement, so their exact positions are off.
Re-compose each shot at rest, and judge every still for looks, not only for overlaps:

- **One anchor, one beam per frame.** Never a fan of beams from one anchor. Variety comes
  from hard cuts: same anchor, a new beam leaving a different edge (the `looks` shot).
- **The beam fits the anchor's shape.** Object mode: the beam's neck is one edge of the
  anchor, its sides leave from that edge's corners and tuck just under it
  (`a.neck('top'|'right'|'bottom'|'left')`). Light mode: the neck collapses to the light's
  centre, a true cone. Far vertices are identical in both modes so the composition holds.
- **Clean straight edges.** No arbitrary notches or bites; the frame edge does the cropping.
- **Content is presented whole.** The interface sits complete and legible inside the widest
  visible part of the beam, on its own background colour sampled from the canvas edge, so the
  beam is filled edge to edge without cutting the UI into fragments. Never a small card
  floating on a gradient, never a crop so tight the UI becomes unreadable pieces.
- **Anchor on top, always** (`layers(root)`: anchor on `L.top`, everything else on `L.base`).
  Everything in a shot lies on one plane, card flat on it, so the fit survives plane rotation.
- **Type sits on a line the composition already has**: the anchor's edge (shared with the
  beam's neck) or the beam's side. Left edges align with the anchor's left edge, or start a
  fixed gap (≈ 0.4 × anchor width) right of it on the same baseline. Lead words sit above
  the main line, left-aligned. A claim must fit in frame with a 5% margin.
- **Self-review before rendering**: lay each still beside its reference frame and check
  (1) beam attached to anchor, (2) content legible and whole, (3) type on a real line,
  (4) nothing cut by the frame that should not be, (5) the frame looks balanced. Fix, re-render
  stills, and only then render motion.

## The twelve frames

| # | Frame | What happens | Anchor | Beam shape and angles | Type | Recipe |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `9349` | Tiny product on black, top view, rotated about 30° | object alone, 1% of frame, centre | none | none | `iso-anchor` |
| 2 | `9350` | Title and window share one oblique plane; the product sits at the window's lower-left apex | at window apex (about 0.42, 0.60) | 8-gon, edges 26° / 149°, touches top frame edge | condensed words + expanded figure on the same plane, along the 26° edges | `type-slot` (`typeSlot()`) |
| 3 | `9351` | Same window, plane turned; the beam now leaves the anchor to the upper right | lower-left apex | 6-gon wedge, 9° and 52° sides, bleeds off top and right | none | `arrow-beam` |
| 4 | `9352` | Window fills half the frame, wedge narrowing toward lower right where the product is | lower-right apex | 9-gon, 62° and 129° cut, notched upper-left | none | `wedge` |
| 5 | `9353` | Internal cut: same wedge, new content, notch moves | lower-right apex | 12-gon, 67° / 136° | none | `wedge` (internal cut) |
| 6 | `9354` | V funnel: content above, product breaks out of the narrow bottom; claim underneath | product at the funnel neck, breaking out downward | 6-gon, 46° and 133° sides, top on frame edge | claim line under the anchor | `v-funnel` |
| 7 | `9356` | Mosaic of 3 windows, top-down shots; one tiny window holds the product | in our build: hard cuts, one beam per cut from a different edge | trapezoids at 61° / 118°, 0° bases | none | `looks` |
| 8 | `9357` | Mosaic re-cut: windows swap and shift | — | 60° trapezoids, notched corners | none | `looks` |
| 9 | `9358` | One window in the upper right corner, ragged lower-left edge where the subject breaks out | breakout at the lower-left corner | 8-gon, frame-aligned 0° / 90° | none | `corner-breakout` |
| 10 | `9359` | Wedge at the bottom, 45° top edge; type continues the edge past the apex | apex at the top of the 45° edge | 6-gon, 0° / 45° / 134° | rides the extended edge past the apex | `apex-claim` |
| 11 | `9360` | Next line of the same claim on the same diagonal, window now lower left | apex at the right | 4-gon, 0° / 46° | continues the diagonal | `apex-continue` |
| 12 | `9362` | Second V funnel, product breaks out of the bottom and lifts | product at the neck | 6-gon, 59° and 122° sides | none | `lift` |

## What each frame teaches

- **The anchor is always at the narrow end** (frames 2–6, 9–12). A window never floats with
  the subject in its middle.
- **Breakout:** the anchor overlaps the window edge by 10–40% of its own size, drawn above
  the window (frames 2, 6, 9, 12). With a light anchor the hot core sits on the edge.
- **Windows bleed:** 9 of 12 frames have a window touching a frame edge. The wide end
  leaves the frame; the narrow end stays in it.
- **Turning, not cutting, between frames 2 → 3 and 4 → 5:** the same beam rotates or
  re-cuts its content while the anchor stays put. Use `lerpPoly` or an internal cut.
- **Type follows the beam:** on the title plane (2), under the anchor (6), or along an edge
  extended past the apex (10, 11). It never sits in a free box.
- **Scale rhythm:** tiny (1) → wide (2–5) → medium with claim (6) → small multiples (7–8)
  → corner (9) → diagonal type (10–11) → hero (12). Copy the contrast between neighbours, not
  this order.

## Mapping to a new brief

1. Pick the anchor: the product if one exists, else a spotlight (`light`).
2. Pick the shots you need from the table above in the order your Film concept sets
   (`references/structures.md`). The table's order is the reference film's order, not a template.
   Keep its lesson, strong scale contrast between neighbours, not its sequence.
3. For each shot, place the anchor first, then draw the beam from it with `funnel()` or a
   traced polygon whose narrowest vertex is at the anchor.
4. Light the content from the anchor (`lit()`), then put type on the beam's edges.
5. Check the stills against the layout maps in `frames/` side by side before rendering motion
   (window shape, edge angles, where the anchor and the type sit).

`templates/film-anchor/` implements all twelve, plus the motion vocabulary below, as one
example film (Formwright, about 70 s), switchable with `?anchor=object|light`. For a new
product start from `templates/film-starter/`; film length follows the Timing table in SKILL.md.

## Motion vocabulary (beyond the twelve frames)

The twelve frames are stills. The reference also moves in these ways; each is implemented in
`templates/film-anchor/shots.js` and can be reused with new content.

| Move | What happens | Build (`templates/film-anchor/shots.js`) |
| --- | --- | --- |
| Opening shrink | The anchor fills the centre top-down, holds, then shrinks and tips to isometric | `iso-anchor`: `L.set({ rx: 0→52, rz: 0→-40, s: 3.4→1 })` |
| Type slot (frame 9350) | Take the type layout, keep the film's own anchor and beam. Two rows of giant metallic words (lead-in on top, condensed long word; lead-in on top, expanded figure) lie on one plane turned ≈ 30° and receding toward the start of the line. The anchor stands on the low row's cap line right after its lead-in; its beam rises from the anchor's top edge through the gap between the words and off the top edge; the high row's figure stands beside the anchor, just past the beam's leaning side. The face lies on the plane with the words (same perspective, edges parallel to the baselines); the beam's content stays upright. Words slide in along their baseline, the anchor pops in, the beam opens out of its edge, the camera creeps along the baseline | `typeSlot()` in `scripts/shots-lib.js`; recipes.md › type-slot |
| Deep title plane | A deep perspective plane (perspective 1800, rx ≈ 42) carries huge type and the beam; the anchor lies on the plane at the beam's apex | `title-beam`: `layers(root, { perspective: 1800 })` |
| Bloom (open → hold → retract) | **The anchor sits in the dead centre of the frame.** A beam opens out of it, holds on one feature, then retracts back into it; the next beam opens in a new direction (clockwise, counter-clockwise or the near way: `order`; vary it per film), at a new size, with a different feature. In object mode the anchor is a **folding object** that is the product itself: between beams the Formwright card is seen face up and upright (so the subject stays recognisable), then it turns edge-on onto the next axis and splits into two leaves on a hinge (like a laptop's lid and base seen edge-on): the hinge is the wedge's apex and the two leaves are its two edges, so the object holds the window open; folding it shut closes the window, and the card turns face up again and swings clockwise to the next direction. A beam leaving one edge of a flat card looks wrong from most angles; the fold does not. A claim line continues the flatter edge past the hinge, on the side away from the window (frames 9359/9360), and leaves with its beam; with a flat card on top of the hinge, start the claim past the card's corner (half its diagonal + ~30 px) or the card hides its first words. Edge-on, the open object is only two bars; the angled-lid variant (`lidFold()`, `?fold=lid`) keeps the card face visible while open: the card hinges on the flatter beam edge, tilts back (foreshortened, slightly darkened so the window wins) and always reads left to right, with a thin base on the other edge and a warm glow at the hinge. A flat subject need not be made 3D at all: the flat reveals keep the card face up and still in the centre and move only the window behind it. **Default: sweep (D).** Use trace (E) instead when the film is drawn in a line-art or light style, or when a sweeping edge would wipe across dense UI; extrude (C) reads as pasted on and is kept only for comparison. The three: extrude (the wedge grows out with a lit leading edge), sweep (the far edge sweeps open as a line of light; to close, the start edge sweeps after it the same way, so the window folds away at the far edge like a wiper instead of sweeping back), trace (two light lines draw out, then light fills between them). Once the subject is flat, keep it flat in every shot: no hinge lifts (`lift` is ignored under `?reveal=`); depth comes from the tilted ground plane, the type and the beams, and a shot whose point was the lift becomes a flat push-in. Do not simply rotate one beam around the anchor | `fold()`, `lidFold()`, `flatReveal()`, `bloom()` + `bloomFrame()`; `bloom-a`, `bloom-features`, `bloom-claim` |
| Frieze | A row of anchors alternating up/down, each with its own 60° beam; neighbours have parallel sides so they interlock with an even, generous gap (card ≈ 300 px wide, step ≈ 5× card width (1500), content ≈ 760 px; with gaps this wide use about four cards and a ~7 s pan); each grows in over 0.8 s just as the pan brings it inside the frame edge (`FRIEZE_T0`) | `frieze` |
| Depth of field | Inside a beam the content travels from far to near and pulls into focus while a softer layer behind it drifts slower | `v-depth`: panel `scale 0.5→1`, `blur 7→0`; back layer `blur 2→9` |
| Pull-back reveal | Start tight on one line of code typing with a caret, then pull all the way back: the code is the beam's content and the claim sits under the anchor | `code-pullback` with `editor()` (typing row fixed, `EDITOR.caret` geometry) |
| Full-frame claim | Content fills the frame; the claim lies on a deep plane (rx ≈ 52) over a dark bottom gradient and types itself in | `full-claim`, `typeIn()` (widths fixed so centred type does not shift) |
| Content only | No anchor: one big irregular window that bleeds off two or more frame edges, its content's edges faded into the stage, slow push (`contentOnly()`). Never a floating quadrilateral around a light photo: it reads as a crooked print | `content-only` |
| Full-frame insert | A plain full-frame cut of the product UI, slow push, between beam shots (`insert()`) | `full-insert` |

One example rhythm, the Formwright film (one of many; never the default, see
`references/structures.md`): opening shrink → deep title → bloom → depth → pull-back → full-frame
claim → bloom of features → frieze → content only → insert → bloom with claims → lift → title
→ brand. Keep the anchor centred (horizontally at least) in every beam shot; leave the centre
only for the deep title plane and the frieze. Keep at
most one full-frame shot in a row, so the anchor stays the film's subject.

**Pace.** First cuts always feel too fast. Write each shot in its own seconds, then play the
whole film slower with one factor (`runFilm({ pace })`, default 1.25; the Formwright example uses 1.4):
every hold, beam and typing beat stretches in proportion.

**Reading time.** A beam that shows an interface must stay fully open long enough to read:
about 1 s to find the point plus 1.5–2.5 s for 5–8 elements, so **hold 2.5–3.5 s fully open**
(2.5 s is usually enough, 3.5 s starts to feel long; a single figure needs only 1.5 s), and do not snap the beam: about
0.6 s to open and 0.5 s to sweep shut (≈ 4.3 s per feature). Slower than ~1 s each way drags;
faster than ~0.3 s reads as a cut. A claim needs about 0.3 s per word and never less than
2.5 s. Three seconds per feature in total is too fast.

**Match moves between shots.** The subject must not jump at a cut. Each shot starts with its
anchor where (and as big as) the previous shot left it, then glides to its own place over
about 1 s (`runFilm({ match })`, default 0.8 shot-seconds). The positions come from
`measure-pins.mjs`, which renders every shot's first and last frame and writes `pins.js`; run
it again after changing any layout. Shots whose own camera move is the transition (the code
pull-back) and shots without an anchor are skipped.
