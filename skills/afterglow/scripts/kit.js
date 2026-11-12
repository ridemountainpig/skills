// kit.js (afterglow): deterministic device-and-screen kit. Every draw is a pure function of t.
// Pieces: palettes (tokens + effect profile), device shell (line-art monitor + keyboard),
// screen pipeline (content -> phosphor tint -> glow -> scanlines -> vignette -> flicker),
// caption header, chapter counter, cursor, knobs, key presses, typing, glyph rain, tinted images.

// ---------- palettes ----------
// tokens: stage (page bg), head (caption ink), mark (the one highlighted caption word, end-card title),
// glass (screen bg), phos (main glow colour), dim (secondary text), hot (accent: commands, the action key),
// ok (status dot), line (device line-art). light: true for looks that are ink on a pale stage.
// fx: glow (bloom strength), scan (scanline alpha), roll (rolling band), flick (flicker), curve (screen radius)
export const PALETTES = {
  amber: { stage: '#000000', head: '#f5f5f5', mark: '#ffc684', glass: '#1b1309', phos: '#ffc684', dim: '#a8845c', hot: '#ff7d5e', ok: '#5ee08a', line: '#5c4128',
    fx: { glow: 0.55, scan: 0.22, roll: 0.06, flick: 0.025, curve: 46 } },
  green: { stage: '#000000', head: '#f5f5f5', mark: '#8ff7a7', glass: '#0a170d', phos: '#8ff7a7', dim: '#5a9e6c', hot: '#d8ff6a', ok: '#8ff7a7', line: '#2c5236',
    fx: { glow: 0.6, scan: 0.24, roll: 0.06, flick: 0.025, curve: 46 } },
  white: { stage: '#000000', head: '#f5f5f5', mark: '#9cc4ff', glass: '#121821', phos: '#e9f0fb', dim: '#8d9bb0', hot: '#7fb4ff', ok: '#7fe0b0', line: '#3a4455',
    fx: { glow: 0.45, scan: 0.2, roll: 0.05, flick: 0.02, curve: 46 } },
  cyan: { stage: '#000000', head: '#f5f5f5', mark: '#74f5e6', glass: '#06161a', phos: '#74f5e6', dim: '#3f9c94', hot: '#ff5fa2', ok: '#74f5e6', line: '#1f4a4a',
    fx: { glow: 0.7, scan: 0.16, roll: 0.04, flick: 0.03, curve: 30 } },
  // not a CRT: e-paper. Light stage, ink instead of light, no glow, faint grain-like lines.
  paper: { light: true, stage: '#e8e4da', head: '#1d1c1a', mark: '#c2401f', glass: '#f4f1e9', phos: '#1f1d1a', dim: '#857f73', hot: '#cf4a2b', ok: '#2f8a52', line: '#aaa294',
    fx: { glow: 0, scan: 0.035, roll: 0, flick: 0, curve: 18 } },
};
export const hex = (h) => { let d = h.replace('#', ''); if (d.length === 3) d = d.replace(/./g, '$&$&'); if (!/^[0-9a-f]{6}$/i.test(d)) throw new Error(`bad colour ${h}: use #rgb or #rrggbb`); const n = parseInt(d, 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
export const mixHex = (a, b, k) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * k));
export function mixPal(a, b, k) {
  if (k <= 0) return { ...a, fx: { ...a.fx } }; if (k >= 1) return { ...b, fx: { ...b.fx } }; // copies: callers may tag them
  const o = { fx: {}, light: k < 0.5 ? a.light : b.light };
  for (const key in a) if (typeof a[key] === 'string' && a[key][0] === '#' && typeof b[key] === 'string') o[key] = mixHex(a[key], b[key], k);
  for (const key in a.fx) o.fx[key] = a.fx[key] + (b.fx[key] - a.fx[key]) * k;
  return o;
}
// WCAG contrast ratio of two hex colours
export function contrast(a, b) {
  const L = (h) => { const c = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
// a look made from a product's accent colour, on the dark CRT base
export function lookFrom(accent, name = 'brand') {
  const g = mixHex('#000000', accent, 0.1), d = mixHex(accent, '#000000', 0.38), l = mixHex(accent, '#000000', 0.62);
  return { stage: '#000000', head: '#f5f5f5', mark: accent, glass: g, phos: mixHex(accent, '#ffffff', 0.35), dim: d, hot: '#ff7d5e', ok: '#5ee08a', line: l,
    fx: { glow: 0.55, scan: 0.22, roll: 0.06, flick: 0.025, curve: 46 }, name };
}
export const hexSat = (h) => { const c = hex(h), mx = Math.max(...c), mn = Math.min(...c); return mx ? (mx - mn) / mx : 0; };
export const hexLum = (h) => { const [r, g, b] = hex(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
// readable(colour, on): darken (or lighten) a colour until it reads at contrast >= 3 on the background
export function readable(c, on, min = 3) {
  if (contrast(c, on) >= min) return c;
  const dark = hexLum(on) > 0.5;
  for (let k = 0.1; k <= 1; k += 0.1) { const m = mixHex(c, dark ? '#000000' : '#ffffff', k); if (contrast(m, on) >= min) return m; }
  return dark ? '#000000' : '#ffffff';
}
export const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };

// ---------- time helpers ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x) => 1 - Math.pow(1 - x, 3);
export const lerp = (a, b, k) => a + (b - a) * k;
export const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// typed(str, t, t0, cps): the visible prefix and the char just typed (for key presses)
export function typed(str, t, t0, cps = 14) {
  const n = clamp(Math.floor((t - t0) * cps), 0, str.length);
  const last = t >= t0 && n > 0 && (t - t0) * cps - (n - 1) < 1.6 && n <= str.length ? str[n - 1] : null;
  return { s: str.slice(0, n), last: (t - t0) * cps < str.length + 1 ? last : null, done: n >= str.length };
}

// ---------- text ----------
// SMALL collects screen text drawn under 15 px (screen space): [review] reports it once
export const SMALL = new Set(); let ON_SCREEN = false;
export function txt(ctx, s, x, y, { font = '500 20px Inter', color = '#fff', align = 'left', base = 'alphabetic', ls = 0, alpha = 1, deco = false } = {}) {
  if (ON_SCREEN && !deco) { const m = /(\d+(?:\.\d+)?)px/.exec(font); if (m && Number(m[1]) < 15 && s.trim()) SMALL.add(`${m[1]}px "${s.slice(0, 24)}"`); }
  ctx.save(); ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base; ctx.globalAlpha *= alpha;
  ctx.letterSpacing = ls + 'px'; ctx.fillText(s, x, y); ctx.restore();
}
// segs: [[text, colour], ...] centred on cx
export function segText(ctx, segs, cx, y, font, alpha = 1) {
  ctx.save(); ctx.font = font; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha *= alpha;
  const w = segs.reduce((s, [t]) => s + ctx.measureText(t).width, 0);
  let x = cx - w / 2;
  for (const [t, c] of segs) { ctx.fillStyle = c; ctx.fillText(t, x, y); x += ctx.measureText(t).width; }
  ctx.restore(); return w;
}

// ---------- tinted image (real screenshots through the phosphor) ----------
const tintCache = new Map();
export function tinted(img, pal, w, h) {
  const key = img.src + pal.phos + pal.glass + w + 'x' + h;
  if (tintCache.has(key)) return tintCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const light = pal.fx.glow === 0;
  x.filter = light ? 'grayscale(1) contrast(1.15)' : 'grayscale(1) contrast(1.2) brightness(1.05)';
  x.drawImage(img, 0, 0, w, h); x.filter = 'none';
  // dark palettes: white -> phosphor, black -> glass. light palette: keep ink on paper.
  x.globalCompositeOperation = 'multiply'; x.fillStyle = light ? pal.glass : mixHex(pal.phos, pal.glass, 0.18); x.fillRect(0, 0, w, h);
  if (!light) { x.globalCompositeOperation = 'lighten'; x.fillStyle = pal.glass; x.fillRect(0, 0, w, h); }
  x.globalCompositeOperation = 'destination-in'; x.drawImage(img, 0, 0, w, h); // keep the image's alpha
  if (tintCache.size > 60) tintCache.delete(tintCache.keys().next().value);
  tintCache.set(key, c); return c;
}

// ---------- screen pipeline ----------
let SC = null, GL = null;
// draw(ctx, w, h) paints content in screen space (w x h logical). Composited into rect r on main ctx.
export function screen(ctx, t, pal, r, draw, { power = 1, scale = 2 } = {}) {
  const w = r.w, h = r.h, W = Math.round(w * scale), H = Math.round(h * scale);
  if (!SC || SC.width !== W || SC.height !== H) { SC = new OffscreenCanvas(W, H); GL = new OffscreenCanvas(W >> 2, H >> 2); }
  const s = SC.getContext('2d'); s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, W, H);
  // glass: slightly lit centre
  const g = s.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.5, W * 0.62);
  g.addColorStop(0, mixHex(pal.glass, pal.phos, pal.fx.glow ? 0.07 : 0)); g.addColorStop(1, pal.glass);
  s.fillStyle = g; s.fillRect(0, 0, W, H);
  s.setTransform(scale, 0, 0, scale, 0, 0);
  if (power > 0) { s.save(); s.globalAlpha = power; ON_SCREEN = true; try { draw(s, w, h); } finally { ON_SCREEN = false; } s.restore(); }
  s.setTransform(1, 0, 0, 1, 0, 0);
  // composite with CRT rounding
  ctx.save();
  rr(ctx, r.x, r.y, w, h, pal.fx.curve); ctx.clip();
  const fl = 1 - pal.fx.flick * (0.5 + 0.5 * Math.sin(t * 61) * hash(Math.floor(t * 30)));
  ctx.globalAlpha = fl; ctx.drawImage(SC, r.x, r.y, w, h);
  if (pal.fx.glow > 0 && power > 0) { // bloom: downsample + blur + add
    const gx = GL.getContext('2d'); gx.clearRect(0, 0, GL.width, GL.height); gx.filter = 'blur(3px)'; gx.drawImage(SC, 0, 0, GL.width, GL.height); gx.filter = 'none';
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = pal.fx.glow * 0.55 * fl; ctx.drawImage(GL, r.x - 6, r.y - 6, w + 12, h + 12);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;
  // scanlines
  if (pal.fx.scan > 0) {
    ctx.fillStyle = `rgba(0,0,0,${pal.fx.scan})`;
    for (let y = r.y; y < r.y + h; y += 3) ctx.fillRect(r.x, y, w, 1.2);
  }
  // rolling band
  if (pal.fx.roll > 0) {
    const by = r.y + ((t * 0.18) % 1.3 - 0.15) * h;
    const bg = ctx.createLinearGradient(0, by - 40, 0, by + 40);
    bg.addColorStop(0, rgba(pal.phos, 0)); bg.addColorStop(0.5, rgba(pal.phos, pal.fx.roll)); bg.addColorStop(1, rgba(pal.phos, 0));
    ctx.fillStyle = bg; ctx.fillRect(r.x, by - 40, w, 80);
  }
  // vignette
  const v = ctx.createRadialGradient(r.x + w / 2, r.y + h / 2, h * 0.35, r.x + w / 2, r.y + h / 2, w * 0.62);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${pal.fx.glow ? 0.55 : 0.12})`);
  ctx.fillStyle = v; ctx.fillRect(r.x, r.y, w, h);
  ctx.restore();
  // glass edge
  ctx.save(); rr(ctx, r.x, r.y, w, h, pal.fx.curve); ctx.strokeStyle = rgba(pal.phos, 0.08); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}
export function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// ---------- CRT power-on (line -> full) ----------
export function powerOn(ctx, pal, r, k) { // k 0..1, draws the collapsing beam over a black screen
  if (k >= 1) return;
  ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, pal.fx.curve); ctx.clip();
  const hh = k < 0.35 ? 2 + (k / 0.35) * 6 : lerp(8, r.h, ease((k - 0.35) / 0.65));
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, r.y + r.h / 2 - hh / 2, 0, r.y + r.h / 2 + hh / 2);
  g.addColorStop(0, rgba(pal.phos, 0)); g.addColorStop(0.5, rgba(pal.phos, 0.9 * (1 - k))); g.addColorStop(1, rgba(pal.phos, 0));
  ctx.fillStyle = g; const ww = r.w * Math.min(1, 0.2 + k * 2);
  ctx.fillRect(r.x + (r.w - ww) / 2, r.y + r.h / 2 - hh / 2, ww, hh); ctx.restore();
}

// ---------- device shell ----------
// geometry in stage px (1920x1080 design)
export const DEV = {
  mon: { x: 415, y: 150, w: 1090, h: 790, r: 46 },
  bez: { x: 450, y: 186, w: 1020, h: 650, r: 40 },
  scr: { x: 500, y: 236, w: 920, h: 545 },
  strip: { y: 870 },
  kb: { yTop: 900, yBot: 1060, wTop: 980, wBot: 1180, cx: 960 },
};
const ROWS = [
  [['`'], ['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7'], ['8'], ['9'], ['0'], ['-'], ['='], ['⌫', 2]],
  [['tab', 1.5], ['Q'], ['W'], ['E'], ['R'], ['T'], ['Y'], ['U'], ['I'], ['O'], ['P'], ['['], [']'], ['\\', 1.5]],
  [['caps', 1.75], ['A'], ['S'], ['D'], ['F'], ['G'], ['H'], ['J'], ['K'], ['L'], [';'], ["'"], ['ACTION', 2.25]],
  [['shift', 2.25], ['Z'], ['X'], ['C'], ['V'], ['B'], ['N'], ['M'], [','], ['.'], ['/'], ['shift', 2.75]],
  [['ctrl', 1.25], ['opt', 1.25], ['cmd', 1.25], ['space', 6.25], ['cmd', 1.25], ['opt', 1.25], ['←', 1.25], ['→', 1.25]],
];
// keyCenter('ACTION' | 'Q' | 'space' ...) -> [x, y] on the stage, for cursor targets
export function keyCenter(label) {
  const K = DEV.kb, P = (u, v) => [K.cx + (u - 0.5) * lerp(K.wTop, K.wBot, v), lerp(K.yTop, K.yBot, v)];
  for (let r = 0; r < ROWS.length; r++) { let u = 0; for (const [lab, wu = 1] of ROWS[r]) { if (lab === label) return P((u + wu / 2) / 15, (r + 0.5) / ROWS.length); u += wu; } }
  return [K.cx, K.yTop];
}
// press: { [label]: 0..1 } lit amount; action: label for the action key (e.g. '⏎ POST')
export function keyboard(ctx, pal, { press = {}, action = '⏎ ENTER', actionHot = 1 } = {}) {
  const K = DEV.kb, rows = ROWS.length;
  const P = (u, v) => [K.cx + (u - 0.5) * lerp(K.wTop, K.wBot, v), lerp(K.yTop, K.yBot, v)];
  ctx.save(); ctx.lineJoin = 'round';
  // base plate
  const a = P(-0.02, -0.06), b = P(1.02, -0.06), c = P(1.03, 1.06), d = P(-0.03, 1.06);
  // base plate + front skirt are filled with the stage colour: the keyboard sits in front of everything behind it
  ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(c[0] + 4, c[1]); ctx.lineTo(c[0] + 4, c[1] + 22); ctx.lineTo(d[0] - 4, d[1] + 22); ctx.lineTo(d[0] - 4, d[1]); ctx.closePath();
  ctx.fillStyle = pal.stage; ctx.fill();
  ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.closePath();
  ctx.strokeStyle = pal.line; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(d[0] - 4, d[1]); ctx.lineTo(d[0] - 4, d[1] + 22); ctx.lineTo(c[0] + 4, c[1] + 22); ctx.lineTo(c[0] + 4, c[1]); ctx.stroke();
  for (let r = 0; r < rows; r++) {
    let u = 0; const v0 = r / rows + 0.012, v1 = (r + 1) / rows - 0.012;
    for (const [lab, wu = 1] of ROWS[r]) {
      const u0 = u / 15 + 0.003, u1 = (u + wu) / 15 - 0.003; u += wu;
      const q = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
      const isAct = lab === 'ACTION', label = isAct ? action : lab;
      const lit = press[lab] || press[label] || 0;
      const col = isAct ? mixHex(pal.line, pal.hot, actionHot) : pal.line;
      // keycap: outer quad + inner top face (shifted up = 3D)
      ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath();
      ctx.strokeStyle = col; ctx.lineWidth = isAct ? 2 : 1.2; ctx.stroke();
      const inset = (p, k) => [lerp(p[0], (q[0][0] + q[2][0]) / 2, k), lerp(p[1], (q[0][1] + q[2][1]) / 2, k) - 5 + lit * 3];
      const top = q.map((p) => inset(p, 0.14));
      ctx.beginPath(); top.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath();
      if (lit > 0) { ctx.fillStyle = rgba(isAct ? pal.hot : pal.phos, 0.35 * lit); ctx.fill(); }
      ctx.stroke();
      if (lab !== 'space') {
        const cx = (top[0][0] + top[2][0]) / 2, cy = (top[0][1] + top[2][1]) / 2 + 4;
        const fs = lab.length > 1 && !isAct ? 11 : 13;
        txt(ctx, label, cx, cy, { font: `500 ${fs}px "JetBrains Mono"`, color: isAct ? mixHex(pal.dim, pal.hot, actionHot) : (lit ? pal.phos : rgba(pal.dim, 0.8)), align: 'center', base: 'middle' });
      }
    }
  }
  ctx.restore();
}
// knob: angle in turns (0..1). dots: palette swatches beside it (COLOR knob)
export function knob(ctx, pal, x, y, label, angle, { dots = null, active = 0, led = null } = {}) {
  txt(ctx, label, x - 30 - (dots ? dots.length * 9 + 8 : 0), y + 4, { font: '600 11px Inter', color: pal.dim, align: 'right', ls: 1.6 });
  if (dots) dots.forEach((c, i) => { ctx.beginPath(); ctx.arc(x - 26 - (dots.length - 1 - i) * 9, y, 2.6, 0, 7); ctx.fillStyle = i === active ? c : rgba(c, 0.35); ctx.fill(); });
  ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.strokeStyle = pal.dim; ctx.lineWidth = 1.6; ctx.stroke();
  const a = angle * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4); ctx.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11); ctx.strokeStyle = pal.phos; ctx.lineWidth = 2; ctx.stroke();
  if (led !== null) { ctx.beginPath(); ctx.arc(x + 38, y, 5, 0, 7); ctx.fillStyle = led ? pal.ok : rgba(pal.hot, 0.8); ctx.shadowColor = led ? pal.ok : pal.hot; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0; }
}
export function monitor(ctx, pal, brand, { stand = false } = {}) {
  const { mon, bez } = DEV;
  ctx.save(); ctx.strokeStyle = pal.line; ctx.lineWidth = 1.8;
  // the body stops just above the keyboard (DEV.kb.yTop), so its outline never runs through the keys
  const bodyH = DEV.kb.yTop - 14 - mon.y;
  rr(ctx, mon.x, mon.y, mon.w, bodyH, [mon.r, mon.r, 10, 10]); ctx.stroke();
  rr(ctx, mon.x + 10, mon.y + 10, mon.w - 20, bodyH - 20, [mon.r - 8, mon.r - 8, 6, 6]); ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
  rr(ctx, bez.x, bez.y, bez.w, bez.h, bez.r); ctx.fillStyle = mixHex(pal.stage, pal.glass, 0.35); ctx.fill(); ctx.stroke();
  if (stand) { // a foot instead of a keyboard
    const by = mon.y + bodyH; ctx.beginPath(); ctx.moveTo(860, by); ctx.lineTo(830, by + 60); ctx.lineTo(1090, by + 60); ctx.lineTo(1060, by); ctx.stroke();
    rr(ctx, 700, by + 60, 520, 16, 8); ctx.stroke();
  }
  // strip: brand + speaker grille
  const y = DEV.strip.y;
  txt(ctx, '>_', 458, y + 6, { font: '700 16px "JetBrains Mono"', color: pal.dim });
  txt(ctx, brand, 486, y + 7, { font: '700 17px Inter', color: pal.dim, ls: 0.5 });
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(620, y - 6 + i * 4); ctx.lineTo(1140, y - 6 + i * 4); ctx.strokeStyle = rgba(pal.dim, 0.25 - i * 0.04); ctx.lineWidth = 1; ctx.stroke(); }
  ctx.restore();
}

// ---------- cursor ----------
export function cursor(ctx, x, y, down = 0, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(1.25 - down * 0.15, 1.25 - down * 0.15);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(5.5, 17); ctx.lineTo(9.5, 26); ctx.lineTo(13, 24.5); ctx.lineTo(9, 16); ctx.lineTo(16, 16); ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4; ctx.fill(); ctx.stroke(); ctx.restore();
}
// path: [[t, x, y, down?], ...] keyframes -> eased position
export function cursorAt(path, t) {
  if (t <= path[0][0]) return path[0];
  for (let i = 1; i < path.length; i++) if (t <= path[i][0]) {
    const [t0, x0, y0] = path[i - 1], [t1, x1, y1, d] = path[i], k = ease((t - t0) / (t1 - t0));
    return [t, lerp(x0, x1, k), lerp(y0, y1, k), d || 0];
  }
  return path[path.length - 1];
}

// ---------- glyph rain ----------
export function rain(ctx, t, t0, w, h, pal, glyphs = '{}[]":,', n = 46) {
  const k = t - t0; if (k < 0 || k > 4) return;
  for (let i = 0; i < n; i++) {
    const x = hash(i) * w, d = hash(i + 50) * 0.8, sp = 120 + hash(i + 9) * 220;
    const y = -20 + (k - d) * sp + hash(i + 3) * 60; if (k < d || y > h + 20) continue;
    const a = clamp(1.4 - (k - d) * 0.45) * (0.5 + hash(i + 7) * 0.5);
    txt(ctx, glyphs[i % glyphs.length], x, y, { font: `600 ${14 + hash(i + 4) * 10}px "JetBrains Mono"`, color: i % 3 ? pal.hot : pal.phos, alpha: a, align: 'center', deco: true });
  }
}

// ---------- caption header + counter + footer ----------
export function caption(ctx, pal, segs, { y = 78, size = 52, alpha = 1, badge = null, W = 1920 } = {}) {
  const font = `600 ${size}px Inter`;
  const w = segText(ctx, segs.map(([s, c]) => [s, readable(c === 'mark' ? pal.mark : c || pal.head, pal.stage)]), W / 2 - (badge ? 80 : 0), y, font, alpha);
  if (badge) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.font = '500 18px "JetBrains Mono"'; const bw = ctx.measureText(badge).width + 28;
    const bx = W / 2 - 80 + w / 2 + 22; rr(ctx, bx, y - 33, bw, 34, 6); ctx.strokeStyle = rgba(pal.head, 0.3); ctx.lineWidth = 1.2; ctx.stroke();
    txt(ctx, badge, bx + 14, y - 10, { font: '500 18px "JetBrains Mono"', color: rgba(pal.head, 0.85) }); ctx.restore();
  }
}
export function chrome(ctx, pal, left, i, n, W = 1920, H = 1080) {
  txt(ctx, left, 28, H - 26, { font: '500 15px "JetBrains Mono"', color: rgba(pal.head, 0.45), ls: 2.5 });
  txt(ctx, `${String(i).padStart(2, '0')} / ${String(n).padStart(2, '0')}`, W - 28, H - 26, { font: '500 15px "JetBrains Mono"', color: rgba(pal.head, 0.45), align: 'right', ls: 2.5 });
}
