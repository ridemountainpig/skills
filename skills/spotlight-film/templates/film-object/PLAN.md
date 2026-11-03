# Lumen 1 (template): physical product as a 3D anchor

**Product:** fictional phone "Lumen 1" (template only; every claim is illustrative and the legal line says so).
**Anchor:** `object`, the phone's back made solid with `slabObject()` and rendered by `productFace()`.
With a real product use its GLB (`loadGLB`), or its official back/front photo on alpha in `slabObject()`.
**Footage:** a stand-in test pattern (`assets/clip.webm`, see the comment at the top of `shots.js`).
**Tempo:** 120 bpm, pace 1.25; every duration is `B(n)` so `[review] grid` is OK.

Run: `node sf/render.mjs --root . --page film/film.html --stills 1,4,8,10 --outdir out/stills`
(copy this folder to `film/`, create `assets/clip.webm` first).

Write your own Film concept (plan-dice) before reusing any of this order.
