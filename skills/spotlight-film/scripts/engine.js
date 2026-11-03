// Deterministic kinetic-film engine. Every frame is a pure function of time:
// the renderer calls window.renderFrame(t, anchor) and screenshots the stage.
// No CSS animations, transitions, timers or Math.random() (use rng(seed)).

export const W = 1920, H = 1080;

// ---------- theme ----------
// Two looks share every shot: 'dark' (black stage, metallic type, warm light beams) and
// 'light' (white stage, graphite type, beams as pale wedges brightest at the anchor, a soft
// shadow under a cut-out anchor). Pick with ?theme=light or window.SF_THEME = 'light' set
// before the film loads. Materials should take their edge tone from THEME.edge.
const THEME_NAME = new URLSearchParams(location.search).get('theme') || globalThis.SF_THEME || 'dark';
export const THEME = THEME_NAME === 'light' ? {
  name: 'light', bg: '#f5f5f3', ink: '#1d1d1f', muted: '#86868b', edge: '#e9e8e4',
  metal: 'linear-gradient(100deg,#111113 0%,#3d3e44 40%,#6b6c73 55%,#1d1d1f 100%)',
  beamDim: 0.86, beamShade: 0.1, grain: 0.5, shadow: 'drop-shadow(0 26px 34px rgba(0,0,0,.24))',
} : {
  name: 'dark', bg: '#000000', ink: '#f5f5f7', muted: '#6e6e73', edge: '#141414',
  metal: 'linear-gradient(100deg,#7d7f86 0%,#d9dade 38%,#ffffff 55%,#a9abb2 100%)',
  beamDim: 0.38, beamShade: 0.28, grain: 1, shadow: null,
};
// relative luminance (0..1) of a CSS hex colour
export const hexLum = (h) => { const n = parseInt(h.slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };

// ---------- light colour ----------
// One light colour for the whole film: every beam's hot core, the halo, sweep lines,
// the lit() ramp and drawn light all take it from lc(). Default warm white.
// setLight('warm' | 'cool' | [r, g, b] | 'auto') picks it; 'auto' (useFace(..., { light: 'auto' }))
// takes the product's own accent from the face, so an orange icon gives an orange-tinted light and
// a grey product keeps the warm white. A beam can follow its own content with tone: 'content'.
// lc(s, k) -> 'r,g,b': s = how far from white (0 white, ~0.4 the hot core, 1 the full hue),
// k = brightness (1, or less for the dark end of a ramp).
const WARM = [255, 202, 128], COOL = [185, 211, 255];
let HUE = WARM;
// a hue as a light: brightest channel 255, saturation set to `sat` (the warm white's is 0.5),
// so any accent reads as light of the same strength, not as paint
export function asLight(rgb, sat = 0.75) {
  const m = Math.max(...rgb, 1), n = rgb.map((v) => (v / m) * 255), lo = Math.min(...n);
  const s0 = 1 - lo / 255;
  if (s0 < 0.12) return WARM; // grey, white or black: no accent, keep the warm white
  return n.map((v) => Math.round(255 - ((255 - v) * sat) / s0));
}
// the accent of a canvas: the mean colour of its saturated, visible pixels (weighted by
// saturation squared), or null when it has none (a grey product)
export function accentOf(cv) {
  const W = cv.width, H = cv.height, d = cv.getContext('2d').getImageData(0, 0, W, H).data, step = Math.max(1, Math.floor(Math.sqrt((W * H) / 40000)));
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
    const i = (y * W + x) * 4; if (d[i + 3] < 128) continue;
    const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
    if (mx < 40) continue;
    const sat = (mx - mn) / mx; if (sat < 0.25) continue;
    const wt = sat * sat; r += d[i] * wt; g += d[i + 1] * wt; b += d[i + 2] * wt; n += wt;
  }
  return n > (W * H) / step / step * 0.004 ? [r / n, g / n, b / n] : null;
}
export function setLight(c = 'warm', { sat } = {}) {
  HUE = c === 'cool' ? COOL : c === 'warm' || !c ? WARM : Array.isArray(c) ? asLight(c, sat) : lightOf(c.canvas || c, sat);
  return HUE;
}
export const lightOf = (cv, sat) => { const a = accentOf(cv); return a ? asLight(a, sat) : WARM; };
const hueFor = (tone) => (tone === 'cool' ? COOL : Array.isArray(tone) ? tone : HUE);
export const lc = (s, k = 1, tone) => hueFor(tone).map((v) => Math.round(Math.min(255, Math.max(0, (255 + (v - 255) * s) * k)))).join(',');

// ---------- easing ----------
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x, d = dx(t);
      if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1;
    for (let i = 0; i < 30 && Math.abs(sx(t) - x) > 1e-6; i++) {
      if (sx(t) < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

// Named curves. See references/style.md for when to use each.
export const E = {
  linear: (t) => t,
  snap: bezier(0.2, 0, 0, 1),        // decisive entry, long soft landing
  glide: bezier(0.45, 0, 0.2, 1),    // symmetric travel between holds
  launch: bezier(0.7, 0, 0.84, 0),   // accelerating exit, ends at full speed
  settle: bezier(0.16, 1, 0.3, 1),   // very fast start, gentle settle
  expoOut: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  drift: (t) => t,                   // constant-velocity holds (camera creep)
};

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, p) => a + (b - a) * p;
export const prog = (t, a, b, ease = E.linear) => ease(clamp((t - a) / (b - a), 0, 1));

// Keyframes: [[time, value, easeToNext?], ...]; values may be numbers or arrays.
export function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0, e = E.glide] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const p = e((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((v, j) => lerp(v, v1[j], p)) : lerp(v0, v1, p);
    }
  }
  return keys[keys.length - 1][1];
}

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------- DOM helpers ----------
export function el(tag, parent, style = {}, props = {}) {
  const n = document.createElement(tag);
  Object.assign(n.style, style);
  Object.assign(n, props);
  if (parent) parent.appendChild(n);
  return n;
}

// A 3D space covering the frame. Children are positioned relative to frame centre.
export function space(parent, { perspective = 2200, ox = 50, oy = 50 } = {}) {
  return el('div', parent, {
    position: 'absolute', inset: '0', perspective: `${perspective}px`,
    perspectiveOrigin: `${ox}% ${oy}%`, transformStyle: 'preserve-3d', overflow: 'hidden',
  });
}

// A group or plane: zero-size node at frame centre; transform via xf().
export function group(parent) {
  return el('div', parent, {
    position: 'absolute', left: `${W / 2}px`, top: `${H / 2}px`, width: '0', height: '0',
    transformStyle: 'preserve-3d',
  });
}

// x,y,z in px from frame centre; rotations in degrees; s = scale.
export function xf(node, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, o } = {}) {
  node.style.transform =
    `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`;
  if (o !== undefined) node.style.opacity = o;
}

// A graphic window: a w×h box centred on (x,y) of its parent plane, clipped to poly.
// poly: [[u,v],...] in 0..1 of the box. content: a node (canvas, img, video...) that fills it.
export function win(parent, { w, h, x = 0, y = 0, poly, content }) {
  const box = el('div', parent, {
    position: 'absolute', left: `${x - w / 2}px`, top: `${y - h / 2}px`, width: `${w}px`, height: `${h}px`,
    overflow: 'hidden', backfaceVisibility: 'hidden',
  });
  const api = {
    box,
    setPoly(p) { box.style.clipPath = p ? `polygon(${p.map(([u, v]) => `${(u * 100).toFixed(3)}% ${(v * 100).toFixed(3)}%`).join(',')})` : 'none'; },
    setContent(node) {
      box.replaceChildren(node);
      Object.assign(node.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover' });
    },
  };
  api.setPoly(poly);
  if (content) api.setContent(content);
  return api;
}

// A window from references/window-shapes.json, placed where it sat in the reference frame
// (bbox is a share of the frame). Parent should be a group at frame centre.
export function traced(parent, shape, { content, scale = 1, dx = 0, dy = 0 } = {}) {
  const [bx, by, bw, bh] = shape.bbox;
  return win(parent, {
    w: bw * W * scale, h: bh * H * scale,
    x: ((bx + bw / 2 - 0.5) * W + dx) * scale, y: ((by + bh / 2 - 0.5) * H + dy) * scale,
    poly: shape.local_poly, content,
  });
}

// A window from absolute points in frame px, relative to frame centre (group space):
// pts = [[x,y],...]. Use with funnel() or with hand-placed vertices.
export function polyWin(parent, pts, content) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
  const api = win(parent, { w, h, x: x0 + w / 2, y: y0 + h / 2, poly: pts.map(([x, y]) => [(x - x0) / w, (y - y0) / h]), content });
  api.frame = { x0, y0, w, h };
  api.local = ([x, y]) => [(x - x0) / w, (y - y0) / h]; // frame px -> 0..1 of this window
  api.setPts = (p2) => {
    const a = p2.map(([x, y]) => [(x - x0) / w, (y - y0) / h]);
    api.setPoly(a);
  };
  return api;
}

// The reference's core window: a beam that opens out of the product.
// at = product point (px from frame centre), axis = direction the window extends (deg,
// 0 = right, 90 = down), neck = width of the narrow end (≈ product width), spreadL/R =
// how far each side opens from the axis (deg), length = reach in px. Returns frame-px points
// [neckL, farL, farR, neckR]; grow it out of the product by animating length.
export function funnel({ at, axis, neck, spreadL = 25, spreadR = 25, length }) {
  const r = (d) => (d * Math.PI) / 180;
  const ux = Math.cos(r(axis)), uy = Math.sin(r(axis));
  const px = -uy, py = ux; // left-hand normal
  const nL = [at[0] + (px * neck) / 2, at[1] + (py * neck) / 2];
  const nR = [at[0] - (px * neck) / 2, at[1] - (py * neck) / 2];
  const ray = (p, a) => [p[0] + Math.cos(r(a)) * length, p[1] + Math.sin(r(a)) * length];
  return [nL, ray(nL, axis + spreadL), ray(nR, axis - spreadR), nR];
}

// A flat product (card, phone, tablet) built from CSS 3D faces so it shares the exact
// space of the windows and type. top: node for the top face (canvas). A fixed diagonal
// gradient on the top face fakes the key light; edges are a flat lighter tone.
export function slab(parent, { w, h, depth = 14, top, edge = '#d9d9de', radius = 18 } = {}) {
  const root = el('div', parent, { position: 'absolute', left: '0', top: '0', width: '0', height: '0', transformStyle: 'preserve-3d' });
  const face = (fw, fh, tf, bg) => el('div', root, {
    position: 'absolute', left: `${-fw / 2}px`, top: `${-fh / 2}px`, width: `${fw}px`, height: `${fh}px`,
    transform: tf, background: bg, backfaceVisibility: 'hidden',
  });
  const d2 = depth / 2;
  const topF = face(w, h, `translateZ(${d2}px)`, '#fff');
  Object.assign(topF.style, { borderRadius: `${radius}px`, overflow: 'hidden' });
  if (top) { Object.assign(top.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' }); topF.appendChild(top); }
  const shade = el('div', topF, { position: 'absolute', inset: '0', background: 'linear-gradient(135deg,rgba(255,255,255,.18),rgba(0,0,0,.28))', mixBlendMode: 'multiply' });
  const bot = face(w, h, `rotateY(180deg) translateZ(${d2}px)`, '#2a2a2e');
  bot.style.borderRadius = `${radius}px`;
  const sides = [
    face(w - radius, depth, `translateY(${-h / 2}px) rotateX(90deg)`, edge),
    face(w - radius, depth, `translateY(${h / 2}px) rotateX(-90deg)`, edge),
    face(depth, h - radius, `translateX(${-w / 2}px) rotateY(-90deg)`, edge),
    face(depth, h - radius, `translateX(${w / 2}px) rotateY(90deg)`, edge),
  ];
  return { root, top: topF, shade, sides, bot };
}

// Content lit from the anchor. The window becomes the light cone: a warm falloff from
// `from` (0..1 of the window, usually the anchor point) fills the whole silhouette so it
// reads against black, and the product material (UI canvas, footage) sits inside it at its
// own aspect ratio. panel = { x, y, w } in 0..1 of the window; tilt in degrees.
export function lit(content, { from = [0, 1], panel = { x: 0.5, y: 0.5, w: 0.6 }, tilt = 0, aspect = 16 / 9, tone = 'warm' } = {}) {
  const box = el('div', null, { position: 'absolute', inset: '0', overflow: 'hidden' });
  const [u, v] = from.map((n) => `${(n * 100).toFixed(1)}%`);
  const t = tone === 'warm' ? undefined : tone;
  const ramp = `rgb(${lc(0.23, 1, t)}) 0%, rgb(${lc(0.76, 0.886, t)}) 20%, rgb(${lc(1.1, 0.54, t)}) 52%, rgb(${lc(1.17, 0.14, t)}) 100%`;
  box.style.background = `radial-gradient(circle at ${u} ${v}, ${ramp})`;
  const holder = el('div', box, {
    position: 'absolute', left: `${panel.x * 100}%`, top: `${panel.y * 100}%`, width: `${panel.w * 100}%`,
    aspectRatio: String(aspect), transform: `translate(-50%,-50%) rotate(${tilt}deg)`,
    boxShadow: '0 30px 80px rgba(0,0,0,.45)', borderRadius: '10px', overflow: 'hidden',
  });
  Object.assign(content.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
  holder.appendChild(content);
  box.panel = holder; // animate holder.style.translate for a slow drift inside the beam
  // light falloff over the panel too, so it sits inside the same beam
  el('div', box, { position: 'absolute', inset: '0', background: `radial-gradient(circle at ${u} ${v}, rgba(${lc(0.31, 1, t)},.18) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,.45) 100%)` });
  return box;
}

// A light-source anchor for films without a physical subject: hot core + bloom, placed
// where the beams' narrow ends meet. size = bloom diameter in px.
export function glow(parent, { size = 260, color = lc(0.39) } = {}) {
  const n = el('div', parent, {
    position: 'absolute', left: `${-size / 2}px`, top: `${-size / 2}px`, width: `${size}px`, height: `${size}px`,
    borderRadius: '50%', mixBlendMode: 'screen', pointerEvents: 'none',
    background: `radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(${color},.95) 7%, rgba(${color},.45) 20%, rgba(${color},.12) 42%, rgba(${color},0) 70%)`,
  });
  return n;
}

// Two stacked 3D spaces sharing one transform. `base` holds beams and type; `top` holds the
// anchor. Separate rendering contexts, painted in order, so nothing can ever intersect or
// cover the anchor, whatever its z or rotation. set(pose) moves both together.
export function layers(root, { perspective = 2200 } = {}) {
  const base = group(space(root, { perspective }));
  const top = group(space(root, { perspective }));
  return { base, top, set: (p) => { xf(base, p); xf(top, p); } };
}

// Deterministic film grain over the whole frame. Call g.draw(t) every frame.
export function grain(parent, { amount = 0.07, fps = 24 } = {}) {
  const tiles = [0, 1, 2, 3].map((k) => {
    const c = el('canvas', null, {}, { width: 480, height: 270 });
    const x = c.getContext('2d'), img = x.createImageData(480, 270), r = rng(k * 7919 + 13);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (r() + r() + r() - 1.5) * 120;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return c.toDataURL();
  });
  const n = el('div', parent, { position: 'absolute', inset: '0', pointerEvents: 'none', mixBlendMode: 'overlay', opacity: amount * THEME.grain, backgroundSize: '480px 270px', imageRendering: 'pixelated' });
  return { node: n, draw: (t) => { n.style.backgroundImage = `url(${tiles[Math.floor(t * fps) % 4]})`; } };
}

// Interpolate two polygons with equal vertex count (only for verified/authored morphs).
export const lerpPoly = (a, b, p) => a.map(([u, v], i) => [lerp(u, b[i][0], p), lerp(v, b[i][1], p)]);

// ---------- typography ----------
export const FONT = "'Archivo Variable', 'Archivo', sans-serif";
export const METAL = THEME.metal;

// size = cap-height-ish px; wdth 62 (condensed) .. 125 (expanded); wght 100..900.
export function text(parent, str, { size = 80, wdth = 62, wght = 800, track = 0, fill = METAL, x = 0, y = 0, anchor = 'left', lh = 0.86 } = {}) {
  const n = el('div', parent, {
    position: 'absolute', whiteSpace: 'pre', fontFamily: FONT, fontSize: `${size}px`,
    fontStretch: `${wdth}%`, fontWeight: wght, letterSpacing: `${track}em`, lineHeight: lh,
    color: THEME.ink, textTransform: 'uppercase', backfaceVisibility: 'hidden',
  }, { textContent: str });
  // names written in mixed case (eBay, pH, mRNA) keep their case inside the uppercase type:
  // "EBAY" is not the name
  const KEEP = /\b([a-z]+[A-Z][A-Za-z0-9]*)\b/g;
  if (KEEP.test(str)) {
    const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    n.innerHTML = esc(str).replace(KEEP, '<span style="text-transform:none">$1</span>');
  }
  if (fill && fill !== 'solid') {
    Object.assign(n.style, { backgroundImage: fill, webkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' });
  }
  placeText(n, x, y, anchor);
  return n;
}

export function placeText(n, x, y, anchor = 'left') {
  const tx = anchor === 'center' ? '-50%' : anchor === 'right' ? '-100%' : '0';
  n.style.left = `${x}px`;
  n.style.top = `${y}px`;
  n.style.transform = `translate(${tx},-100%)`; // y = baseline-ish (bottom of box)
}

// Position on a polygon edge A->B (in box px), offset along the outward normal.
export function edgeAnchor(A, B, frac, offset) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  return { x: A[0] + dx * frac - uy * offset, y: A[1] + dy * frac + ux * offset, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

// ---------- canvas materials ----------
// material(w,h,draw) -> { canvas, draw(t) }. draw(ctx,w,h,t) must be deterministic in t.
export function material(w, h, draw) {
  const canvas = el('canvas', null, {}, { width: w, height: h });
  const ctx = canvas.getContext('2d');
  return { canvas, draw: (t) => { ctx.save(); draw(ctx, w, h, t); ctx.restore(); } };
}

// ---------- footage ----------
// footage(src, opts) -> { canvas, draw(t), video }: a supplied clip (VP9 WebM or H.264 MP4) as a
// material, frame-accurate. draw(t) asks for clip time start + t × rate; renderFrame() seeks every
// clip that was asked for, waits for the decoded frame, and runs the frame once more, so each
// rendered frame shows exactly the clip frame for its time (also under --blur). Use it anywhere a
// canvas material goes: a beam, insert(), burst(), typeSlot({ fill: 'footage' }). Create clips at
// module level (const run = footage(...); then m: () => run) so ready() waits for them to load.
//   fit 'cover' (default) or 'contain'; loop wraps past the end, otherwise it holds the last frame.
const CLIPS = new Set();
export function footage(src, { w = 1280, h = 720, start = 0, rate = 1, loop = false, fit = 'cover' } = {}) {
  const video = el('video', null, {}, { src, muted: true, playsInline: true, preload: 'auto' });
  const canvas = el('canvas', null, {}, { width: w, height: h });
  const g = canvas.getContext('2d');
  const clip = { want: null, shown: null };
  const seek = (t) => new Promise((ok) => { video.addEventListener('seeked', ok, { once: true }); video.currentTime = t; });
  // loaded: the first frame (at `start`) is decoded and painted, so a beam that samples the
  // material's background in setup sees the footage, not a blank canvas
  clip.loaded = new Promise((ok, fail) => {
    video.addEventListener('loadeddata', ok, { once: true });
    video.addEventListener('error', () => fail(new Error(`footage: cannot load ${src} (use VP9 WebM or H.264 MP4)`)), { once: true });
  }).then(async () => { await seek(at(0)); clip.shown = at(0); paint(); });
  const at = (t) => {
    const d = video.duration || Infinity, x = Math.max(0, start + t * rate);
    if (!isFinite(d)) return x;
    return loop ? x % d : Math.min(x, d - 0.02);
  };
  const paint = () => {
    const vw = video.videoWidth || w, vh = video.videoHeight || h;
    const k = (fit === 'contain' ? Math.min : Math.max)(w / vw, h / vh);
    g.fillStyle = THEME.edge; g.fillRect(0, 0, w, h);
    g.drawImage(video, (w - vw * k) / 2, (h - vh * k) / 2, vw * k, vh * k);
  };
  clip.sync = async () => {
    if (clip.want === null || clip.want === clip.shown) return false;
    await clip.loaded;
    const t = clip.want;
    await seek(t);
    clip.shown = t;
    return true;
  };
  CLIPS.add(clip);
  return { canvas, video, draw(t) { clip.want = at(t); if (clip.shown === clip.want) paint(); } };
}

// ---------- film runtime ----------
// shots: [{ id, start, end, setup(root, film) -> ctx, frame(local, ctx, info) }]
// events: [{ t, type, dur }] optional markers written to the timeline (cuts are added as 'hit'),
// for anyone laying sound under the film in an editor.
export function defineFilm({ fps = 24, duration, bpm = 120, beat0 = 0, shots, events = [] }) {
  const stage = document.getElementById('stage');
  const scale = Number(new URLSearchParams(location.search).get('scale') || 1);
  if (scale !== 1) {
    stage.style.transform = `scale(${scale})`;
    stage.style.transformOrigin = '0 0';
  }
  stage.style.background = THEME.bg; document.body.style.background = THEME.bg;
  let current = null, ctx = null, root = null;
  const shotAt = (t) => shots.find((s) => t >= s.start && t < s.end) || shots[shots.length - 1];

  // anchor = the frame's own time. Shutter sub-samples (t != anchor) stay inside the
  // anchor's shot so motion blur never mixes two sides of a hard cut.
  window.renderFrame = async (t, anchor = t) => {
    const shot = shotAt(anchor);
    if (shot !== current) {
      stage.replaceChildren();
      root = el('div', stage, { position: 'absolute', inset: '0', overflow: 'hidden' });
      current = shot;
      ctx = await shot.setup(root);
    }
    const local = clamp(t, shot.start, shot.end - 1e-4) - shot.start;
    CLIPS.forEach((c) => { c.want = null; });
    await shot.frame(local, ctx, { t, dur: shot.end - shot.start, shot });
    // footage asked for a frame it has not decoded yet: seek, then draw the frame again
    const seeked = await Promise.all([...CLIPS].map((c) => c.sync()));
    if (seeked.some(Boolean)) await shot.frame(local, ctx, { t, dur: shot.end - shot.start, shot });
    return shot.id;
  };

  const cuts = shots.slice(1).map((s) => s.start);
  window.__film = {
    fps, duration, bpm, beat0, width: W, height: H,
    shots: shots.map(({ id, start, end }) => ({ id, start, end })),
    cuts,
    events: [...cuts.map((t) => ({ t, type: 'hit' })), ...events].sort((a, b) => a.t - b.t),
  };
}

export async function ready(fonts = [`800 80px ${FONT}`]) {
  await Promise.all(fonts.map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  await Promise.all([...CLIPS].map((c) => c.loaded));
  window.__ready = true;
}
