// Anchor + beam toolkit for kinetic product films. Product-neutral: give it a face material
// with useFace(), build shots with anchor()/shine()/bloom(), and run them with runFilm().
// URL flags: ?anchor=object|light, ?nomatch.
//
// Rules this toolkit enforces (see references/key-frames.md):
// 1. One anchor and ONE beam per frame. Variety comes from cuts, not from a fan of beams.
// 2. The beam is attached to the anchor's own shape (object: its edge; light: its centre).
// 3. Clean straight edges only; a beam is cut by the frame, never by arbitrary notches.
// 4. Window content sits whole and legible in the beam, lit from the anchor.
// 5. Type sits on a line the composition already has (anchor edge, beam side).
import {
  E, kf, prog, lerp, clamp, el, space, group, xf, polyWin, text, slab, glow, layers, grain, defineFilm, THEME, hexLum, lc, setLight, lightOf,
} from './engine.js';

export const LIGHT = (new URLSearchParams(location.search).get('anchor') || 'object') === 'light';
// The anchor's face: any material (a card, a device top view, an app icon, a logo slab).
// Call useFace(material) once before building shots; its aspect sets the slab's height.
// useFace(mat, { cutout: true }) for a face that is a cut-out photo with its own outline (a real
// product shot on alpha): the slab's card, rounded corners and edges are hidden so only the
// product shows. Otherwise `edge` (side colour) and `radius` (fraction of width) style the slab.
// The beam's neck sits on the face's VISIBLE outline, not on the canvas rectangle: a rounded
// tile or a cut-out with transparent margins would otherwise leave a dark gap between the anchor
// and the light. useFace() measures the visible box and corner radius from the face's alpha (or
// takes `radius` for a drawn slab); the neck points are the centres of the edge's corner arcs,
// tucked under the anchor, so the beam always comes out from beneath the face.
let cardMat = null, CARD_AR = 1.27, FACE = {}, SHAPE = { l: -1, r: 1, t: -1, b: 1, ru: 0.06, rv: 0.06 };
function faceShape(mat, opts) {
  const cv = mat.canvas, W = cv.width, H = cv.height;
  let x0 = 0, x1 = W - 1, y0 = 0, y1 = H - 1, rad = W * (opts.radius ?? 0.03), hull = null, alpha = null;
  if (opts.cutout) {
    mat.draw(0);
    const d = cv.getContext('2d').getImageData(0, 0, W, H).data, A = (x, y) => d[(y * W + x) * 4 + 3] > 100;
    const rows = [...Array(H).keys()].filter((y) => { for (let x = 0; x < W; x += 2) if (A(x, y)) return true; return false; });
    const cols = [...Array(W).keys()].filter((x) => { for (let y = 0; y < H; y += 2) if (A(x, y)) return true; return false; });
    if (rows.length && cols.length) {
      y0 = rows[0]; y1 = rows[rows.length - 1]; x0 = cols[0]; x1 = cols[cols.length - 1];
      // corner radius: rows from the top until the left inset closes to ≤ 1 px
      const inset = (y) => { for (let x = x0; x <= x1; x++) if (A(x, y)) return x - x0; return x1 - x0; };
      let k = 0; while (y0 + k < y1 && inset(y0 + k) > 1) k++;
      rad = Math.max(k, 1);
      // the outline's convex hull: a product that sits at an angle in its photo (an isometric
      // keyboard, a phone on its side) fills only part of its box, so a neck on the box edge
      // would float in empty space; neck() puts it on the hull edge that faces the beam instead
      const pts = [];
      for (let y = y0; y <= y1; y += 3) {
        let a0 = -1, a1 = -1;
        for (let x = x0; x <= x1; x++) if (A(x, y)) { a0 = x; break; }
        for (let x = x1; x >= x0; x--) if (A(x, y)) { a1 = x; break; }
        if (a0 >= 0) pts.push([a0, y], [a1, y]);
      }
      hull = convexHull(pts);
      // a coarse alpha map (1/8 scale) for the neck check in review()
      const g = 8, gw = Math.ceil(W / g), gh = Math.ceil(H / g), m = new Uint8Array(gw * gh);
      for (let y = 0; y < H; y += g) for (let x = 0; x < W; x += g) if (A(x, y)) m[(y / g) * gw + x / g] = 1;
      alpha = { m, gw, gh };
    }
  }
  const u = (x) => (x / W) * 2 - 1, v = (y) => (y / H) * 2 - 1;
  return { l: u(x0), r: u(x1 + 1), t: v(y0), b: v(y1 + 1), ru: Math.min((2 * rad) / W, 0.45), rv: Math.min((2 * rad) / H, 0.45),
    hull: hull && hull.map(([x, y]) => [u(x), v(y)]), alpha };
}
function convexHull(P) {
  P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const p of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of P.reverse()) { while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}
// the current face material (typeSlot() lays the face on its own type plane)
export const faceMat = () => cardMat;
// light: 'auto' tints the film's light toward the face's own accent (see setLight in engine.js);
// also 'warm' (default), 'cool' or [r, g, b]
export function useFace(mat, opts = {}) {
  cardMat = mat; CARD_AR = mat.canvas.height / mat.canvas.width; FACE = opts; SHAPE = faceShape(mat, opts);
  if (opts.light) { if (opts.light === 'auto') mat.draw(0); setLight(opts.light === 'auto' ? mat.canvas : opts.light); }
}
export const R = (d) => (d * Math.PI) / 180;

// ---------- anchor ----------
// pose on the plane: { x, y, rz, w }. Object: flat card lying on the plane (exact fit).
export function anchor(L, { x, y, rz = 0, w = 240 }) {
  const a = { x, y, rz, w, h: w * CARD_AR };
  // corner at (u, v) in -1..1 of the card, in plane coordinates
  a.pt = (u, v) => {
    const lx = (u * a.w) / 2, ly = (v * a.h) / 2, c = Math.cos(R(a.rz)), s = Math.sin(R(a.rz));
    return [a.x + lx * c - ly * s, a.y + lx * s + ly * c];
  };
  // the two neck points on one edge: the centres of that edge's corner arcs on the face's
  // visible outline (SHAPE), so the beam starts under the card, its sides leave past the rounded
  // corners and no gap opens between a rounded or cut-out face and its light
  a.neckUV = (side) => {
    if (SHAPE.hull && !LIGHT) return hullNeck(a, side);
    const e = { top: [[-1, -1], [1, -1]], right: [[1, -1], [1, 1]], bottom: [[1, 1], [-1, 1]], left: [[-1, 1], [-1, -1]] }[side];
    const S = SHAPE;
    return e.map(([su, sv]) => [su > 0 ? S.r - S.ru : S.l + S.ru, sv > 0 ? S.b - S.rv : S.t + S.rv]);
  };
  a.neck = (side) => a.neckUV(side).map(([u, v]) => a.pt(u, v));
  if (LIGHT) {
    const holder = el('div', L.top, { position: 'absolute', left: '0', top: '0' });
    glow(holder, { size: w * 1.3 });
    const halo = el('div', L.base, { position: 'absolute', left: '0', top: '0' });
    glow(halo, { size: w * 3, color: lc(0.75) }).style.opacity = 0.5;
    a.root = holder;
    a.set = (p = {}) => { const q = { x: a.x, y: a.y, ...p }; xf(holder, q); xf(halo, { x: q.x, y: q.y, s: q.s || 1 }); };
    a.draw = () => {};
  } else {
    // A thick card lying in the plane; a.side is the edge the beam leaves from.
    const c = cardMat.canvas.cloneNode();
    const wrap = el('div', L.top, { position: 'absolute', left: '0', top: '0', transformStyle: 'preserve-3d' });
    const body = el('div', wrap, { position: 'absolute', left: '0', top: '0', transformStyle: 'preserve-3d' });
    const depth = Math.max(8, w * 0.06);
    const s = slab(body, { w, h: a.h, depth, top: c, edge: FACE.edge || '#cfc9bd', radius: w * (FACE.radius ?? 0.03) });
    s.sides.forEach((f, i) => { f.style.background = FACE.edge || `linear-gradient(${i < 2 ? 90 : 180}deg, #b9b2a5, #e9e4da 50%, #a8a194)`; });
    s.root.style.transform = `translateZ(${depth / 2}px)`;
    if (FACE.cutout) {
      const top = c.parentElement;
      Object.assign(top.style, { background: 'transparent', borderRadius: '0', overflow: 'visible' });
      wrap.querySelectorAll('div').forEach((d) => { if (!d.contains(top) && d.parentElement !== top) d.style.display = 'none'; });
      top.querySelectorAll('div').forEach((d) => { d.style.display = 'none'; });
      if (THEME.shadow) c.style.filter = THEME.shadow; // light stage: the product sits on the page
    }
    a.root = wrap;
    a.side = 'bottom';
    a.set = (p = {}) => {
      xf(wrap, { x: a.x, y: a.y, rz: a.rz, ...p });
    };
    a.face = c;
    a.draw = (t) => { cardMat.draw(t); c.getContext('2d').drawImage(cardMat.canvas, 0, 0); };
  }
  a.set();
  return a;
}

// cut-out face: the neck is a chord across the product, square to the side the beam leaves from
// (so the beam keeps its symmetric shape), pushed as far toward that side as it can go with both
// ends still on the product, then tucked 3 % of the width under it. A product lying at an angle in
// its photo (an isometric keyboard) fills only part of its box: a neck on the box edge would float
// in empty space, and a neck on its slanted outline would tilt the whole beam.
function hullNeck(a, side) {
  const dir = { top: [0, -1], right: [1, 0], bottom: [0, 1], left: [-1, 0] }[side], per = [-dir[1], dir[0]];
  const H = SHAPE.hull.map(([u, v]) => [(u * a.w) / 2, (v * a.h) / 2]);
  const c = [H.reduce((t, p) => t + p[0], 0) / H.length, H.reduce((t, p) => t + p[1], 0) / H.length];
  const al = SHAPE.alpha;
  const on = ([x, y]) => {
    const gx = Math.floor(((x / (a.w / 2) + 1) / 2) * al.gw), gy = Math.floor(((y / (a.h / 2) + 1) / 2) * al.gh);
    return gx >= 0 && gy >= 0 && gx < al.gw && gy < al.gh && al.m[gy * al.gw + gx] === 1;
  };
  // the product's extent across the beam: the chord spans 50 % of it (as wide as fits)
  const across = Math.max(...H.map((p) => (p[0] - c[0]) * per[0] + (p[1] - c[1]) * per[1])) - Math.min(...H.map((p) => (p[0] - c[0]) * per[0] + (p[1] - c[1]) * per[1]));
  const reach = Math.max(...H.map((p) => (p[0] - c[0]) * dir[0] + (p[1] - c[1]) * dir[1]));
  const end = (t, hw, sg, m = 0) => [c[0] + dir[0] * t + per[0] * sg * (hw + m), c[1] + dir[1] * t + per[1] * sg * (hw + m)];
  const step = a.w * 0.005, mg = a.w * 0.02;
  for (let hw = across * 0.25; hw > across * 0.05; hw *= 0.85) {
    for (let t = reach; t >= 0; t -= step) {
      if (on(end(t, hw, 1, mg)) && on(end(t, hw, -1, mg)) && on(end(t + mg, hw, 1)) && on(end(t + mg, hw, -1))) {
        const tt = t - a.w * 0.03;
        return [end(tt, hw, -1), end(tt, hw, 1)].map(([x, y]) => [(2 * x) / a.w, (2 * y) / a.h]);
      }
    }
  }
  return [end(0, across * 0.05, -1), end(0, across * 0.05, 1)].map(([x, y]) => [(2 * x) / a.w, (2 * y) / a.h]);
}
// neck check: each neck point must sit on the product (an opaque pixel within 2 % of the face's
// width), or the light starts in empty space beside it. Logged as [review] <id> neck.
function neckCheck(id, a, side) {
  const al = SHAPE.alpha;
  if (!al || LIGHT) return;
  const r = Math.max(1, Math.round(al.gw * 0.02));
  const on = ([u, v]) => {
    const cx = Math.round(((u + 1) / 2) * al.gw), cy = Math.round(((v + 1) / 2) * al.gh);
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++)
      if (x >= 0 && y >= 0 && x < al.gw && y < al.gh && al.m[y * al.gw + x]) return true;
    return false;
  };
  const ok = a.neckUV(side).every(on);
  console.log(`[review] ${id} neck ${ok ? 'OK ' : 'FIX'} ${ok ? '' : 'the light starts off the product: pass cutout: true, or check the face\'s alpha'}`);
}

// ---------- beam ----------
// neck: two points (object) — replaced by the anchor centre in light mode. far: the far
// vertices in order from neck[0]'s side to neck[1]'s side; put them off-frame to bleed.
// fill: { at: [x, y] centre of the content, w: content width } in plane px.
export function beam(parent, a, side, far, mat, fill = {}, { tone = 'warm' } = {}) {
  const neck = a.neck(side);
  const apex = LIGHT ? [[a.x, a.y]] : null;
  const pts = LIGHT ? [apex[0], ...far] : [neck[0], ...far, neck[1]];
  const w = polyWin(parent, pts, null);
  const { x0, y0, w: bw, h: bh } = w.frame;
  const box = el('div', null, { position: 'absolute', inset: '0', overflow: 'hidden', background: THEME.bg });
  // The UI sits whole inside the visible part of the beam, at a legible size, on its own
  // background colour (sampled from the canvas edge), so the window is filled edge to edge
  // without cropping the interface into fragments.
  const vw = fill.view || [-960, -540, 960, 540];
  const cx0 = Math.max(x0, vw[0]), cy0 = Math.max(y0, vw[1]), cx1 = Math.min(x0 + bw, vw[2]), cy1 = Math.min(y0 + bh, vw[3]);
  const ar = mat.canvas.width / mat.canvas.height;
  const at = fill.at || [(cx0 + cx1) / 2, (cy0 + cy1) / 2];
  const cw = fill.w || Math.min((cx1 - cx0) * 0.62, (cy1 - cy0) * 0.62 * ar), ch = cw / ar;
  mat.draw(0);
  const px = mat.canvas.getContext('2d').getImageData(3, mat.canvas.height - 3, 1, 1).data;
  // fill: 'sample' = the canvas edge colour; 'dim' = that colour pressed down so a light UI
  // does not turn the whole wedge into a flat white wall; 'auto' (default) dims light UIs.
  // On the light theme 'auto' presses a light UI down only a little (THEME.beamDim), so the
  // wedge reads as a pale shape on the white page, brightest at the anchor.
  const lum = (0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2]) / 255;
  const mode = fill.bg || 'auto', k = mode === 'dim' || (mode === 'auto' && lum > 0.55) ? fill.dim ?? THEME.beamDim : 1;
  box.style.background = `rgb(${px[0] * k},${px[1] * k},${px[2] * k})`;
  w.lum = lum * k;
  const panel = el('div', box, { position: 'absolute', left: `${at[0] - x0 - cw / 2}px`, top: `${at[1] - y0 - ch / 2}px`, width: `${cw}px`, height: `${ch}px` });
  Object.assign(mat.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
  panel.appendChild(mat.canvas);
  // light from the anchor: hot near the neck, falling off to the far end
  const src = LIGHT ? [a.x, a.y] : [(neck[0][0] + neck[1][0]) / 2, (neck[0][1] + neck[1][1]) / 2];
  // the light's reach is measured on the part of the beam inside the frame: bloom() passes a
  // 6000 px view so its beams can bleed, and measuring that made the hot core ~10x too wide,
  // washing every bloom beat's content to a flat beige
  const fx0 = Math.max(x0, -960), fy0 = Math.max(y0, -540), fx1 = Math.min(x0 + bw, 960), fy1 = Math.min(y0 + bh, 540);
  const u = `${src[0] - x0}px`, v = `${src[1] - y0}px`, r = 0.7 * Math.hypot(Math.max(fx1 - fx0, 1), Math.max(fy1 - fy0, 1));
  // tone: 'warm' (the film's light, see setLight), 'cool', [r, g, b], or 'content' (this beam's own content)
  const hot = lc(0.43, 1, tone === 'content' ? lightOf(mat.canvas) : tone === 'warm' ? undefined : tone);
  // THEME.beamGlow (default 1) scales the light's strength and THEME.beamReach (default 1) how far
  // it carries: a dark UI on a dark wedge read as a black hole with a faint tint (an upright-phone film)
  const gk = THEME.beamGlow ?? 1, rk = THEME.beamReach ?? 1, ga = (x) => Math.min(1, x * gk).toFixed(3), gs = (x) => `${Math.min(99, x * rk).toFixed(1)}%`;
  el('div', box, { position: 'absolute', inset: '0', mixBlendMode: 'screen', background: `radial-gradient(circle ${r}px at ${u} ${v}, rgba(${hot},${ga(LIGHT ? 0.95 : 0.75)}) 0%, rgba(${hot},${ga(0.32)}) ${gs(16)}, rgba(${hot},${ga(0.08)}) ${gs(34)}, rgba(${hot},0) ${gs(52)})` });
  el('div', box, { position: 'absolute', inset: '0', background: `radial-gradient(circle ${r}px at ${u} ${v}, rgba(0,0,0,0) 45%, rgba(0,0,0,${THEME.beamShade}) 100%)` });
  // the UI sits ON TOP of the light, as a crisp card: under the hot core and the edge shade it read
  // as a milky grey print (a light UI far from the anchor lost a third of its contrast). The light
  // and falloff stay on the wedge around it. fill.under: true puts it back under the light.
  if (!fill.under) {
    box.appendChild(panel);
    Object.assign(panel.style, { borderRadius: `${Math.round(cw * 0.012) + 4}px`, overflow: 'hidden', boxShadow: THEME.name === 'light' ? '0 18px 44px rgba(0,0,0,.18)' : '0 24px 60px rgba(0,0,0,.5)' });
  }
  w.setContent(box);
  Object.assign(w, { panel, pts, src });
  return w;
}
// ---------- content first ----------
// Decide where the CONTENT goes, then let the beam come to it: the anchor edge that faces the
// content becomes the neck, and each side of the beam is the tangent from its neck point to
// the content's corners (plus a margin), so the beam's sides graze the content and frame it.
// content = { x, y, w, m } in plane px (m = margin around the content, default 40).
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
export function aim(a, content, ar = 16 / 9) {
  const { x, y, w, m = 40 } = content, h = w / ar;
  const axis = [x - a.x, y - a.y];
  const sides = ['top', 'right', 'bottom', 'left'];
  const normals = sides.map((sd) => { const [p, q] = a.neck(sd), mid = [(p[0] + q[0]) / 2 - a.x, (p[1] + q[1]) / 2 - a.y]; return dot(mid, axis) / Math.hypot(...mid); });
  const side = sides[normals.indexOf(Math.max(...normals))];
  let [n0, n1] = a.neck(side);
  if (LIGHT) n0 = n1 = [a.x, a.y];
  const C = [[x - w / 2 - m, y - h / 2 - m], [x + w / 2 + m, y - h / 2 - m], [x + w / 2 + m, y + h / 2 + m], [x - w / 2 - m, y + h / 2 + m]];
  const ang = (P, Q) => { const d = [Q[0] - P[0], Q[1] - P[1]]; return Math.atan2(cross(axis, d), dot(axis, d)); };
  // which neck point is on the + side of the axis
  const s0 = cross(axis, [n0[0] - a.x, n0[1] - a.y]) >= 0 ? 1 : -1;
  const tangent = (P, sg) => C.reduce((best, Q) => (sg * ang(P, Q) > sg * ang(P, best) ? Q : best), C[0]);
  const far = (P, Q) => { const d = [Q[0] - P[0], Q[1] - P[1]], L = Math.hypot(...d); return [P[0] + (d[0] / L) * 3200, P[1] + (d[1] / L) * 3200]; };
  const f0 = far(n0, tangent(n0, s0)), f1 = far(n1, tangent(n1, -s0));
  const spread = Math.abs(ang(n0, tangent(n0, s0)) - ang(n1, tangent(n1, -s0))) * 180 / Math.PI;
  return { side, far: [f0, f1], spread };
}
// A beam aimed at its content. Returns the window; logs a composition review.
export function shine(parent, a, mat, content, opts = {}, id = '', extra = []) {
  const { side, far, spread } = aim(a, content, mat.canvas.width / mat.canvas.height);
  a.side = side;
  const w = beam(parent, a, side, far, mat, { at: [content.x, content.y], w: content.w, bg: opts.bg, dim: opts.dim }, opts);
  w.plane = !!opts.plane;
  if (id) neckCheck(id, a, side);
  if (id) review(id, a, w.pts, content, spread, mat.canvas.width / mat.canvas.height, extra, { plane: !!opts.plane, lum: w.lum });
  return w;
}
// Composition review, printed during stills: numbers to judge each frame by.
function inPoly(P, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > P[1]) !== (yj > P[1]) && P[0] < ((xj - xi) * (P[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
export function review(id, a, pts, content, spread, ar, extra = [], { plane = false, lum = null } = {}) {
  let inBeam = 0, n = 0;
  for (let i = 0; i < 64; i++) for (let j = 0; j < 36; j++) { n++; if (inPoly([-960 + (i + 0.5) * 30, -540 + (j + 0.5) * 30], pts)) inBeam++; }
  const h = content.w / ar;
  let cIn = 0, cN = 0, cFrame = 0;
  for (let i = 0; i < 16; i++) for (let j = 0; j < 9; j++) {
    const P = [content.x - content.w / 2 + ((i + 0.5) * content.w) / 16, content.y - h / 2 + ((j + 0.5) * h) / 9];
    cN++; if (inPoly(P, pts)) cIn++;
    if (Math.abs(P[0]) < 960 && Math.abs(P[1]) < 540) cFrame++;
  }
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => a.pt(u, v));
  const margin = Math.min(...corners.map(([x, y]) => Math.min(960 - Math.abs(x), 540 - Math.abs(y))));
  // balance: anchor, content and any type block (extra centres) should average out near the
  // frame's middle
  const ws = [[a.x, a.y], [content.x, content.y], ...extra];
  const mid = [ws.reduce((t, p) => t + p[0], 0) / ws.length, ws.reduce((t, p) => t + p[1], 0) / ws.length];
  const balance = Math.hypot(mid[0], mid[1]) / Math.hypot(960, 540);
  const r = { balance: +balance.toFixed(2), spread: +spread.toFixed(1), beamShare: +(inBeam / n).toFixed(2), contentInBeam: +(cIn / cN).toFixed(2), contentInFrame: +(cFrame / cN).toFixed(2), anchorMargin: Math.round(margin) };
  // plane shots (oblique title planes) are measured before the plane turns: frame checks do not apply
  if (plane) { delete r.contentInFrame; delete r.anchorMargin; delete r.balance; }
  // dark theme, brightWedge: share of the frame covered by a bright flat beam background (> 0.15
  // reads as a white wall). Light theme, wedgeContrast: the wedge must differ from the white page
  // (≥ 0.05 in luminance) or the beam disappears.
  if (lum != null && THEME.name === 'dark') r.brightWedge = +(r.beamShare * lum).toFixed(2);
  if (lum != null && THEME.name === 'light') r.wedgeContrast = +Math.abs(hexLum(THEME.bg) - lum).toFixed(2);
  const ok = r.spread >= 25 && r.spread <= 100 && r.beamShare >= 0.15 && r.beamShare <= 0.5 && r.contentInBeam >= 0.9
    && (plane || (r.contentInFrame >= 0.95 && r.anchorMargin >= 40 && (r.balance <= 0.18 || Math.hypot(a.x, a.y) < 40)))
    && (r.brightWedge == null || r.brightWedge <= 0.15) && (r.wedgeContrast == null || r.wedgeContrast >= 0.05);
  console.log(`[review] ${id} ${ok ? 'OK ' : 'FIX'} ${JSON.stringify(r)}`);
}

export const grow = (pts, o, p) => pts.map(([x, y]) => [o[0] + (x - o[0]) * p, o[1] + (y - o[1]) * p]);
export const drift = (w, l, dur, dx, dy) => { w.panel.style.translate = `${lerp(0, dx, l / dur)}px ${lerp(0, dy, l / dur)}px`; };
export const growIn = (w, l, t0 = 0, d = 0.55) => w.setPts(grow(w.pts, w.src, lerp(0.08, 1, prog(l, t0, t0 + d, E.snap))));

// ---------- type ----------
// A block of lines, left/centre/right aligned at x. The FIRST line's top sits at y
// (top: true) or the LAST line's baseline sits at y (top: false). line = [{ s, k }] parts;
// k: 'lead' small caps line, 'word' condensed, 'fig' expanded.
export const STYLE = {
  lead: (z) => ({ size: z * 0.3, wdth: 72, wght: 760, track: 0.06, lh: 1 }),
  word: (z) => ({ size: z * 0.94, wdth: 62, wght: 830, lh: 0.8 }),
  fig: (z) => ({ size: z, wdth: 125, wght: 900, lh: 0.8 }),
};
// Type must survive a phone screen: a 1080p frame shown in a portrait phone feed is ~220 pt
// tall, so on-screen type below MIN_TYPE px (≈ 10 pt there) is unreadable. block() prints
// [review] type FIX for any part below it (lead-ins may go to MIN_LEAD), and runFilm prints
// [review] type off-frame FIX when a fully visible block leaves the frame (24 px safe margin).
export const MIN_TYPE = 56, MIN_LEAD = 44;
const BLOCKS = [];
export function block(parent, lines, { x = 0, y = 0, size = 120, align = 'left', top = false, rot = 0, gap = 0.12 }) {
  const pin = el('div', parent, { position: 'absolute', left: `${x}px`, top: `${y}px`, width: '0', height: '0', transform: `rotate(${rot}deg)`, transformOrigin: '0 0' });
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  const box = el('div', pin, { position: 'absolute', left: '0', [top ? 'top' : 'bottom']: '0', transform: `translateX(${tx})`, display: 'flex', flexDirection: 'column', gap: `${size * gap}px`,
    alignItems: { left: 'flex-start', center: 'center', right: 'flex-end' }[align] });
  const rows = lines.map((parts) => {
    const row = el('div', box, { display: 'flex', alignItems: 'baseline', gap: `${size * 0.16}px`, whiteSpace: 'nowrap' });
    parts.forEach(([s, k]) => { const n = text(row, s, STYLE[k](size)); Object.assign(n.style, { position: 'relative', left: 'auto', top: 'auto', transform: 'none' }); });
    return row;
  });
  const small = lines.flat().filter(([s, k]) => STYLE[k](size).size < (k === 'lead' ? MIN_LEAD : MIN_TYPE));
  if (small.length) console.log(`[review] type FIX ${small.map(([s, k]) => `"${s}" ${Math.round(STYLE[k](size).size)}px`).join(', ')} (min ${MIN_TYPE}, lead ${MIN_LEAD}): raise size or use 'word'`);
  const b = { pin, rows, label: lines.flat().map(([s]) => s).join(' '), warned: false };
  BLOCKS.push(b);
  return b;
}
// called by runFilm after every frame: flags a fully visible block that leaves the frame
function typeInFrame(root) {
  const R = document.getElementById('stage').getBoundingClientRect(), k = R.width / 1920, m = 24 * k;
  BLOCKS.forEach((b) => {
    if (b.warned || !root.contains(b.pin) || b.pin.style.display === 'none' || +(b.pin.style.opacity || 1) < 0.95) return;
    b.rows.forEach((row) => {
      if (b.warned || +(row.style.opacity || 1) < 0.95 || row.style.translate && row.style.translate !== '0px 0px' && row.style.translate !== '0px') return;
      const r = row.getBoundingClientRect();
      if (r.width && (r.left < R.left + m || r.right > R.right - m || r.top < R.top + m || r.bottom > R.bottom - m)) {
        b.warned = true;
        console.log(`[review] type off-frame FIX "${b.label}" row ${Math.round((r.left - R.left) / k)}..${Math.round((r.right - R.left) / k)} x ${Math.round((r.top - R.top) / k)}..${Math.round((r.bottom - R.top) / k)} px: break the line or lower size`);
      }
    });
  });
}
export const reveal = (rows, l, t0, dist = 36) => rows.forEach((n, i) => {
  const p = prog(l, t0 + i * 0.08, t0 + 0.5 + i * 0.08, E.snap);
  n.style.translate = `${lerp(-dist, 0, p)}px 0`;
  n.style.opacity = clamp(p * 2.5, 0, 1);
});

// Typewriter: each row's words appear letter by letter, with a caret, at `cps` letters/s.
export function typeIn(rows, l, t0, cps = 26) {
  let n = Math.max(0, Math.floor((l - t0) * cps));
  rows.forEach((row) => [...row.children].forEach((node) => {
    if (!node.dataset.full) { node.dataset.full = node.textContent; node.style.width = `${node.offsetWidth}px`; }
    const full = node.dataset.full, k = Math.min(full.length, n);
    n -= k;
    node.textContent = full.slice(0, k) || '\u200b';
    node.style.opacity = k ? 1 : 0;
  }));
}

// ---------- bloom ----------
// The keynote rhythm around a centred anchor: a beam opens out of the anchor, holds on one
// feature, then retracts back into it; the next beam opens in a new direction (its `at`),
// at a new size, with a different feature.
// The beam is a wedge whose apex is the centre of the frame. The card stays flat, face up and
// still; the wedge sweeps open as a line of light (one edge stays, the other swings across) and
// sweeps shut the same way. Light mode: the same wedge as a cone from the light.
// beats: [{ m, at: [x, y], w, tone, t0, t1, type, open, shut, dir }] (type: block lines riding the flatter edge;
// open / shut: sweep durations, default 0.45 / 0.34; shut: 0 = stays open, cut away; dir: -1 = sweep the other way)
export const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export function ray(parent, th = 3) {
  const n = el('div', parent, { position: 'absolute', left: '0', top: `${-th / 2}px`, height: `${th}px`, width: '0', transformOrigin: `0 ${th / 2}px`, borderRadius: `${th}px`,
    background: `linear-gradient(90deg, rgba(${lc(0.21)},1), rgba(${lc(0.56)},.85) 40%, rgba(${lc(0.75)},0))`, boxShadow: `0 0 14px rgba(${lc(0.67)},.7)` });
  n.set = (P, ang, len, o = 1) => { n.style.width = `${len}px`; n.style.transform = `translate(${P[0]}px,${P[1]}px) rotate(${(ang * 180) / Math.PI}deg)`; n.style.opacity = o; };
  return n;
}
export function bloom(L, a, beats) {
  const apex = { x: 0, y: 0, w: 0, neck: () => [[0, 0], [0, 0]], pt: () => [0, 0] };
  a.rays = [ray(L.base, 4)];
  const far = (ang) => [Math.cos(ang) * 3200, Math.sin(ang) * 3200];
  return beats.map((b, i) => {
    const m = b.mg ?? 30, ar = b.m.canvas.width / b.m.canvas.height, hh = b.w / ar / 2 + m, hw = b.w / 2 + m;
    const axis = Math.atan2(b.at[1], b.at[0]);
    const h = Math.max(...[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => Math.abs(angDiff(Math.atan2(b.at[1] + v * hh, b.at[0] + u * hw), axis))));
    const pts = [[0, 0], far(axis - h), far(axis + h), [0, 0]];
    const w = beam(L.base, apex, 'right', pts.slice(1, 3), b.m, { at: b.at, w: b.w, view: [-3000, -3000, 3000, 3000], bg: b.bg }, { tone: b.tone });
    w.pts = pts; w.src = [0, 0]; w.setPts(pts);
    review(`bloom ${i}`, { ...apex, x: 0, y: 0, pt: () => [0, 0] }, pts, { x: b.at[0], y: b.at[1], w: b.w }, (2 * h * 180) / Math.PI, ar);
    // timing: a beam must visibly open, be held long enough to recognise its content, and close.
    // Sweeps under ~0.2 shot-s, or a full-open hold under ~0.3 shot-s, read as a flicker, not a
    // beam (the retract-all reprise used 0.2 s flashes and every film's ending looked glitchy).
    const oi = b.open ?? 0.45, os = b.shut ?? 0.34, kk = Math.min(1, Math.max(0, (b.t1 - b.t0 - oi - os) / 0.64));
    const hold = b.t1 - b.t0 - oi - (os ? os + 0.44 * kk : 0.2 * kk);
    if (oi < 0.2 || (os && os < 0.16) || hold < 0.3) console.log(`[review] bloom ${i} timing FIX {"open":${oi},"shut":${os},"hold":${hold.toFixed(2)}} (shot-s): open ≥ 0.2, shut ≥ 0.16 or 0, hold ≥ 0.3; give the beat more time or show fewer beams`);
    let t = null;
    if (b.type && b.tat) {
      // tat: [x, y] sets the claim upright at that point, beside the anchor on the side away from
      // the beam (align follows the side), instead of running it out along the beam's edge: with a
      // tall anchor the edge rule pushed every claim to the frame's corners (an upright-phone film)
      t = block(L.base, b.type, { x: b.tat[0], y: b.tat[1], size: b.size ?? 60, rot: b.trot ?? 0, align: b.talign ?? (b.tat[0] < 0 ? 'right' : 'left') });
    } else if (b.type) {
      const A = [pts[0], pts[1]], B = [pts[3], pts[2]];
      // the claim continues the flatter edge PAST the apex (frames 9359/9360): it starts at
      // the apex and runs away from the window, on the side of the line away from it, always
      // reading left to right
      const flat = ([P, Q]) => Math.abs(Q[1] - P[1]) / Math.hypot(Q[0] - P[0], Q[1] - P[1]);
      const [P, Q] = flat(A) < flat(B) ? A : B;
      const L0 = Math.hypot(Q[0] - P[0], Q[1] - P[1]), e = [-(Q[0] - P[0]) / L0, -(Q[1] - P[1]) / L0];
      const flip = e[0] < 0, deg = (Math.atan2(e[1], e[0]) * 180) / Math.PI + (flip ? 180 : 0);
      const nrm = [-e[1], e[0]], away = dot(b.at, nrm) > 0 ? [-nrm[0], -nrm[1]] : nrm;
      const yax = [-Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180)], below = dot(away, yax) > 0;
      // a flat card covers the apex, so the claim starts past the card's corner (half-diagonal)
      const gap = b.from ?? (LIGHT ? 50 : Math.hypot(a.w, a.h) / 2 + 30);
      t = block(L.base, b.type, { x: e[0] * gap + away[0] * 14, y: e[1] * gap + away[1] * 14, size: b.size ?? 60, rot: deg, align: flip ? 'right' : 'left', top: below });
    }
    return { ...b, w, t, axis, h, far };
  });
}
export function flatReveal(a, b, l, s) {
  const u = (g) => [Math.cos(g), Math.sin(g)], R = 3200, A = b.axis;
  const live = l > b.t0 && l < b.t1;
  let show;
  {
    // opens by sweeping the far edge across; closes by sweeping the start edge after it, so the
    // window keeps moving the same way and folds away at the far edge (like a wiper)
    // per beat: `open` / `shut` durations, `dir: -1` sweeps the other way, `shut: 0` stays
    // fully open until t1 so the next hard cut interrupts it
    const oi = b.open ?? 0.45, os = b.shut ?? 0.34, d = b.dir ?? 1;
    // the 0.2 / 0.24 s pads before opening and after closing shrink on short beats, so a quick
    // flash still opens fully instead of closing before it has opened
    const k = Math.min(1, Math.max(0, (b.t1 - b.t0 - oi - os) / 0.64)), pi = 0.2 * k, ps = 0.24 * k;
    const so = prog(l, b.t0 + pi, b.t0 + pi + oi, E.snap), sc = os ? prog(l, b.t1 - ps - os, b.t1 - ps, E.glide) : 0;
    const g0 = A - d * b.h + 2 * d * b.h * sc, g1 = A - d * b.h + 2 * d * b.h * so;
    b.w.setPts([[0, 0], b.far(g0), b.far(g1), [0, 0]]);
    // shut: 0 is a hard cut: the beam is gone at t1 (a later beat in the same shot, or the next shot,
    // takes over), it does not linger open behind the next beam
    show = so > 0.001 && sc < 0.999 && (os > 0 || l < b.t1);
    b.k = k; b.ps = ps;
    const opening = so < 0.999, closing = sc > 0.001 && sc < 0.999;
    if (live) a.rays[0].set([0, 0], opening ? g1 : g0, R, (opening && so > 0.001) || closing ? 1 : 0);
  }
  b.w.box.style.display = show ? 'block' : 'none';
  if (show) { b.m.draw(1 + (l - b.t0) * 1.4); drift(b.w, Math.max(0, l - b.t0), b.t1 - b.t0, -8, 3); }
  if (b.t) {
    b.t.pin.style.display = show ? 'block' : 'none';
    reveal(b.t.rows, l, b.t0 + 0.5);
    // the claim leaves with its beam: it fades as the beam starts to shut (a fixed 0.7 s before t1
    // hid the claim of a short beat almost as soon as it arrived)
    const os = b.shut ?? 0.34, end = b.t1 - (b.ps ?? 0.24) - os;
    b.t.pin.style.opacity = b.shut === 0 ? (l < b.t1 ? 1 : 0) : 1 - prog(l, end - 0.12, end + 0.1);
  }
}
// open → hold → sweep shut, one beat after another; each beam opens along its own axis.
export function bloomFrame(a, beats, l, { rz = 0 } = {}) {
  beats.forEach((b) => {
    const oi = b.open ?? 0.45, os = b.shut ?? 0.34;
    const s = prog(l, b.t0 + 0.2, b.t0 + 0.2 + oi, E.snap) * (os ? 1 - prog(l, b.t1 - 0.24 - os, b.t1 - 0.24, E.glide) : 1);
    flatReveal(a, b, l, s);
    b.w.panel.style.rotate = `${-rz}deg`;
  });
  if (!beats.some((b) => l > b.t0 && l < b.t1)) a.rays.forEach((r) => r.set([0, 0], 0, 0, 0));
  if (!LIGHT) { a.root.style.transform = ''; a.root.style.display = 'block'; }
}

// ---------- film runner: pace + match moves + grain ----------
// shots are written in their own seconds; pace stretches the whole film (holds, beams, events)
// in proportion. pins (from measure-pins.mjs) make each anchor shot start where the previous
// shot's anchor ended, then glide to its own place over `match` shot-seconds.
// beats(bpm, pace) -> B, where B(n) is n beats in shot-seconds: write durations as B(n) so the
// cuts land on the beat grid after runFilm() stretches them by pace.
export const beats = (bpm, pace) => (n) => (n * 60) / bpm / pace;
// beat0: film time of the first beat (when the grid must line up with a track the user will add later). A shot with offbeat: true may cut between beats on purpose.
export function runFilm({ shots, duration, pace = 1.25, match = 0.8, pins = { object: {}, light: {} }, bpm = 120, beat0 = 0, events = [], grainAmount = 0.05 }) {
  const NOMATCH = new URLSearchParams(location.search).has('nomatch');
  { // [review] grid: every cut on the beat (within one frame at 24 fps)
    const B = 60 / bpm, off = shots.slice(1).map((s) => {
      const t = s.start * pace - beat0, d = Math.abs(t - Math.round(t / B) * B);
      return { s, t: s.start * pace, d };
    }).filter((c) => c.d > 1 / 24 + 1e-6 && !c.s.offbeat);
    if (off.length) console.log(`[review] grid FIX ${off.length} cut(s) off the ${bpm} bpm beat: ${off.map((c) => `${c.s.id} @${c.t.toFixed(2)}s (${c.d.toFixed(2)}s off)`).join(', ')}. Write durations as B(n) with B = beats(${bpm}, ${pace}), or mark the shot offbeat: true`);
    else console.log(`[review] grid OK ${shots.length - 1} cuts on the ${bpm} bpm beat`);
  }
  shots.forEach((s, i) => {
    const { setup, frame } = s;
    s.start *= pace; s.end *= pace;
    const P = pins[LIGHT ? 'light' : 'object'] || {};
    const prev = P[shots[i - 1]?.id]?.end, cur = P[s.id]?.start;
    s.setup = async (root) => {
      const c = await setup(root); window.__anchor = c.a || null;
      const parts = [...root.children];
      if (prev && cur) parts.forEach((n) => { n.style.overflow = 'visible'; });
      return { c, parts, g: grain(root, { amount: grainAmount }) };
    };
    s.frame = (l, ctx, info) => {
      ctx.g.draw(info.t);
      const r = frame(l / pace, ctx.c, info);
      if (ctx.parts[0]) typeInFrame(ctx.parts[0].parentElement);
      if (prev && cur && !NOMATCH && Math.abs(cur.x) < 960 && Math.abs(cur.y) < 540) {
        const p = 1 - prog(l / pace, 0, match, E.glide), k = Math.pow(prev.w / cur.w, p);
        ctx.parts.forEach((n) => {
          n.style.transformOrigin = `${960 + cur.x}px ${540 + cur.y}px`;
          n.style.transform = `translate(${(prev.x - cur.x) * p}px,${(prev.y - cur.y) * p}px) scale(${k})`;
        });
      }
      return r;
    };
  });
  defineFilm({
    fps: 24, duration: duration * pace, bpm, beat0, shots,
    events: events.map((e) => ({ ...e, t: e.t * pace, ...(e.dur ? { dur: e.dur * pace } : {}) })),
  });
}
