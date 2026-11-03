// Keyline (a fictional keyboard app for phone and tablet): materials. Everything is authored on
// canvas so the template runs with no assets. With a real product, put the user's screenshots on
// the devices (loadImage() + fitScreen() in device3d.js) and real clips in the beams (footage()).
import { material, THEME } from '../sf/engine.js';
import { productFace } from '../sf/product3d.js';
import { phone, pair } from './device3d.js';

export const ACCENT = [110, 190, 255]; // the brand colour; the film's light follows it
const AC = `rgb(${ACCENT.join(',')})`;
const F = (w, s) => `${w} ${s}px Inter, sans-serif`;
const rr = (g, x, y, w, h, r, fill) => { g.fillStyle = fill; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
const ease = (x) => Math.min(Math.max(x, 0), 1);

// a keyboard drawn into (x, y, w), rows of keys with the given unit; returns its height
function keys(g, x, y, w, { unit = 1, dark = '#2c2c30', light = '#4a4a50' } = {}) {
  const gap = 10 * unit, kh = 64 * unit, rowH = kh + 14 * unit;
  const row = (yy, items) => {
    const tot = items.reduce((a, [, u]) => a + u, 0), k = (w - gap * (items.length - 1)) / tot; let xx = x;
    items.forEach(([lab, u, d]) => {
      rr(g, xx, yy, k * u - 0.001, kh, 10 * unit, d ? dark : light);
      g.fillStyle = '#f4f4f6'; g.font = F(500, (lab.length > 1 ? 20 : 28) * unit); g.textAlign = 'center';
      g.fillText(lab, xx + (k * u) / 2, yy + kh * 0.64); g.textAlign = 'left'; xx += k * u + gap;
    });
  };
  const L = (s) => s.split('').map((ch) => [ch, 1]);
  row(y, L('qwertyuiop'));
  row(y + rowH, [['', 0.5], ...L('asdfghjkl'), ['', 0.5]]);
  row(y + 2 * rowH, [['shift', 1.5, 1], ...L('zxcvbnm'), ['del', 1.5, 1]]);
  row(y + 3 * rowH, [['123', 2, 1], ['space', 6], ['return', 2, 1]]);
  return 4 * rowH;
}

// suggestion bar + action row above the keys
function bars(g, x, y, w, words, { unit = 1, hot = 1 } = {}) {
  g.font = F(500, 24 * unit); g.textAlign = 'center';
  words.forEach((t, i) => { g.fillStyle = i === hot ? '#ffffff' : '#a8a8ae'; g.fillText(t, x + w * (i + 0.5) / words.length, y + 30 * unit); });
  g.textAlign = 'left';
  const ay = y + 52 * unit, aw = (w - 3 * 10 * unit) / 4;
  ['Fix', 'Snippets', 'Search', 'Ask'].forEach((lab, k) => {
    rr(g, x + k * (aw + 10 * unit), ay, aw, 44 * unit, 22 * unit, '#34343a');
    g.fillStyle = '#ececee'; g.font = F(600, 18 * unit); g.textAlign = 'center';
    g.fillText(lab, x + k * (aw + 10 * unit) + aw / 2, ay + 29 * unit); g.textAlign = 'left';
  });
  return 108 * unit;
}

// the phone's own screen: a note being written above the keyboard
export function phoneScreen() {
  const W = 900, H = 1950, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#0d0d0f'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8e8ea'; g.font = F(600, 30); g.fillText('9:41', 70, 80);
  g.fillStyle = '#f2f2f4'; g.font = F(700, 64); g.fillText('Notes', 60, 230);
  g.fillStyle = '#e8e8ea'; g.font = F(500, 40);
  ['Meet the new keyboard.', 'Type or swipe, fix it', 'in one tap, and expand', 'snippets as you write.'].forEach((t, i) => g.fillText(t, 60, 340 + i * 58));
  g.fillStyle = AC; g.fillRect(470, 494, 4, 44);
  const top = 1080; g.fillStyle = '#1c1c1f'; g.fillRect(0, top, W, H - top);
  const h = bars(g, 24, top + 16, W - 48, ['"write"', 'writes', 'writing'], { unit: 1.3 });
  keys(g, 24, top + 32 + h, W - 48, { unit: 1.3 });
  return c;
}

// the tablet's screen: the same note with a full-width keyboard
export function tabletScreen() {
  const W = 1440, H = 1000, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#141416'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8e8ea'; g.font = F(600, 20); g.fillText('9:41', 44, 40);
  g.fillStyle = '#1b1b1e'; g.fillRect(0, 60, 330, 440);
  g.fillStyle = '#9a9aa0'; g.font = F(600, 20); g.fillText('Notes', 40, 110);
  [['Launch notes', true], ['Snippets', false], ['Weekly plan', false]].forEach(([t, on], k) => {
    if (on) rr(g, 24, 132 + k * 58, 282, 46, 10, '#2c2c30');
    g.fillStyle = on ? '#f2f2f4' : '#a8a8ae'; g.font = F(500, 22); g.fillText(t, 44, 163 + k * 58);
  });
  g.fillStyle = '#f2f2f4'; g.font = F(700, 44); g.fillText('Launch notes', 390, 130);
  g.fillStyle = '#9a9aa0'; g.font = F(500, 22); g.fillText('Keyline 2.0', 390, 172);
  g.fillStyle = '#e8e8ea'; g.font = F(500, 30);
  g.fillText('Meet the new keyboard. Type or swipe, fix it in one tap,', 390, 250);
  g.fillText('and expand snippets as you write.', 390, 296);
  g.fillStyle = AC; g.fillRect(842, 270, 3, 34);
  const top = 500; g.fillStyle = '#202023'; g.fillRect(0, top, W, H - top);
  const h = bars(g, 24, top + 12, W - 48, ['"write"', 'writes', 'writing']);
  keys(g, 24, top + 20 + h, W - 48);
  return c;
}

// the tablet keyboard alone, cut from the tablet screen, for the signature's second beam
export const tabletKeys = () => () => {
  const src = tabletScreen(), y0 = 500, h = src.height - y0, w = src.width, W = 1200, Hh = Math.round((W * h) / w);
  return material(W, Hh, (c) => c.drawImage(src, 0, y0, w, h, 0, 0, W, Hh));
};
// the phone screen as beam content (the keyboard half)
export const phoneKeys = () => () => {
  const src = phoneScreen(), y0 = 1060, h = src.height - y0, w = src.width, W = 800, Hh = Math.round((W * h) / w);
  return material(W, Hh, (c) => c.drawImage(src, 0, y0, w, h, 0, 0, W, Hh));
};

// Feature cards: one readable thing each (SKILL.md › Screens in a beam), animated by t so a beam
// holds something that moves, as a clip would. kind: autocorrect, fix, snippet, dictation,
// emoji, gif, actions, themes, layouts, customkeys. A beam card by default (720 wide, its height
// set by the kind); { w: 1920, h: 1080 } for a full-frame burst cut.
const CARDS = {
  autocorrect(g, w, h, t, u) {
    const typed = 'Thsi is teh'.slice(0, Math.floor(ease(t / 1.6) * 11));
    const fixed = t > 2 ? 'This is the' : typed;
    field(g, w, u, fixed + (t % 0.6 < 0.3 ? '|' : ''));
    bars(g, 30 * u, 260 * u, w - 60 * u, ['the', 'then', 'they'], { unit: u, hot: t > 2 ? 0 : -1 });
  },
  fix(g, w, h, t, u) {
    const done = t > 1.8;
    field(g, w, u, done ? 'Their going to love it.'.replace('Their', "They're") : 'Their going to love it.');
    if (!done) { g.strokeStyle = '#ff6b6b'; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(60 * u, 210 * u); g.lineTo(200 * u, 210 * u); g.stroke(); }
    rr(g, 40 * u, 280 * u, w - 80 * u, 70 * u, 35 * u, done ? AC : '#34343a');
    g.fillStyle = done ? '#06121c' : '#ececee'; g.font = F(700, 28 * u); g.textAlign = 'center'; g.fillText(done ? 'Fixed' : 'Fix spelling + grammar', w / 2, 325 * u); g.textAlign = 'left';
  },
  snippet(g, w, h, t, u) {
    const k = Math.floor(ease(t / 0.8) * 5), out = t > 1.4;
    field(g, w, u, out ? '12 Harbour St, Unit 4' : ';addr'.slice(0, k));
    g.fillStyle = '#9a9aa0'; g.font = F(500, 24 * u); g.fillText(out ? 'Snippet expanded' : 'Type a keyword…', 50 * u, 300 * u);
  },
  dictation(g, w, h, t, u) {
    field(g, w, u, 'Remind me to call Sam'.slice(0, Math.floor(ease(t / 2.4) * 21)));
    for (let i = 0; i < 24; i++) {
      const a = 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7 + t * 6));
      rr(g, 50 * u + i * ((w - 100 * u) / 24), 330 * u - a * 60 * u, 8 * u, a * 120 * u, 4 * u, AC);
    }
    g.fillStyle = '#ececee'; g.font = F(600, 26 * u); g.fillText('Listening…', 50 * u, 470 * u);
  },
  emoji(g, w, h, t, u) {
    field(g, w, u, 'party');
    const cols = ['#ffcf4a', '#ff8a5c', '#7ad37a', '#6ab8ff', '#c38bff', '#ff6bb0'];
    for (let i = 0; i < 12; i++) { const on = i < Math.floor(t * 6); g.globalAlpha = on ? 1 : 0.2; g.fillStyle = cols[i % 6]; g.beginPath(); g.arc(90 * u + (i % 6) * ((w - 140 * u) / 5), 300 * u + Math.floor(i / 6) * 120 * u, 40 * u, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  },
  gif(g, w, h, t, u) {
    field(g, w, u, 'celebrate');
    for (let i = 0; i < 4; i++) {
      const x = 40 * u + (i % 2) * (w / 2 - 20 * u), y = 260 * u + Math.floor(i / 2) * 230 * u;
      const hue = (i * 70 + t * 90) % 360;
      g.fillStyle = `hsl(${hue} 60% 45%)`; g.beginPath(); g.roundRect(x, y, w / 2 - 60 * u, 200 * u, 16 * u); g.fill();
    }
  },
  actions(g, w, h, t, u) {
    field(g, w, u, 'Draft the reply');
    ['Fix', 'Snippets', 'Search', 'Ask', 'Translate', 'Clipboard'].forEach((lab, k) => {
      const on = k === Math.floor(t * 2) % 6, y = 260 * u + k * 76 * u;
      rr(g, 40 * u, y, w - 80 * u, 60 * u, 30 * u, on ? AC : '#34343a');
      g.fillStyle = on ? '#06121c' : '#ececee'; g.font = F(600, 26 * u); g.fillText(lab, 70 * u, y + 40 * u);
    });
  },
  themes(g, w, h, t, u) {
    const sw = ['#1c1c1f', '#f2f2f4', '#203a5c', '#3b2530', '#20352a'], k = Math.floor(t * 1.5) % 5;
    g.fillStyle = sw[k]; g.fillRect(0, 160 * u, w, h - 160 * u);
    keys(g, 30 * u, 220 * u, w - 60 * u, { unit: u * 0.9, dark: k === 1 ? '#c8c8cc' : '#2c2c30', light: k === 1 ? '#ffffff' : '#4a4a50' });
    sw.forEach((s, i) => { rr(g, 40 * u + i * 70 * u, 80 * u, 54 * u, 54 * u, 27 * u, s); if (i === k) { g.strokeStyle = AC; g.lineWidth = 4 * u; g.stroke(); } });
  },
  layouts(g, w, h, t, u) {
    ['QWERTY', 'QWERTZ', 'AZERTY', 'Dvorak', 'Colemak', 'Workman', 'Split'].forEach((n, k) => {
      const on = k === Math.floor(t * 2) % 7, y = 70 * u + k * 80 * u;
      rr(g, 30 * u, y, w - 60 * u, 64 * u, 14 * u, on ? '#2a2f38' : '#18181b');
      g.fillStyle = on ? '#ffffff' : '#a8a8ae'; g.font = F(600, 28 * u); g.fillText(n, 60 * u, y + 42 * u);
      if (on) { g.fillStyle = AC; g.fillText('✓', w - 90 * u, y + 42 * u); }
    });
  },
  customkeys(g, w, h, t, u) {
    g.fillStyle = '#9a9aa0'; g.font = F(600, 24 * u); g.fillText('Custom keys', 40 * u, 70 * u);
    ['@', '#', '→', '⌘', '%', '✓'].forEach((s, k) => {
      const x = 40 * u + (k % 3) * ((w - 80 * u) / 3), y = 110 * u + Math.floor(k / 3) * 150 * u, lift = k === Math.floor(t * 3) % 6 ? 1 : 0;
      rr(g, x, y - lift * 10 * u, (w - 120 * u) / 3, 120 * u, 18 * u, lift ? AC : '#4a4a50');
      g.fillStyle = lift ? '#06121c' : '#f4f4f6'; g.font = F(600, 52 * u); g.textAlign = 'center'; g.fillText(s, x + (w - 120 * u) / 6, y + 78 * u - lift * 10 * u); g.textAlign = 'left';
    });
  },
};
function field(g, w, u, text) {
  rr(g, 30 * u, 120 * u, w - 60 * u, 120 * u, 20 * u, '#1f1f23');
  g.fillStyle = '#f2f2f4'; g.font = F(500, 38 * u); g.fillText(text, 60 * u, 194 * u);
}
// panel height per kind at the 720 design width, so each card is filled by its one thing
const CARD_H = { autocorrect: 400, fix: 380, snippet: 340, dictation: 500, emoji: 440, gif: 720, actions: 740, themes: 620, layouts: 660, customkeys: 440 };
export const card = (kind, { w = 720, h } = {}) => () => {
  // a beam card is the panel itself; a full-frame cut (w > h) sets the panel at 1.3x right of
  // centre on a soft field, leaving the lower left to the caption
  const ch = CARD_H[kind], full = !!h && w > h, u = full ? 1.3 : w / 720, pw = 720 * u, ph = ch * u;
  const H = full ? h : Math.round(ph);
  return material(w, H, (g, W, Hh, t) => {
    g.fillStyle = full ? '#0e0f12' : '#141416'; g.fillRect(0, 0, W, Hh);
    if (full) { const r = g.createRadialGradient(W * 0.6, Hh / 2, 0, W * 0.6, Hh / 2, W * 0.6); r.addColorStop(0, `rgba(${ACCENT.join(',')},0.18)`); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, W, Hh); }
    g.save(); if (full) g.translate(W - pw - 180, Math.max((Hh - ph) / 2, 0));
    rr(g, 0, 0, pw, Math.min(ph, Hh), 28 * u, '#141416');
    CARDS[kind](g, pw, ph, t, u);
    g.restore();
  });
};

// Faces: the film's anchor is the phone; the signature uses a second face with the phone and the
// tablet, where PAIR.p runs 0 (the phone alone) -> 1 (the tablet risen behind it).
export const FOLD = { view: null }; // view override for the signature
export const PAIR = { p: 0 };
const idle = (t) => ({ yaw: -16 + 5 * Math.sin(t * 0.5), pitch: 9, roll: 0 });
export function makeFaces() {
  const screen = phoneScreen();
  const faceA = productFace(phone(screen), { w: 640, h: 1000, fov: 18, fill: 0.9, view: idle });
  const b = pair(screen, tabletScreen());
  const faceB = productFace(b, { w: 1400, h: 1000, fov: 18, fill: 0.92, view: (t) => (FOLD.view ? FOLD.view(t) : idle(t)), tick: () => b.userData.set(PAIR.p) });
  return { faceA, faceB };
}
export { THEME };
