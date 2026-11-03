# Review gates

Run on the preview and on the final file with `sf/review.sh video out/film.mp4 out/timeline.json`.
Claude reviews **stills**: contact sheet, cut pairs, per-shot strips, motion.txt.
State that playback itself was not watched.

## Loop

1. Look at the evidence. Say what the frames communicate without reading the plan.
2. List material defects: time, evidence file, effect on the viewer, concrete fix.
3. Fix within scope, re-render the affected stills/shots, re-check neighbours.
4. Stop after two loops without visible improvement on one issue: change approach or report
   the real constraint (missing footage, no 3D model).

## Gates

| Gate | Pass when |
| --- | --- |
| 1 Contact sheet | Families, scale, luminance and type role visibly vary; no run of look-alike slabs; no unexplained repeated holds |
| 1b Reference | At equivalent roles the reference's defining relationships (anchor + beam at varied angles, oblique title plane, type on beam edges, scale extremes, at least one full-frame proof; a mosaic only if the brief has several parallel items) are present. Name the strongest remaining difference per comparison |
| 2 Product proof | Every claim has visible evidence; source type (capture / authored state / footage / procedural) is reported honestly |
| 3 Boundaries | Cut pairs show clean atomic cuts (no dissolve, no stale frame); travel strips show coherent direction and spacing |
| 4 Typography | No `[review] type FIX` or `type off-frame FIX` lines; one message per beat; readable on the contact sheet tile (≈ 320 px wide, the size of a phone feed); no clipping, no type overlapping the anchor |
| 5 Motion & rhythm | `[review] grid OK` (every cut on the tempo grid, or the shot marked `offbeat`); motion.txt shows bursts and holds alternating; no shot is a flat line except intentional holds; easing matches presets; no `bloom N timing FIX` (every beam visibly opens, holds and shuts; check the retract-all strip especially); in a beam still zoomed at the anchor the light leaves from under the face's visible edge with no dark gap |
| 6 Style drift | None of the drift warnings in `style.md` |
| 7 Render | Edges clean at 1080p, no flashes or missing layers, footage moves (two stills 0.5 s apart inside one footage shot differ), legal hold ≥ 2.5 s |
| 8 Variety | `variety-check.mjs` prints OK: family sequence ≥ 50% different from the last film in `film-log.md` with no shared run of 3; at least one shot ≤ 0.8 s and one ≥ 4 s; ≤ 2 neighbours within 10% length; the length plot matches the tempo curve in PLAN.md. **Guess test:** render one still per visual unit (each bloom beat and each burst cut counts as one), give a fresh subagent (no PLAN.md) the last film's contact sheet as "seen before", then the stills one at a time, predicting each before reading it; more than 30% right fails. The signature moment is visible on the contact sheet and would not work for another product |

## Report

Separate verdicts: implementation · product truth · narrative clarity · reference fidelity ·
variety. Append the film's row to `film-log.md`. Then strongest/weakest shot, corrections made (with evidence), and remaining gaps with
the constraint behind each.
