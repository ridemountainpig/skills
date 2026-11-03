// Formwright — example film for the anchor/beam toolkit (scripts/anchor.js). One of two
// examples: see templates/film-starter/ for the smallest product-neutral starting point.
// ?anchor=light swaps the card for a hot core of light.
import { E, kf, prog, lerp, clamp, el, space, group, xf, polyWin, text, layers, ready } from '../sf/engine.js';
import {
  useFace, anchor, beam, shine, block, reveal, typeIn, bloom, bloomFrame, grow, drift, growIn, runFilm, R, LIGHT,
} from '../sf/anchor.js';
import { card, terminal, form, studio, studioEdit, editor, EDITOR } from './materials.js';
import { PINS } from './pins.js';

useFace(card(600, 760));

// Frieze: cards 1500 apart (twice the old 700), each appears as the pan brings it just inside
// the right edge of the frame (world x where screen x ≈ 1100 at s 0.78)
const FRIEZE_GAP = 1500, FRIEZE_PAN = [1900, -2300];
const FRIEZE_T0 = [0, 1, 2, 3].map((i) => Math.max(0.1 + i * 0.35, ((1100 - (i - 1.5) * FRIEZE_GAP - FRIEZE_PAN[0]) / (FRIEZE_PAN[1] - FRIEZE_PAN[0])) * 5));
const OFF = 1300; // far vertices go this far out so beams always bleed off frame

const shots = [
  // 9349 — the anchor alone, small, isometric, on black.
  {
    id: 'iso-anchor', start: 0, end: 2,
    setup(root) {
      const L = layers(root, { perspective: 2600 });
      return { L, a: anchor(L, { x: 0, y: 0, w: 200 }) };
    },
    // opening: the card fills the centre top-down, holds, then shrinks and tips to isometric
    frame(l, c) {
      c.a.draw(0);
      const p = prog(l, 0.45, 1.95, E.glide);
      L0(c.L, { rx: lerp(0, 52, p), rz: lerp(0, -40, p), s: lerp(3.4, 1, prog(l, 0.3, 1.95, E.glide)) });
      if (LIGHT) c.a.set({ s: lerp(0.6, 1, prog(l, 0, 0.8, E.snap)) });
    },
  },
  // 9350 — the title move: a deep perspective plane carries the beam and huge type;
  // the card lies on the plane at the beam's apex.
  {
    id: 'title-beam', start: 2, end: 4.5,
    setup(root) {
      const L = layers(root, { perspective: 1800 });
      const a = anchor(L, { x: -520, y: -40, w: 250 });
      const base = a.y + a.h / 2;
      const m = form('classic');
      const w = shine(L.base, a, m, { x: 520, y: -420, w: 900, m: 50 }, { plane: true }, 'title-beam (plane)');
      const t = block(L.base, [[['OPEN SOURCE', 'lead']], [['FORMWRIGHT', 'word']], [['FOR', 'lead'], ['AGENTS', 'fig']]],
        { x: a.x - a.w / 2, y: base + 50, size: 165, top: true, gap: 0.1 });
      return { L, a, m, w, t };
    },
    frame(l, c) {
      L0(c.L, { x: lerp(-10, 20, l / 2.5), y: lerp(-70, -100, l / 2.5), rz: 34, rx: 42, s: lerp(0.7, 0.73, l / 2.5) });
      growIn(c.w, l);
      drift(c.w, l, 2.5, -10, 4);
      c.m.draw(l + 1.2);
      c.a.draw(1.5);
      reveal(c.t.rows, l, 0.1);
    },
  },
  // Bloom: the card in the centre of the frame; beams open out of it one at a time, each in a
  // new direction and size with a different feature, and retract before the next opens.
  {
    id: 'bloom-a', start: 4.5, end: 13.9,
    setup(root) {
      const L = layers(root);
      const a = anchor(L, { x: 0, y: 0, w: 190 });
      const beats = bloom(L, a, [
        { m: form('classic'), at: [540, -250], w: 720, t0: 0, t1: 3 },
        { m: studioEdit(), at: [520, 270], w: 720, t0: 3.05, t1: 6.05 },
        { m: studio(), at: [-600, 40], w: 620, t0: 6.1, t1: 9.1 },
      ]);
      return { L, a, beats };
    },
    frame(l, c) {
      const rz = lerp(-4, 4, l / 9.4);
      bloomFrame(c.a, c.beats, l, { rz });
      c.a.draw(1.5);
      c.L.set({ rz, s: lerp(1, 1.03, l / 9.4) });
    },
  },
  // 9354 with depth: a V funnel out of the card's top edge, and inside it the content comes
  // from far to near with depth of field: the form travels toward camera and pulls into
  // focus while the dashboard behind it stays soft and drifts slower (parallax).
  {
    id: 'v-depth', start: 13.9, end: 15.9,
    setup(root) {
      const L = layers(root);
      const a = anchor(L, { x: 0, y: 190, w: 240 });
      const m = form('editorial'), bg = studio();
      const w = shine(L.base, a, m, { x: 0, y: -300, w: 520, m: 30 }, {}, 'v-depth');
      const inner = w.panel.parentNode;
      const pw = parseFloat(w.panel.style.width), cx = parseFloat(w.panel.style.left) + pw / 2, cy = parseFloat(w.panel.style.top) + pw * 9 / 32, bw = pw * 2.6;
      const back = el('div', null, { position: 'absolute', left: `${cx - bw / 2}px`, top: `${cy - bw * 9 / 32 + 60}px`, width: `${bw}px`, height: `${bw * 9 / 16}px`, transformOrigin: '50% 30%' });
      Object.assign(bg.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' });
      back.appendChild(bg.canvas);
      inner.insertBefore(back, w.panel);
      Object.assign(w.panel.style, { boxShadow: '0 40px 90px rgba(0,0,0,.55)', borderRadius: '10px', overflow: 'hidden', transformOrigin: '50% 50%' });
      const t = block(L.base, [[['ONE', 'word'], ['FORM', 'fig'], ['EVERY LOOK', 'word']]], { x: 0, y: a.y + a.h / 2 + 130, size: 100, align: 'center' });
      return { L, a, m, bg, w, back, t };
    },
    frame(l, c) {
      c.m.draw(1 + l * 1.3);
      c.bg.draw(2 + l);
      growIn(c.w, l, 0, 0.6);
      const p = prog(l, 0, 2, E.glide);
      // far → near: small and soft, then full size and sharp; the background softens as focus
      // moves forward and drifts less than the subject
      c.w.panel.style.transform = `translateY(${lerp(-70, 0, p)}px) scale(${lerp(0.5, 1, p)})`;
      c.w.panel.style.filter = `blur(${lerp(7, 0, prog(l, 0.2, 1.5, E.glide))}px)`;
      c.back.style.transform = `scale(${lerp(1.0, 1.12, p)})`;
      c.back.style.filter = `blur(${lerp(2, 9, p)}px) brightness(${lerp(0.9, 0.7, p)})`;
      c.a.draw(clamp(l - 0.4, 0, 2));
      c.t.pin.style.filter = `brightness(${lerp(0.08, 1, prog(l, 0.5, 1.4, E.glide))})`;
      L0(c.L, { s: lerp(1, 1.03, l / 9.4) });
    },
  },
  // Pull-back reveal: the film starts tight on one line of code typing itself, then pulls
  // all the way back to show that the code is the beam's content, cast by the anchor, with
  // the claim beneath.
  {
    id: 'code-pullback', start: 15.9, end: 18.9,
    setup(root) {
      const L = layers(root);
      const a = anchor(L, { x: 0, y: 250, w: 170 });
      const m = editor();
      const C = { x: 0, y: -290, w: 680, m: 10 };
      const w = shine(L.base, a, m, C, {}, 'code-pullback');
      const ch = (C.w * EDITOR.h) / EDITOR.w;
      const P = [C.x - C.w / 2 + ((EDITOR.x + 4 * EDITOR.indent + 520) / EDITOR.w) * C.w, C.y - ch / 2 + ((EDITOR.top + EDITOR.row * EDITOR.lh - 15) / EDITOR.h) * ch];
      const t = block(L.base, [[['FORMS', 'fig'], ['YOUR AGENT WRITES', 'word']]], { x: 0, y: 470, size: 92, align: 'center' });
      return { L, a, m, w, P, t };
    },
    frame(l, c) {
      c.m.draw(l);
      c.a.draw(1.5);
      const S0 = 4.6, p = prog(l, 0.9, 2.5, E.glide), sc = lerp(S0, 1, p), k = (sc - 1) / (S0 - 1);
      c.L.set({ x: -sc * c.P[0] * k, y: -sc * c.P[1] * k, s: sc });
      c.t.pin.style.opacity = prog(l, 2.0, 2.6, E.glide);
      reveal(c.t.rows, l, 2.0);
    },
  },
  // Full-frame content with the claim lying on a deep plane over it (the "11X" frame); the
  // claim types itself in.
  {
    id: 'full-claim', start: 18.9, end: 20.4,
    setup(root) {
      const m = terminal();
      const bgd = el('div', root, { position: 'absolute', inset: '0', transformOrigin: '20% 30%' });
      Object.assign(m.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
      bgd.appendChild(m.canvas);
      el('div', root, { position: 'absolute', inset: '0', background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.7) 55%, rgba(0,0,0,.95) 100%)' });
      const g = group(space(root, { perspective: 1400, oy: 70 }));
      const t = block(g, [[['ONE', 'lead'], ['COMMAND', 'fig'], ['TO START', 'word']]], { x: 0, y: 0, size: 150, align: 'center' });
      return { m, bgd, g, t };
    },
    frame(l, c) {
      c.m.draw(2 + l * 1.6);
      c.bgd.style.transform = `scale(${lerp(1.0, 1.06, l / 1.5)})`;
      xf(c.g, { y: lerp(330, 310, l / 1.5), rx: 52 });
      typeIn(c.t.rows, l, 0.15, 16);
    },
  },
  // Bloom, features: four beams, clockwise from upper left, each a different feature at a
  // different size: the agent writing the form, the live form, editing it, the responses.
  {
    id: 'bloom-features', start: 20.4, end: 32.85,
    setup(root) {
      const L = layers(root);
      const a = anchor(L, { x: 0, y: 0, w: 170 });
      const beats = bloom(L, a, [
        { m: form('terminal'), at: [-540, -230], w: 640, tone: 'cool', t0: 0, t1: 3 },
        { m: form('editorial'), at: [560, -210], w: 560, t0: 3.05, t1: 6.05 },
        { m: studioEdit(), at: [560, 270], w: 680, t0: 6.1, t1: 9.1 },
        { m: studio(), at: [-560, 250], w: 640, t0: 9.15, t1: 12.15 },
      ]);
      return { L, a, beats };
    },
    frame(l, c) {
      const rz = lerp(-6, 6, l / 12.45);
      bloomFrame(c.a, c.beats, l, { rz });
      c.a.draw(1.5);
      c.L.set({ rz });
    },
  },
  // Frieze: a row of cards, alternating up and down, each casting its own 60° beam; they come
  // on one by one while the view travels right. Neighbouring beams have parallel sides, so
  // the row interlocks with an even gap.
  {
    id: 'frieze', start: 32.85, end: 37.85,
    setup(root) {
      const L = layers(root, { perspective: 2400 });
      const themes = ['classic', 'terminal', 'editorial', 'conversational'];
      const k60 = Math.tan(R(30)), len = 1400;
      const items = themes.map((th, i) => {
        const up = i % 2 === 0, x = (i - 1.5) * FRIEZE_GAP, y = up ? 400 : -400;
        const a = anchor(L, { x, y, w: 300 });
        const side = up ? 'top' : 'bottom';
        a.side = side;
        const [n0, n1] = LIGHT ? [[x, y], [x, y]] : a.neck(side);
        const dy = up ? -len : len, dx = Math.abs(dy) * k60;
        const far = up ? [[n0[0] - dx, n0[1] + dy], [n1[0] + dx, n1[1] + dy]] : [[n0[0] + dx, n0[1] + dy], [n1[0] - dx, n1[1] + dy]];
        const m = form(th);
        const w = beam(L.base, a, side, far, m, { at: [x, up ? -430 : 430], w: 760, view: [-3000, -3000, 3000, 3000] }, { tone: th === 'terminal' ? 'cool' : 'warm' });
        return { a, m, w };
      });
      return { L, items };
    },
    frame(l, c) {
      c.L.set({ x: lerp(FRIEZE_PAN[0], FRIEZE_PAN[1], prog(l, 0, 5)), rx: 16, s: 0.78 });
      c.items.forEach(({ a, m, w }, i) => {
        const t0 = FRIEZE_T0[i], p = prog(l, t0, t0 + 0.6, E.snap);
        w.box.style.opacity = prog(l, t0 + 0.12, t0 + 0.45);
        growIn(w, l, t0 + 0.12, 0.8);
        m.draw(1 + l * 1.4 + i);
        a.draw(1.5);
        a.set({ s: lerp(0.001, 1, p) });
      });
    },
  },
  // Content only: no anchor, one big trapezoid window full of the product, a slow push.
  {
    id: 'content-only', start: 37.85, end: 38.85,
    setup(root) {
      const g = group(root);
      const m = studio();
      const box = el('div', null, { position: 'absolute', inset: '0', overflow: 'hidden', background: '#000' });
      const inner = el('div', box, { position: 'absolute', inset: '0', transformOrigin: '50% 45%' });
      Object.assign(m.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' });
      inner.appendChild(m.canvas);
      el('div', box, { position: 'absolute', inset: '0', background: 'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%)' });
      polyWin(g, [[-850, -580], [900, -580], [600, 580], [-560, 580]], box);
      return { m, inner };
    },
    frame(l, c) {
      c.m.draw(3 + l * 1.5);
      c.inner.style.transform = `scale(${lerp(1.0, 1.07, l)})`;
    },
  },
  // Full-frame insert: the form itself, typing its answers, a slow push in.
  {
    id: 'full-insert', start: 38.85, end: 39.85,
    setup(root) {
      const m = form('classic');
      const d = el('div', root, { position: 'absolute', inset: '0', transformOrigin: '50% 50%' });
      Object.assign(m.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
      d.appendChild(m.canvas);
      return { m, d };
    },
    frame(l, c) {
      c.m.draw(0.6 + l * 1.8);
      c.d.style.transform = `scale(${lerp(1.02, 1.1, l)})`;
    },
  },
  // Bloom with claims (9359 / 9360): each beam brings its line of the claim on its upper
  // edge, and takes it back in when it retracts.
  {
    id: 'bloom-claim', start: 39.85, end: 46.2,
    setup(root) {
      const L = layers(root);
      const a = anchor(L, { x: 0, y: 0, w: 180 });
      const beats = bloom(L, a, [
        { m: form('conversational'), at: [560, 60], w: 600, t0: 0, t1: 3, type: [[['ANY', 'word']], [['THEME', 'fig'], ['YOU WANT', 'word']]], size: 64 },
        { m: studio(), at: [-590, 70], w: 600, t0: 3.05, t1: 6.05, type: [[['AND THE', 'word']], [['RESPONSES', 'word'], ['YOU OWN', 'fig']]], size: 64 },
      ]);
      return { L, a, beats };
    },
    frame(l, c) {
      const rz = lerp(-3, 3, l / 6.35);
      bloomFrame(c.a, c.beats, l, { rz });
      c.a.draw(1.5);
      c.L.set({ rz });
    },
  },
  // 9362 — narrow V from the card's top edge; the card grows out of the neck.
  {
    id: 'lift', start: 46.2, end: 47.2,
    setup(root) {
      const L = layers(root);
      const a = anchor(L, { x: 0, y: 260, w: 240 });
      const m = studio();
      const w = shine(L.base, a, m, { x: 0, y: -320, w: 640 }, {}, 'lift');
      return { L, a, m, w };
    },
    frame(l, c) {
      c.m.draw(1 + l * 2);
      drift(c.w, l, 1, 0, -5);
      c.a.draw(1.5);
      const p = prog(l, 0.1, 0.9, E.snap);
      c.a.set({ s: lerp(0.9, 1.35, p) });
    },
  },
  // Frontal title hold: the same block as the opening, centred.
  {
    id: 'title-front', start: 47.2, end: 48.7,
    setup(root) {
      const g = group(root);
      const t = block(g, [[['OPEN SOURCE', 'lead']], [['FORMWRIGHT', 'word']], [['FOR', 'lead'], ['AGENTS', 'fig']]], { x: 0, y: -230, size: 170, align: 'center', top: true, gap: 0.1 });
      return { g };
    },
    frame(l, c) { xf(c.g, { s: lerp(1, 1.025, l / 1.5) }); },
  },
  // Brand hold: the anchor, small, above the name.
  {
    id: 'brand', start: 48.7, end: 51.2,
    setup(root) {
      const L = layers(root, { perspective: 2600 });
      const a = anchor(L, { x: 0, y: -80, w: 84 });
      el('div', L.base, { position: 'absolute', left: '0', top: '60px', transform: 'translate(-50%,-50%)', font: "700 64px 'Inter', sans-serif", color: '#f5f5f7', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }, { textContent: 'Formwright' });
      el('div', L.base, { position: 'absolute', left: '0', top: '128px', transform: 'translate(-50%,-50%)', font: "500 22px 'DejaVu Sans Mono', monospace", color: '#8d8d96', whiteSpace: 'nowrap' }, { textContent: '$ npm create formwright@latest' });
      el('div', root, { position: 'absolute', left: '0', right: '0', bottom: '70px', textAlign: 'center', font: "500 15px 'Inter', sans-serif", color: '#6e6e73' },
        { textContent: 'Formwright is a fictional product made for this template.' });
      return { a };
    },
    frame(l, c) {
      c.a.draw(1.5);
      if (!LIGHT) c.a.set({ rx: 30, rz: lerp(-6, -2, l / 2.5) });
    },
  },
];

// This example was timed by hand before the beat grid existed: its cuts are free-timed on purpose.
// A new film writes every duration as B(n) (SKILL.md › Timing) and leaves offbeat unset.
shots.forEach((s) => { s.offbeat = true; });

function L0(L, p) { L.set(p); }

runFilm({
  shots, duration: 51.2, pace: 1.4, pins: PINS
});
await ready([`800 80px 'Archivo Variable'`, `600 20px 'Inter'`, `500 20px 'Inter'`, `700 20px 'Inter'`]);
