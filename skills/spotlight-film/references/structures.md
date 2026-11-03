# Structures: how a film is shaped

Read this after the brief and before the shot list. The core grammar (one anchor, beams from its
narrow end, black stage, type on lines, hard cuts, true claims) never changes; everything in this
file changes from film to film. `scripts/plan-dice.mjs` draws one value per axis; you may
override one draw with a reason. Every structure below uses the same toolkit
(`scripts/shots-lib.js`, `anchor.js`), so none needs new code except the signature moment.

Why this file exists: films that share one shot list, row for row ( shrink → title → bloom ×2 → V funnel → burst → bloom ×2 → inverted V →
content only → lift → brand, all with 2.5 s holds turning clockwise) let viewers predict the next
shot. Surprise comes from the order, the timing and one moment nobody else could have; the
look stays the same.

## Structures

| Structure | Shape | Fits | Watch out |
| --- | --- | --- | --- |
| `classic` | shrink → title plane → bloom → claim → burst → bloom with claims → claim → brand | a first film with evenly weighted features | the old default; never twice in a row |
| `cold-open` | the strongest proof or figure first, full frame or type alone; the anchor arrives in shot 2–3 as the answer ("this is what does it") | one headline number or feature | the first shot must read in ≤ 1.5 s |
| `one-take` | one continuous camera path (group travel) passes 4–5 beams around the anchor; content changes by internal cut; a single hard cut to the brand | features that follow from each other | keep travel velocity continuous; each beam still holds long enough to read |
| `call-response` | two themes alternate A / B / A / B (e.g. quiet / aware, day / night); beams mirror left / right; each round is shorter | a product with a built-in contrast | both themes need real evidence |
| `countdown` | features stack up while shots shrink 2.5 → 1.5 → 0.8 → 0.5 s, then one long still (hero or signature) | spec-heavy products | the fast end shows proof, not claims (claims need reading time) |
| `deep-dive` | one claim only, the same beam seen from 5–7 angles and scales, ending on the claim | launching one feature | vary family per shot (bloom, funnel, apex, insert) or it becomes a slab run |
| `two-act` | act 1 slow, large, few shots; a 0.5–1 s blackout; act 2 all fast cuts | a story with a turn ("and then…") | the blackout must land on a downbeat |

Mixing is allowed: name both and say which governs the order.

## Tempo curves

Plot the shot lengths before writing code; `variety-check.mjs --timeline` prints them.

| Tempo | Shot-length shape |
| --- | --- |
| `steady-build` | slowly shortening toward the end |
| `accelerate` | each act clearly faster than the last (e.g. 3 s → 1.5 s → 0.6 s shots) |
| `decelerate` | fast cuts first, long final holds |
| `breath` | fast – slow – fast; the slow middle holds one image ≥ 4 s |
| `stop-start` | runs of 0.5 s cuts broken by dead-still holds of 2–3 s |

Cuts follow the drawn bpm, so the film has a pulse without any music.

## Openings

| Opening | Build |
| --- | --- |
| `shrink` | `openShrink()` |
| `light-first` | black, a beam of light alone (`beam-without-content`), then the anchor appears at its narrow end |
| `macro-pullback` | `macroPull({ P })` from a detail of the face (camera ring, logo, a UI control) out to a speck |
| `type-first` | `typeCard()` with the name or the hero figure, the anchor cuts in under it |
| `type-slot` | `typeSlot()`: the name and the figure fill the frame on a diagonal plane, the anchor stands on the type and its first beam opens between the words (also works as the title after a cold open) |
| `cold-proof` | `burst()` or `insert()` before anything else |

## Closings

| Closing | Build |
| --- | --- |
| `small-name` | `brand({ style: 'small-name' })` |
| `retract-all` | a reprise: `retractAll()` reopens 3–4 of the film's beams one after another, each opening (≈ 0.25 s), held long enough to recognise its content and shutting (≈ 0.2 s), at least 1.2 shot-seconds (≈ 1.7 s on screen) per beam, then the name. Never 0.2 s flashes: under ~0.3 s each way a beam reads as a glitch, not a reprise |
| `beam-to-mark` | the last beam narrows until only the name (or mark) is left on its line |
| `black-line` | `brand({ style: 'black-line', line })`: one sentence on black, then legal |
| `hero-hold` | `heroHold()` large and still, the name beside it, then the promise (`line`) and the install or buy line (`cta`) arriving during the hold; with `legal` it is the end card (no separate `brand`). An icon and a name alone for 4 s says nothing |

## Bloom order and link

- Order: the way successive beats' directions (`at`) move around the anchor: `cw`, `ccw`, `near`
  (each next beam the shorter way from the last), or `mirror` (beats on alternating sides). Different bloom shots in one film may use different orders.
- Link: `return` (shut, face up, turn), `chain` (next beat's `t0` before the last beat's `t1`, no
  face-up pause), `interrupt` (`shut: 0` on a beat: a hard cut takes it mid-hold).
- Hold per beat from content density: a single number 1.5 s, a dense UI 3–3.5 s. Do not give
  every beat the same hold.

## Rule breaks (exactly one per film, in or near the signature moment)

`two-beams-once`, `anchor-off-centre-once`, `one-dissolve`, `giant-anchor` (half the frame or more; the match move glides the size back at the next cut and
erases the jump, so render with `--query nomatch` when size contrast is the point),
`anchor-late` (not seen until the second third), `beam-without-content` (pure light). Name it in
PLAN.md. A second break is drift.

## Signature moments

One shot that would make no sense for another product. Start from the product's most
distinctive look or feature and ask how the beam, the anchor or the cut could *be* that feature.

| Product trait | Signature moment |
| --- | --- |
| A phone with a 489-LED matrix on the back | the beam is built from exactly 489 dots that light outward from the phone while a counter climbs to 489 |
| A phone with a transparent back | the beam passes *through* the phone and leaves from the other side, showing the internals in silhouette |
| Earbuds: case lid, noise cancelling | the lid opening is the beam's hinge; for ANC the frame goes empty and still for one second |
| A form builder | the beam's edges are drawn by the form's own field outlines before the content fills it |
| A battery claim | a beam that drains: its far edge sweeps shut slowly over the whole shot while the figure holds |

Write it as a custom shot in `film/shots.js`; it should not come from the library. If the
moment rests on a number (489 dots), check it in code (a beam too small for the dots stops the counter short); print a `[review] … FIX` line when it falls short.

## Before you write the shot list, check

1. The family sequence differs from the last film in `film-log.md` by ≥ 50% and shares no run
   of 3.
2. The tempo curve is visible in the planned lengths.
3. The signature moment is in the plan, with its rule break.
4. Every claim still has its evidence and reading time.
