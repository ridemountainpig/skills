// Keyline (fictional keyboard app for phone and tablet). Two acts: act 1 is slow and large (the type
// slot, three long beams, the tablet rising behind the phone), a blackout, act 2 is all
// fast cuts (a captioned burst, settings beams, the name). The anchor is a phone built in three.js
// (device3d.js) with an authored screen; the signature swaps to a second face holding the phone
// and a tablet. Shot times are shot-seconds; every duration is B(n) so the cuts land on the beat.
// The order is only an example: run plan-dice for your own Film concept.
import { ready, layers, el, lerp, prog, E, THEME } from '../sf/engine.js';
import { useFace, anchor, shine, block, reveal, grow, runFilm, beats } from '../sf/anchor.js';
import { seq, typeSlot, bloomShot, burst, blackout } from '../sf/shots-lib.js';
import { makeFaces, FOLD, PAIR, phoneKeys, tabletKeys, card, ACCENT } from './materials.js';
import { PINS } from './pins.js';

const BPM = 120, PACE = 1.2, B = beats(BPM, PACE);
const { faceA, faceB } = makeFaces();
const LIGHT = ACCENT; // the light follows the brand colour, not the screen's measured accent
const FACE_A = { cutout: true, light: LIGHT };
useFace(faceA, FACE_A);
// dark keyboard UIs on a dark wedge read as a black hole: carry the light further and stronger (SKILL.md §0.8)
THEME.beamGlow = 1.9; THEME.beamReach = 1.6; THEME.beamShade = 0.18;

// every shot but the signature shows the phone alone
const closed = (s) => ({ ...s, frame(l, c, i) { PAIR.p = 0; FOLD.view = null; return s.frame(l, c, i); } });

// Signature: the phone alone, then the tablet rises behind it while the camera pulls back, then the
// only two-beam frame of the film: one beam to the phone keyboard, one to the full-size tablet
// keyboard. Rule break: two-beams-once. An object that changes shape works the same way (SKILL.md §0.6).
const AY = -140;
const signature = ({ id = 'sig', dur }) => ({
  id, dur,
  setup(root) {
    // measure the pair's outline for the necks, then give the film its phone face back
    PAIR.p = 1; FOLD.view = () => ({ yaw: -8, pitch: 6, roll: 0 });
    useFace(faceB, { cutout: true });
    const L = layers(root, { perspective: 2600 });
    const a = anchor(L, { x: 0, y: AY, w: 720 });
    const left = shine(L.base, a, phoneKeys()(), { x: -650, y: -90, w: 420, m: 30 });
    const right = shine(L.base, a, tabletKeys()(), { x: 620, y: -90, w: 520, m: 30 });
    useFace(faceA, FACE_A);
    a.draw = (t) => { faceB.draw(t); const g = a.face.getContext('2d'); g.clearRect(0, 0, a.face.width, a.face.height); g.drawImage(faceB.canvas, 0, 0); };
    const t = block(L.base, [[['PHONE', 'word'], ['AND', 'word'], ['TABLET', 'word']]], { x: 0, y: 340, size: 124, align: 'center' });
    return { L, a, beams: [left, right], t };
  },
  frame(l, c) {
    // 1) the phone alone, close; the tablet rises behind it as the camera pulls back
    const p = prog(l, B(1), B(5), E.glide), q = prog(l, B(0.5), B(6), E.glide);
    PAIR.p = p;
    FOLD.view = () => ({ yaw: lerp(-16, -8, q), pitch: lerp(9, 6, q), roll: 0 });
    c.a.draw(l);
    const s0 = 2.1;
    c.L.set({ s: lerp(s0, 1, q), y: lerp(-AY * s0, 0, q) });
    // 2) both beams open together once the camera has settled
    const g = prog(l, B(6.25), B(6.25) + 0.55, E.snap);
    c.beams.forEach((w) => { w.setPts(grow(w.pts, w.src, Math.max(g, 0.0001))); w.box.style.opacity = g > 0 ? 1 : 0; });
    reveal(c.t.rows, l, B(7));
  },
});

// full-frame cuts with a short caption in the lower left (the claim and its proof at once)
const captioned = ({ id, items }) => {
  const b = burst({ id, mats: items.map((x) => x.m), cut: items.map((x) => x.dur), crop: [1.0, 1.05] });
  const at = items.map((_, i) => items.slice(0, i).reduce((t, x) => t + x.dur, 0));
  return {
    ...b,
    setup(root) {
      const c = b.setup(root);
      c.ts = items.map((it, i) => {
        el('div', c.ds[i], { position: 'absolute', inset: '0', background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.8) 100%)' });
        return block(layers(c.ds[i]).base, it.lines, { x: -800, y: 420, size: 112, align: 'left' });
      });
      return c;
    },
    frame(l, c) { b.frame(l, c); let k = at.findLastIndex((t) => l >= t); if (k < 0) k = 0; reveal(c.ts[k].rows, l - at[k], 0.02, 24); },
  };
};

const LEGAL = 'Keyline is a fictional product made for this template.';

// closing: the name set in type (with a real brand, its official logo goes here: SKILL.md §0.8),
// the product line and the promise; one short legal line
const ending = ({ id = 'brand', dur }) => ({
  id, dur,
  setup(root) {
    const L = layers(root, { perspective: 2600 });
    const rgb = ACCENT.join(',');
    const glowN = el('div', L.base, { position: 'absolute', left: '-700px', top: '-520px', width: '1400px', height: '900px', background: `radial-gradient(closest-side, rgba(${rgb},.16), rgba(${rgb},0))` });
    const logo = el('div', L.base, { position: 'absolute', left: '0', top: '-60px', transform: 'translate(-50%,-50%)', font: "800 150px 'Archivo Variable', sans-serif", fontStretch: '125%', color: THEME.ink, whiteSpace: 'nowrap' }, { textContent: 'Keyline' });
    const sub = el('div', L.base, { position: 'absolute', left: '0', top: '110px', transform: 'translate(-50%,-50%)', font: "600 54px 'Inter', sans-serif", color: THEME.ink, letterSpacing: '-0.01em', whiteSpace: 'nowrap', opacity: 0 }, { textContent: 'Keyboard for phone and tablet' });
    const line = el('div', L.base, { position: 'absolute', left: '0', top: '190px', transform: 'translate(-50%,-50%)', font: "500 34px 'Inter', sans-serif", color: THEME.muted, whiteSpace: 'nowrap', opacity: 0 }, { textContent: 'One keyboard. Every app.' });
    el('div', root, { position: 'absolute', left: '0', right: '0', bottom: '44px', textAlign: 'center', font: "500 16px 'Inter', sans-serif", color: THEME.muted, opacity: 0.7 }, { textContent: LEGAL });
    return { L, logo, sub, line, glowN };
  },
  frame(l, c) {
    const k = prog(l, 0, 0.6, E.snap);
    c.logo.style.opacity = k; c.logo.style.transform = `translate(-50%,-50%) scale(${lerp(0.94, 1, k)})`;
    c.glowN.style.opacity = k;
    c.sub.style.opacity = prog(l, B(1), B(2), E.glide);
    c.line.style.opacity = prog(l, B(2.5), B(3.5), E.glide);
    c.L.set({ s: lerp(1, 1.03, l / dur) });
  },
});

const wide = { w: 1920, h: 1080 };
const shots = seq([
  // ACT 1: slow and large
  closed(typeSlot({ id: 'slot', dur: B(10), m: card('dictation'), cw: 0.85, enter: 'pop', neck: 0.7, pin: [0.45, 0.5], lean: 1.3, highScale: 0.85,
    low: [[['MEET YOUR NEW', 'lead']], [['KEYBOARD', 'word']]], high: [[['KEYLINE', 'lead']], [['2.0', 'fig']]] })),
  closed(bloomShot({ id: 'type', w: 480, beats: [
    { m: card('autocorrect'), at: [600, -110], w: 520, t0: 0, t1: B(9), type: [[['SWIPE TYPING', 'word']], [['AUTOCORRECT', 'word']]], tat: [-250, -40], size: 92, shut: 0.3 },
    { m: card('fix'), at: [-600, -100], w: 520, t0: B(9), t1: B(18), type: [[['ONE-TAP', 'word']], [['SPELLING', 'word']], [['+ GRAMMAR', 'word']]], tat: [250, -90], size: 92, shut: 0.3 },
    { m: card('snippet'), at: [600, 120], w: 520, t0: B(18), t1: B(26), type: [[['SNIPPETS', 'word']], [['EXPAND AS', 'word']], [['YOU TYPE', 'word']]], tat: [-250, -90], size: 92, shut: 0 },
  ] })),
  signature({ id: 'sig', dur: B(12) }),
  blackout({ id: 'black', dur: B(1) }),
  // ACT 2: all fast
  captioned({ id: 'burst', items: [
    { m: card('dictation', wide), dur: B(3), lines: [[['DICTATION', 'word']]] },
    { m: card('emoji', wide), dur: B(3), lines: [[['EMOJI', 'word']], [['SEARCH', 'word']]] },
    { m: card('gif', wide), dur: B(2), lines: [[['GIFS', 'word']]] },
    { m: card('actions', wide), dur: B(2), lines: [[['YOUR', 'word'], ['ACTION ROW', 'word']]] },
  ] }),
  closed(bloomShot({ id: 'make', w: 460, beats: [
    { m: card('themes'), at: [-580, 80], w: 520, t0: 0, t1: B(4), type: [[['5', 'fig'], ['THEMES', 'word']]], tat: [250, 0], size: 104, open: 0.3, shut: 0 },
    { m: card('layouts'), at: [590, -60], w: 460, t0: B(4), t1: B(8), type: [[['7', 'fig'], ['LAYOUTS', 'word']]], tat: [-250, 0], size: 104, open: 0.3, shut: 0 },
    { m: card('customkeys'), at: [-560, -40], w: 440, t0: B(8), t1: B(12), type: [[['CUSTOM', 'word']], [['KEYS', 'word']]], tat: [250, -50], size: 104, open: 0.3, shut: 0 },
  ] })),
  ending({ id: 'brand', dur: B(8) }),
]);

runFilm({
  shots, duration: shots[shots.length - 1].end, pace: PACE, bpm: BPM, pins: PINS
});
await ready([`800 80px 'Archivo Variable'`, `600 20px 'Inter'`, `700 20px 'Inter'`]);
