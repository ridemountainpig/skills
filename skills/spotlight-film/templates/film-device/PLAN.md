# Keyline (template): a phone app on 3D devices, two acts

**Product:** Keyline 2.0, a fictional keyboard app for phone and tablet (template only; every claim
is illustrative and the legal line says so). With a real product, every claim comes from its
changelog, docs or launch post, and each is shown with a real screenshot or clip.
**Anchor:** `object`, a phone built in three.js (`device3d.js`: rounded metal body, black glass,
camera cut-out) with the app's screen on it. The signature swaps to a second face holding the
phone and a tablet (`pair()`), the case in SKILL.md §0.6.
**Assets:** none. Screens and beam cards are authored canvases in `materials.js` (`card(kind)`
animates by `t`, so a beam holds something that moves). Replace them with the user's screenshots
(on the devices: `fitScreen(img, …)`) and clips (`footage()`).

Run (copy this folder to `film/`):
`node sf/render.mjs --root . --page film/film.html --stills 2,7,12,20,25.5,32,38.5 --outdir out/stills`

## Film concept (an example; draw your own with plan-dice)

| Axis | Draw |
| --- | --- |
| structure | two-act |
| tempo | accelerate |
| opening | type-slot |
| closing | small-name (the name set in type; a real brand ends on its official logo, SKILL.md §0.8) |
| bloomOrder | near |
| bloomLink | interrupt |
| bpm | 120 |
| pace | 1.2 |
| ruleBreak | two-beams-once |

**Concept:** act 1 is one phone, slow: the keyboard does what a keyboard does (type, fix, expand),
then the tablet joins it. The blackout is the hinge between the acts. Act 2 is everything else at
once, in fast cuts.
**Signature moment:** the phone alone, close; the tablet rises behind it as the camera pulls back,
and the film's only two-beam frame opens from the pair's two sides: the phone keyboard on one
side, the full-size tablet keyboard on the other: "PHONE AND TABLET". Rule break: two-beams-once.

## Shot list (B = one beat = 0.5 s on screen)

| # | Film s | Family | Content | Beats |
| --- | --- | --- | --- | --- |
| 1 | 0–5 | slot | MEET YOUR NEW KEYBOARD / KEYLINE 2.0, the phone on the type, beam to dictation | 10 |
| 2 | 5–18 | bloom ×3 | autocorrect · one-tap fix · snippet (the last one cut away, interrupt); claims beside the phone (`tat`) | 26 |
| 3 | 18–24 | sig | the tablet rises behind the phone, two beams: phone keyboard / tablet keyboard | 12 |
| 4 | 24–24.5 | black | an empty frame between the acts | 1 |
| 5 | 24.5–29.5 | burst | DICTATION · EMOJI SEARCH · GIFS · YOUR ACTION ROW, full frame with captions | 10 |
| 6 | 29.5–35.5 | bloom ×3 | 5 THEMES · 7 LAYOUTS · CUSTOM KEYS, each cut away by the next | 12 |
| 7 | 35.5–39.5 | brand | Keyline, the product line, the promise, one legal line | 8 |

Families: `slot bloom bloom bloom sig black burst bloom bloom bloom brand`.

## What this template shows

- A tall anchor (an upright phone) with claims set beside it (`tat`) instead of along the beam edge.
- Dark UI on the dark stage: `THEME.beamGlow` / `beamReach` raised so the beams do not read as black holes.
- Two faces in one film: `useFace()` measures the pair for the signature's necks, then hands the film its phone face back; the signature is not pinned (`pins.js`).
- A captioned burst built on `burst()`, and an end card built by hand.
