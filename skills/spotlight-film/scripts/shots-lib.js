// Shot library: each function returns one shot ({ id, dur, setup, frame }) built on anchor.js.
// There is no film order in here on purpose. Choose the order, lengths and moves per film from
// PLAN.md › Film concept (references/structures.md), then lay the shots out with seq().
// Shot times are shot-seconds; runFilm() stretches them by `pace`.
import { E, prog, lerp, clamp, el, layers, group, polyWin, text, THEME, lc, lightOf } from './engine.js';
import { anchor, shine, block, reveal, bloom, bloomFrame, drift, growIn, STYLE, MIN_TYPE, faceMat } from './anchor.js';

// lay shots end to end: seq([a, b, c]) → shots with start/end
export function seq(list) {
  let t = 0;
  return list.map((s) => { const o = { ...s, start: t, end: t + s.dur }; t += s.dur; return o; });
}
// a full-frame layer holding one material
export function full(parent, m, origin = '50% 50%') {
  const d = el('div', parent, { position: 'absolute', inset: '0', transformOrigin: origin, display: 'none' });
  Object.assign(m.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
  d.appendChild(m.canvas);
  return d;
}
const brighten = (n, l, t0 = 0.4, t1 = 1.4) => { n.style.filter = `brightness(${lerp(0.08, 1, prog(l, t0, t1, E.glide))})`; };

// opening: the anchor fills the centre top-down, then shrinks and tips to isometric
export const openShrink = ({ id = 'open', dur = 2, w = 180, s0 = 3.2, face = 0 } = {}) => ({
  id, dur,
  setup(root) { const L = layers(root, { perspective: 2600 }); return { L, a: anchor(L, { x: 0, y: 0, w }) }; },
  frame(l, c) {
    c.a.draw(face + l);
    const p = prog(l, dur * 0.22, dur * 0.97, E.glide);
    c.L.set({ rx: lerp(0, 52, p), rz: lerp(0, 30, p), s: lerp(s0, 1, prog(l, dur * 0.15, dur * 0.97, E.glide)) });
  },
});

// opening: start on a macro detail of the anchor (point P in anchor px), pull back to a speck
export const macroPull = ({ id = 'macro', dur = 3, w = 180, P = [0, 0], s0 = 9, s1 = 0.35, face = 0 } = {}) => ({
  id, dur,
  setup(root) { const L = layers(root, { perspective: 2600 }); return { L, a: anchor(L, { x: 0, y: 0, w }) }; },
  frame(l, c) {
    c.a.draw(face + l);
    const s = Math.exp(lerp(Math.log(s0), Math.log(s1), prog(l, 0.3, dur, E.glide)));
    c.L.set({ x: -P[0] * s, y: -P[1] * s, s });
  },
});

// type alone on black: a figure or the name; brightens or slides in
export const typeCard = ({ id = 'type', dur = 1.5, lines, size = 220, y = size * 0.36, slide = false } = {}) => ({
  id, dur,
  setup(root) { const L = layers(root); return { L, t: block(L.base, lines, { x: 0, y, size, align: 'center' }) }; },
  frame(l, c) { if (slide) reveal(c.t.rows, l, 0.05); else brighten(c.t.pin, l, 0, 0.6); c.L.set({ s: lerp(1, 1.04, l / dur) }); },
});

// deep title plane: anchor at the lower-left apex, beam to the content, type on the plane
export const titlePlane = ({ id = 'title', dur = 2.5, m, lines, w = 230, size = 170, rz = 30, face = 0 } = {}) => ({
  id, dur,
  setup(root) {
    const L = layers(root, { perspective: 1800 });
    const a = anchor(L, { x: -470, y: 60, w });
    const mm = m();
    const bw = shine(L.base, a, mm, { x: 430, y: -330, w: 820, m: 40 }, { plane: true }, `${id} (plane)`);
    const t = block(L.base, lines, { x: a.x - a.w / 2, y: a.y + a.h / 2 + 46, size, top: true, gap: 0.1 });
    return { L, a, m: mm, w: bw, t };
  },
  frame(l, c) {
    c.L.set({ x: lerp(30, 0, l / dur), y: -60, rz, rx: 40, s: lerp(0.72, 0.75, l / dur) });
    growIn(c.w, l, 0.05, 0.6); drift(c.w, l, dur, -10, 4);
    c.m.draw(l * 1.4); c.a.draw(face + l); reveal(c.t.rows, l, 0.15);
  },
});

// bloom: centred anchor, one beam per beat. beats as in anchor.js bloom() but with materials as
// factories (place their `at` in the drawn bloom order); per beat open / shut / dir (shut: 0 = cut away mid-hold)
export const bloomShot = ({ id = 'bloom', beats, w = 170, rz = [-3, 3], face = 0, dur = Math.max(...beats.map((b) => b.t1)) } = {}) => ({
  id, dur,
  setup(root) {
    const L = layers(root);
    const a = anchor(L, { x: 0, y: 0, w });
    return { L, a, beats: bloom(L, a, beats.map((b) => ({ ...b, m: b.m() }))) };
  },
  frame(l, c) {
    const r = lerp(rz[0], rz[1], l / dur);
    bloomFrame(c.a, c.beats, l, { rz: r }); c.a.draw(face + l); c.L.set({ rz: r });
  },
});

// retract-all closing: a reprise of earlier beams around the centred anchor. Each beam gets `per`
// shot-seconds: it opens (open), is held fully open so its content is recognised, and shuts (shut).
// 0.2 s flashes per beam read as a flicker; keep
// per ≥ 1.2 (bloom() prints [review] bloom N timing FIX when a beat is too short) and use 3–4 beams.
export const retractAll = ({ id = 'retract', beats, per = 1.35, open = 0.24, shut = 0.2, ...o } = {}) =>
  bloomShot({ id, ...o, beats: beats.map((b, i) => ({ ...b, t0: i * per, t1: (i + 1) * per - 0.02, open, shut })) });

// V funnel: dir 'up' = beam up out of the anchor's top edge, claim beneath; 'down' = inverted
export const funnel = ({ id = 'funnel', dur = 2.5, m, lines, dir = 'up', w = 220, cw = 520, size = 90, face = 0, push = 0.04 } = {}) => ({
  id, dur,
  setup(root) {
    const L = layers(root), up = dir === 'up';
    const a = anchor(L, { x: 0, y: up ? 170 : -150, w });
    const mm = m();
    const bw = shine(L.base, a, mm, { x: 0, y: up ? -330 : 350, w: cw, m: 24 }, {}, id, [[0, up ? 440 : -440]]);
    // the claim hangs from a line under the anchor (up) or stands on a line above it (down), so a
    // two-line claim grows away from the anchor instead of into it
    const t = lines ? block(L.base, lines, { x: 0, y: up ? a.y + a.h / 2 + 50 : a.y - a.h / 2 - 60, size, align: 'center', top: up }) : null;
    return { L, a, m: mm, w: bw, t };
  },
  frame(l, c) {
    c.m.draw(1 + l); growIn(c.w, l, 0, 0.6); c.a.draw(face + l); c.L.set({ s: lerp(1, 1 + push, l / dur) });
    if (c.t) brighten(c.t.pin, l);
  },
});

// full-frame proof burst: hard cuts of `cut` s each (a number or a list), slight fixed crop
export const burst = ({ id = 'burst', mats, cut = 0.5, crop = [1.04, 1.08] } = {}) => {
  const cuts = Array.isArray(cut) ? cut : mats.map(() => cut);
  const at = cuts.map((_, i) => cuts.slice(0, i).reduce((s, x) => s + x, 0));
  return {
    id, dur: cuts.reduce((s, x) => s + x, 0),
    setup(root) { const ms = mats.map((f) => f()); return { ms, ds: ms.map((m) => full(root, m)) }; },
    frame(l, c) {
      let k = at.findLastIndex((t) => l >= t); if (k < 0) k = 0;
      c.ds.forEach((d, i) => { d.style.display = i === k ? 'block' : 'none'; });
      c.ms[k].draw(2 + (l - at[k]) * 2);
      c.ds[k].style.transform = `scale(${lerp(crop[0], crop[1], (l - at[k]) / cuts[k])})`;
    },
  };
};

// full-frame insert: a plain full-frame cut of the content, slow push. (A floating
// trapezoid here reads as a crooked print with a light photo, so the default is
// the full frame. For a window with no anchor use contentOnly().)
export const insert = ({ id = 'insert', dur = 1, m, poly = [[-960, -540], [960, -540], [960, 540], [-960, 540]], push = 0.07 } = {}) => ({
  id, dur,
  setup(root) {
    const g = group(root), mm = m();
    const box = el('div', null, { position: 'absolute', inset: '0', overflow: 'hidden', background: THEME.bg });
    const inner = el('div', box, { position: 'absolute', inset: '0', transformOrigin: '50% 45%' });
    Object.assign(mm.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
    inner.appendChild(mm.canvas);
    polyWin(g, poly, box);
    return { m: mm, inner };
  },
  frame(l, c) { c.m.draw(2.5 + l); c.inner.style.transform = `scale(${lerp(1, 1 + push, l / dur)})`; },
});

// content only (frames 9356–9358): no anchor, one big irregular window that BLEEDS off at least
// two frame edges, so it reads as a cut-out of light, not a photo pinned to the stage. Its
// content must contrast with the stage: a light photo on the dark stage (or a dark one on the
// light stage) whose edges are not faded into the stage colour prints [review] only FIX.
export const contentOnly = ({ id = 'only', dur = 1, m, poly = [[-1000, -600], [760, -600], [420, 600], [-1000, 600]], push = 0.06 } = {}) => {
  const s = insert({ id, dur, m, poly, push });
  const setup = s.setup;
  s.setup = (root) => {
    const c = setup(root); c.m.draw(0);
    const cv = c.m.canvas, px = cv.getContext('2d').getImageData(3, 3, 1, 1).data;
    const lum = (0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2]) / 255;
    const off = poly.filter(([x, y]) => Math.abs(x) >= 960 || Math.abs(y) >= 540).length;
    const clash = THEME.name === 'dark' ? lum > 0.45 : lum < 0.35;
    console.log(`[review] only ${clash || off < 2 ? 'FIX' : 'OK '} {"edgeLum":${lum.toFixed(2)},"bleedVertices":${off}}${clash ? ' fade the content edges into THEME.edge' : ''}${off < 2 ? ' let the window bleed off two frame edges' : ''}`);
    return c;
  };
  return s;
};

// black frame: a held breath between acts.
export const blackout = ({ id = 'black', dur = 0.75 } = {}) => ({ id, dur, setup() { return {}; }, frame() {} });

// hero hold: the anchor large and still (giant-anchor) beside the name. A still that only shows the
// icon and its name says nothing for seconds and then repeats in the brand shot, so the hold must
// carry the film's last word: `line` (the main promise, verbatim) and/or `cta` (the install or
// buy line, set in mono). With `legal` it IS the end card (skip brand()). Prints [review] hero FIX
// when it carries neither, or when it holds over 2.5 shot-s with nothing new arriving.
export const heroHold = ({ id = 'hero', dur = 2.5, w = 420, name, line, cta, legal, face = 0 } = {}) => ({
  id, dur,
  setup(root) {
    const L = layers(root, { perspective: 2600 });
    const a = anchor(L, { x: name ? -330 : 0, y: 0, w });
    const t = name ? block(L.base, name, { x: -330 + w / 2 + 70, y: line || cta ? -40 : 0, size: 150 }) : null;
    const tx = -330 + w / 2 + 74;
    const ln = line ? el('div', L.base, { position: 'absolute', left: `${tx}px`, top: '40px', font: "600 44px 'Inter', sans-serif", color: THEME.ink, letterSpacing: '-0.01em', whiteSpace: 'nowrap', opacity: 0 }, { textContent: line }) : null;
    const ct = cta ? el('div', L.base, { position: 'absolute', left: `${tx}px`, top: line ? '112px' : '40px', font: "500 32px ui-monospace, 'SF Mono', Menlo, monospace", color: THEME.muted, whiteSpace: 'nowrap', opacity: 0 }, { textContent: cta }) : null;
    if (legal) el('div', root, { position: 'absolute', left: '0', right: '0', bottom: '60px', textAlign: 'center', font: "500 15px 'Inter', sans-serif", color: THEME.muted, lineHeight: '1.6' }, { innerHTML: legal });
    const bad = !line && !cta ? 'carries no line or cta: the hold says nothing' : dur > 2.5 && !(line && cta) ? `holds ${dur.toFixed(2)} shot-s with one element: shorten it or add line + cta` : '';
    console.log(`[review] hero ${bad ? 'FIX ' + bad : 'OK'}`);
    return { L, a, t, ln, ct };
  },
  frame(l, c) {
    c.a.draw(face + l); c.L.set({ s: lerp(1.04, 1, prog(l, 0, dur, E.glide)) });
    if (c.t) reveal(c.t.rows, l, 0.2);
    if (c.ln) c.ln.style.opacity = prog(l, 0.55, 0.85, E.glide);
    if (c.ct) c.ct.style.opacity = prog(l, 0.95, 1.25, E.glide);
  },
});

// brand: style 'small-name' (small anchor + name) or 'black-line' (one line on black, no anchor)
export const brand = ({ id = 'brand', dur = 2.5, name, legal = '', style = 'small-name', line, w = 90, face = 0 } = {}) => ({
  id, dur,
  setup(root) {
    const L = layers(root, { perspective: 2600 });
    const a = style === 'small-name' ? anchor(L, { x: 0, y: -90, w }) : null;
    const t = el('div', L.base, { position: 'absolute', left: '0', top: style === 'small-name' ? '50px' : '0', transform: 'translate(-50%,-50%)', font: "700 64px 'Inter', sans-serif", color: THEME.ink, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }, { textContent: style === 'small-name' ? name : (line || name) });
    el('div', root, { position: 'absolute', left: '0', right: '0', bottom: '70px', textAlign: 'center', font: "500 15px 'Inter', sans-serif", color: THEME.muted, lineHeight: '1.6' }, { innerHTML: legal });
    return { L, a, t };
  },
  frame(l, c) { if (c.a) c.a.draw(face + l); else c.t.style.opacity = prog(l, 0.1, 0.6, E.glide); c.L.set({ s: lerp(1, 1.03, l / dur) }); },
});

// ---------- type slot (frame 9350: the type layout, built with the film's own anchor and beam) ----------
// The anchor and its beam stay exactly as in every other shot: the face sits on the stage and one
// beam of content leaves its edge, lit from it. What 9350 adds is the TYPE: giant metallic words
// on one plane turned diagonally across the frame, laid out AROUND the anchor and its beam:
//   - the low row (lead-in on top + a long condensed word) runs under the anchor,
//   - the anchor stands on that row's cap line, right after the lead-in,
//   - the beam rises out of the anchor's top edge and leans out, up and off the top of the frame,
//   - the high row (lead-in + figure) starts beside the anchor, just past the beam's leaning side.
// So the words, the anchor and the beam fit together like one puzzle; the beam is the gap the
// words leave. Only the outlines live on the plane: the anchor face and the beam's content stay
// upright and legible in screen space.
//   low:  rows of the long row, e.g. [[['NEW', 'lead']], [['TEMPO 2', 'word']]]
//   high: rows of the short row, e.g. [[['WITH', 'lead']], [['24H', 'fig']]]
//   m: the beam's content (a UI material, or footage); fill 'beam' (default: the film's beam look,
//   sampled background, hot from the anchor) or 'footage' (upright footage covering the beam)
//   size: cap size of the plane type; rz: baseline angle (28–36°); ry: depth (start far, end near)
//   neck: anchor width in units of size; lean: how far the beam's right side leans out per px
// Prints [review] slot: beamShare of the frame (0.15–0.35), typeSpan (≥ 0.55 of the frame width),
// bleedTop (the beam leaves the top edge) and the content's on-screen width.
const squeezeOf = (() => {
  let k = null; // the stand-in font has no wdth axis: fake the width with scaleX (see SKILL.md §1)
  return (wdth) => {
    if (k === null) {
      const probe = (w) => { const n = text(document.body, 'MMMMMM', { size: 100, wdth: w, fill: 'solid' }); const r = n.offsetWidth; n.remove(); return r; };
      k = probe(62) / probe(100) > 0.97;
    }
    return k && wdth < 100 ? wdth / 100 + 0.02 : 1;
  };
})();
function planeWord(parent, s, kind, size, x, y) {
  const st = STYLE[kind](size);
  const n = text(parent, s, st), q = squeezeOf(st.wdth);
  Object.assign(n.style, { left: `${x}px`, top: `${y}px`, transformOrigin: '0 100%', transform: `translate(0,-100%) scaleX(${q})` });
  // corners of the glyph box (cap line to baseline), to check the word stays inside the frame
  const H = n.offsetHeight, cap = st.size * 0.72;
  const corners = [[0, H - cap], [n.offsetWidth, H - cap], [n.offsetWidth, H], [0, H]].map(([cx, cy]) => el('div', n, { position: 'absolute', left: `${cx}px`, top: `${cy}px`, width: '1px', height: '1px' }));
  return { n, w: n.offsetWidth * q, h: cap, x, y, q, corners };
}
const mark = (parent, [x, y]) => el('div', parent, { position: 'absolute', left: `${x}px`, top: `${y}px`, width: '1px', height: '1px' });
export const typeSlot = ({
  id = 'slot', dur = 4.5, m, low, high, size = 240, rz = 30, ry = -22, rx = 6, s0 = 1.06, s1 = 1, travel = 140,
  pin = [0.48, 0.44], along = 0.55, at = [0, 0], gut = 0.16, neck = 0.85, lean = 1.25, leanL = 0.45, fill = 'beam', tone = 'warm', cw = 0.6, face = 0, sweep = [0.55, 1.3], highScale = 1, enter = 'pop',
} = {}) => ({
  id, dur,
  setup(root) {
    const space = el('div', root, { position: 'absolute', inset: '0', perspective: '1500px', overflow: 'hidden' });
    const plane = el('div', space, { position: 'absolute', left: '960px', top: '540px', width: '0', height: '0', transformStyle: 'preserve-3d' });
    // falloff along the plane: the far start of the line is dim, the near end bright
    const fall = 'linear-gradient(90deg, rgba(0,0,0,.3) 40%, #000 60%)';
    const sheet = el('div', plane, { position: 'absolute', left: '-3000px', top: '-2000px', width: '6000px', height: '4000px', maskImage: fall, webkitMaskImage: fall });
    const g = size * gut;
    // low row: the long word, its lead-in on top at its start
    const lw = planeWord(sheet, low[1][0][0], low[1][0][1], size, 3000 - size * 3.2, 2000 + size * 1.2);
    const ll = planeWord(sheet, low[0][0][0], low[0][0][1], size, lw.x + 6, lw.y - lw.h - g * 0.9);
    // the anchor stands on the low row's cap line right after the lead-in; the beam leaves its
    // top edge (a little inside it, so the light comes from under the face) and leans out
    const A = size * neck, y0 = lw.y - lw.h - g, x0 = Math.max(ll.x + ll.w + g * 2.2, lw.x + lw.w * along - A / 2), x1 = x0 + A;
    // a face that is not square (a phone standing upright) keeps its own aspect: FAR = height / width
    const FAR = faceMat().canvas.height / faceMat().canvas.width;
    const yN = y0 - A * FAR * 0.9, H = size * 8, r = A * 0.08;
    const beamPts = [[x0 + r, yN], [x1 - r, yN], [x1 - r + H * lean, yN - H], [x0 + r - H * leanL, yN - H]];
    const edge = (y) => x1 + Math.max(0, yN - y) * lean + g; // first free x right of anchor + beam at height y
    // high row: the figure stands beside the anchor on the same line, its lead-in above it,
    // both starting just past the beam's leaning side
    const fs = size * highScale;
    const hw = planeWord(sheet, high[1][0][0], high[1][0][1], fs, 0, y0);
    hw.x = edge(y0 - hw.h * 0.75); hw.n.style.left = `${hw.x}px`;
    const yl = y0 - hw.h - g * 0.9;
    const hl = planeWord(sheet, high[0][0][0], high[0][0][1], fs, 0, yl);
    hl.x = edge(yl - STYLE.lead(fs).size * 0.72) + g * 0.3; hl.n.style.left = `${hl.x}px`;
    const words = [ll, lw, hl, hw];
    const marks = beamPts.map((q) => mark(sheet, q));
    // the beam lives in screen space so its content stays upright
    const mm = m();
    const win = el('div', root, { position: 'absolute', inset: '0', overflow: 'hidden' });
    const box = el('div', win, { position: 'absolute', inset: '0', background: THEME.bg });
    const panel = el('div', box, { position: 'absolute' });
    Object.assign(mm.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
    panel.appendChild(mm.canvas);
    mm.draw(0);
    const cv = mm.canvas, px = cv.getContext('2d').getImageData(3, cv.height - 3, 1, 1).data;
    const lum = (0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2]) / 255, k = lum > 0.55 ? THEME.beamDim : 1;
    if (fill === 'beam') box.style.background = `rgb(${px[0] * k},${px[1] * k},${px[2] * k})`;
    const hot = el('div', box, { position: 'absolute', inset: '0', mixBlendMode: 'screen' });
    const shade = el('div', box, { position: 'absolute', inset: '0' });
    if (fill === 'beam') box.appendChild(panel); // the UI as a crisp card on top of the light (see beam())
    // the sweep's leading edge: a thin line of light
    const edgeLine = el('div', root, { position: 'absolute', height: '3px', marginTop: '-1.5px', transformOrigin: '0 50%', mixBlendMode: 'screen',
      background: `linear-gradient(90deg, rgba(${lc(0.31)},.95), rgba(${lc(0.51)},.5) 40%, rgba(${lc(0.59)},0))`, boxShadow: `0 0 18px 4px rgba(${lc(0.67)},.35)` });
    // the anchor lies ON the type plane (same perspective and angle as the words, so its edges run
    // parallel to the baselines), in a second copy of the plane painted above the beam
    const space2 = el('div', root, { position: 'absolute', inset: '0', perspective: '1500px', overflow: 'hidden' });
    const plane2 = el('div', space2, { position: 'absolute', left: '960px', top: '540px', width: '0', height: '0', transformStyle: 'preserve-3d' });
    const fm = faceMat(), fc = fm.canvas.cloneNode();
    const icon = el('div', plane2, { position: 'absolute', left: `${x0 - 3000}px`, top: `${y0 - A * FAR - 2000}px`, width: `${A}px`, height: `${A * FAR}px`, transformOrigin: '50% 60%' });
    Object.assign(fc.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', filter: THEME.shadow || 'drop-shadow(0 18px 30px rgba(0,0,0,.55))' });
    icon.appendChild(fc);
    return { plane, plane2, words, marks, win, box, panel, hot, shade, edgeLine, m: mm, icon, fm, fc, ar: cv.width / cv.height, logged: false };
  },
  frame(l, c) {
    const u = [Math.cos(rz * Math.PI / 180), Math.sin(rz * Math.PI / 180)];
    const d = lerp(travel * 0.5, -travel * 0.5, prog(l, 0, dur, E.drift));
    const pose = (dd, sc, off = c.off) => `translate3d(${off[0] + u[0] * dd}px,${off[1] + u[1] * dd}px,0) rotateZ(${rz}deg) rotateY(${ry}deg) rotateX(${rx}deg) scale(${sc})`;
    if (!c.off) {
      // place the layout so the beam's neck lands on `pin` (fractions of the frame) at mid-shot
      c.off = [at[0], at[1]];
      for (let it = 0; it < 3; it++) {
        c.plane.style.transform = pose(0, lerp(s0, s1, 0.5));
        const Rm = document.getElementById('stage').getBoundingClientRect(), zm = Rm.width / 1920;
        const q = c.marks.slice(0, 2).map((n) => { const b = n.getBoundingClientRect(); return [(b.left - Rm.left) / zm, (b.top - Rm.top) / zm]; });
        c.off = [c.off[0] + pin[0] * 1920 + at[0] - (q[0][0] + q[1][0]) / 2, c.off[1] + pin[1] * 1080 + at[1] - (q[0][1] + q[1][1]) / 2];
      }
    }
    if (fill === 'beam' && !c.place) {
      c.plane.style.transform = pose(0, lerp(s0, s1, 0.5));
      const Rm = document.getElementById('stage').getBoundingClientRect(), zm = Rm.width / 1920;
      const pm = c.marks.map((n) => { const b = n.getBoundingClientRect(); return [(b.left - Rm.left) / zm, (b.top - Rm.top) / zm]; });
      c.place = placeIn(clipFrame(pm), [(pm[0][0] + pm[1][0]) / 2, (pm[0][1] + pm[1][1]) / 2], c.ar, cw);
    }
    c.plane.style.transform = c.plane2.style.transform = pose(d, lerp(s0, s1, prog(l, 0, dur, E.glide)));
    // the words slide in along their own baseline, the far row first; the low row from the start
    // of the line, the high row from the far end, so neither passes under the anchor
    c.words.forEach((wd, i) => {
      const k = prog(l, 0.08 * i, 0.08 * i + 0.75, E.snap);
      wd.n.style.translate = `${lerp((i < 2 ? -1 : 1) * size * 0.5, 0, k)}px 0`;
      wd.n.style.opacity = clamp(k * 2.2, 0, 1);
    });
    const R = document.getElementById('stage').getBoundingClientRect(), z = R.width / 1920;
    const scr = (n) => { const b = n.getBoundingClientRect(); return [(b.left - R.left) / z, (b.top - R.top) / z]; };
    const pts = c.marks.map(scr);
    // the anchor lands on its place on the plane: a short settle, no drift off the type
    // enter 'pop': the anchor arrives 0.2 s in (the shot opens on type alone). enter 'cut': the
    // anchor is there on the first frame, so a cut from a shot that ends on the anchor (shrink,
    // macro pull-back, bloom) carries the subject straight across instead of blinking out and back
    const pop = enter === 'cut' ? 1 : prog(l, 0.2, 0.75, E.settle);
    c.icon.style.transform = `scale(${lerp(1.05, 1, pop)})`;
    c.icon.style.opacity = enter === 'cut' ? 1 : clamp(prog(l, 0.2, 0.32), 0, 1);
    c.fm.draw(face + l); const fx = c.fc.getContext('2d'); fx.clearRect(0, 0, c.fc.width, c.fc.height); fx.drawImage(c.fm.canvas, 0, 0);
    // the beam sweeps open out of the anchor's edge (the skill's default reveal): its right side
    // starts along its left side and swings out, led by a line of light
    const o = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
    const sw = prog(l, sweep[0], sweep[1], E.snap);
    const aL = Math.atan2(pts[3][1] - pts[0][1], pts[3][0] - pts[0][0]), aR = Math.atan2(pts[2][1] - pts[1][1], pts[2][0] - pts[1][0]);
    const len = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]), ag = lerp(aL, aR, sw);
    const far = [pts[1][0] + Math.cos(ag) * len, pts[1][1] + Math.sin(ag) * len];
    const shown = [pts[0], pts[1], far, pts[3]];
    c.win.style.clipPath = `polygon(${shown.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
    c.win.style.opacity = l < sweep[0] ? 0 : 1;
    c.box.style.filter = `brightness(${lerp(0.35, 1, prog(l, sweep[0], sweep[1] + 0.3, E.glide))})`;
    const glint = Math.sin(Math.PI * clamp((l - sweep[0]) / (sweep[1] - sweep[0] + 0.25), 0, 1));
    Object.assign(c.edgeLine.style, { left: `${pts[1][0]}px`, top: `${pts[1][1]}px`, width: `${len}px`, transform: `rotate(${ag}rad)`, opacity: glint * 0.9 });
    // content: whole and legible in the visible part of the beam (beam), or covering it (footage)
    const vis = clipFrame(pts), xs = vis.map((q) => q[0]), ys = vis.map((q) => q[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const vw = Math.max(...xs) - Math.min(...xs), vh = Math.max(...ys) - Math.min(...ys);
    let pw, ph, pcx, pcy;
    if (fill === 'beam') {
      // placed once, at the mid-shot pose, then carried with the neck: no frame-to-frame jumps
      if (!c.place) c.place = placeIn(vis, o, c.ar, cw);
      pw = c.place.w; ph = pw / c.ar; pcx = o[0] + c.place.dx; pcy = o[1] + c.place.dy;
    }
    else { pw = Math.max(vw, vh * c.ar) * 1.04; ph = pw / c.ar; pcx = cx; pcy = cy; }
    const dr = lerp(-12, 12, l / dur);
    Object.assign(c.panel.style, { left: `${pcx - pw / 2 + dr}px`, top: `${pcy - ph / 2}px`, width: `${pw}px`, height: `${ph}px`,
      boxShadow: fill === 'beam' ? '0 30px 80px rgba(0,0,0,.45)' : 'none', borderRadius: fill === 'beam' ? '10px' : '0', overflow: 'hidden' });
    const rr = 0.75 * Math.hypot(vw, vh), hc = c.hc || (c.hc = lc(0.43, 1, tone === 'content' ? lightOf(c.m.canvas) : tone === 'warm' ? undefined : tone));
    c.hot.style.background = `radial-gradient(circle ${rr}px at ${o[0]}px ${o[1]}px, rgba(${hc},.75) 0%, rgba(${hc},.32) 16%, rgba(${hc},.08) 34%, rgba(${hc},0) 52%)`;
    c.shade.style.background = `radial-gradient(circle ${rr}px at ${o[0]}px ${o[1]}px, rgba(0,0,0,0) 45%, rgba(0,0,0,${THEME.beamShade}) 100%)`;
    c.m.draw(1 + l);
    if (!c.logged && l > dur * 0.6) {
      c.logged = true;
      const area = (P) => Math.abs(P.reduce((sum, [x, y], i) => { const [X, Y] = P[(i + 1) % P.length]; return sum + x * Y - X * y; }, 0)) / 2;
      const beamShare = area(vis) / (1920 * 1080);
      const boxes = c.words.map((wd) => wd.n.getBoundingClientRect());
      const bleedTop = pts[2][1] < 0 || pts[3][1] < 0;
      const typeSpan = (Math.min(R.right, Math.max(...boxes.map((b) => b.right))) - Math.max(R.left, Math.min(...boxes.map((b) => b.left)))) / R.width;
      const cut = c.words.filter((wd) => wd.corners.some((n) => { const [x, y] = scr(n); return x < 24 || x > 1896 || y < 24 || y > 1056; })).map((wd) => wd.n.firstChild.textContent);
      const ok = beamShare >= 0.15 && beamShare <= 0.35 && bleedTop && typeSpan >= 0.55 && pw >= 560 && !cut.length;
      console.log(`[review] slot ${ok ? 'OK ' : 'FIX'} ${id} {"beamShare":${beamShare.toFixed(2)},"typeSpan":${typeSpan.toFixed(2)},"bleedTop":${bleedTop},"contentW":${Math.round(pw)}}${beamShare > 0.35 ? ' beam too big: lower lean' : ''}${beamShare < 0.15 ? ' beam too small: raise lean' : ''}${!bleedTop ? ' the beam must leave the top edge' : ''}${typeSpan < 0.55 ? ' raise size: the type must cross most of the frame' : ''}${pw < 560 ? ' content too small: raise lean or cw' : ''}${cut.length ? ` type off-frame: ${cut.join(', ')} (lower size or highScale, or move pin)` : ''}`);
    }
  },
});
// the largest box with aspect ar (up to cw of the polygon's width, 1100 px max) that sits whole in
// polygon vis with a 30 px margin; returned relative to point o
function placeIn(vis, o, ar, cw) {
  const xs = vis.map((q) => q[0]), ys = vis.map((q) => q[1]);
  const inP = ([x, y]) => { let n = false; for (let i = 0, j = vis.length - 1; i < vis.length; j = i++) { const [xi, yi] = vis[i], [xj, yj] = vis[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) n = !n; } return n; };
  const fits = (x, y, w) => { const h = w / ar, mg = 30; return [[-1, -1], [1, -1], [1, 1], [-1, 1]].every(([a, b]) => inP([x + a * (w / 2 + mg), y + b * (h / 2 + mg)])); };
  let best = { w: 0, dx: 0, dy: 0 };
  for (let k = 0; k <= 12; k++) for (let j = 0; j <= 12; j++) {
    const x = lerp(Math.min(...xs), Math.max(...xs), k / 12), y = lerp(Math.min(...ys), Math.max(...ys), j / 12);
    let lo = 0, hi = Math.min((Math.max(...xs) - Math.min(...xs)) * cw, 1100);
    for (let it = 0; it < 14; it++) { const mid = (lo + hi) / 2; if (fits(x, y, mid)) lo = mid; else hi = mid; }
    if (lo > best.w) best = { w: lo, dx: x - o[0], dy: y - o[1] };
  }
  return best;
}
// clip a screen polygon to the 1920×1080 frame (Sutherland–Hodgman)
function clipFrame(P) {
  let out = P;
  [[0, 1, 0], [0, -1, 1920], [1, 1, 0], [1, -1, 1080]].forEach(([ax, sg, v]) => {
    const inn = (q) => sg * (q[ax] - v) >= 0, res = [];
    out.forEach((q, i) => { const r = out[(i + 1) % out.length];
      if (inn(q)) res.push(q);
      if (inn(q) !== inn(r)) { const tt = (v - q[ax]) / (r[ax] - q[ax]); res.push([q[0] + (r[0] - q[0]) * tt, q[1] + (r[1] - q[1]) * tt]); } });
    out = res;
  });
  return out;
}
