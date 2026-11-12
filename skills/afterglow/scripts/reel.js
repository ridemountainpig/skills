// reel.js (afterglow): turns a film description (chapters as data + one screen() function each)
// into a deterministic page: window.renderFrame(t) for render.mjs, posters for poster.mjs,
// window.__film (fps, duration, chapters, events) for sound.py, and [review] checks at load.
//
//   import { reel } from '../afterglow/reel.js';
//   await reel({ brand, footer, palette, device, knobStops, fonts, chapters: [...], end: {...}, poster: {...} });
//
// Chapter (all times are LOCAL seconds from the chapter's start):
//   { id, dur, caption: [['Press '], ['POWER', 'mark'], [' to boot']], badge: { at, text },
//     action: '⏎ SCAN',                      // label of the big action key while this chapter runs
//     power: 1.4,                             // boot chapter only: when POWER is pressed (screen off before)
//     typing: [{ text, at, cps }],            // keys light up as each char is typed; x.typed(i) gives the prefix
//     press: [{ key: 'ACTION', at }],         // single key presses (lit pulse + 'enter' sound)
//     knob: [2.0, 3.2, 4.4],                  // COLOR knob clicks: the look steps through knobStops
//     cursor: [[lt, target, down?], ...]      // target: 'POWER' | 'COLOR' | key label | [x, y]
//     camera: { from: [scale, dy], to: [scale, dy] },
//     events: [{ at, type, dur }],            // extra sound events (scan, ok, rain, ...)
//     screen: (s, w, h, x) => {} }            // draw the screen; x = { t, lt, pal, typed(i), p(a, b), on }
import { PALETTES, mixPal, rgba, prog, ease, lerp, clamp, typed, txt, segText, screen, powerOn, DEV, keyboard, knob,
  monitor, cursor, cursorAt, caption, chrome, rr, keyCenter, contrast, SMALL, hexLum, hexSat } from './kit.js';

const Q = new URLSearchParams(location.search);

export async function reel(cfg) {
  const looks = { ...PALETTES, ...(cfg.looks || {}) };
  const BASE = Q.get('palette') || cfg.palette || 'amber';
  const DEVICE = Q.get('device') || cfg.device || 'terminal';
  const FPS = cfg.fps || 30;
  // chapter timeline
  let t0 = 0;
  const CH = cfg.chapters.map((c) => { const o = { ...c, t0, t1: t0 + c.dur }; t0 += c.dur; return o; });
  if (cfg.end) { CH.push({ id: 'end', end: cfg.end, dur: cfg.end.dur || 3.6, t0, t1: t0 + (cfg.end.dur || 3.6) }); t0 += cfg.end.dur || 3.6; }
  const DUR = t0, N = cfg.chapters.length;
  const chAt = (t) => Math.max(0, CH.findIndex((c) => t >= c.t0 && t < c.t1));
  const powerT = (() => { const c = CH.find((c) => c.power != null); return c ? c.t0 + c.power : -1; })();
  // the COLOR knob
  const kc = CH.find((c) => c.knob); const KNOB_T = kc ? kc.knob.map((x) => kc.t0 + x) : [];
  const stopsFor = (base) => [base, ...(cfg.knobStops || ['amber', 'green', 'white', 'cyan']).filter((p) => p !== base)].slice(0, KNOB_T.length + 1);
  const KNOB = stopsFor(BASE);
  if (kc && KNOB.length < KNOB_T.length + 1) throw new Error(`knobStops: ${KNOB_T.length} knob clicks need ${KNOB_T.length + 1} looks (the base look first), got ${KNOB.length}`);
  // a step between a dark and a light look crosses the whole stage: no colour mix (that reads as mud). The screen
  // switches off to a line, the stage swaps while it is dark, the screen comes back with a degauss wobble.
  const stepDur = (a, b) => (Math.abs(hexLum(looks[a].stage) - hexLum(looks[b].stage)) > 0.3 ? 0.75 : 0.22);
  function lookAt(t, base, lock) {
    if (lock || !kc || t < KNOB_T[0] || t >= kc.t1) return { pal: { ...looks[base], name: base }, wob: 0, idx: 0, blank: 0 };
    const stops = stopsFor(base); let i = 0; while (i < KNOB_T.length && t >= KNOB_T[i]) i++;
    const d = stepDur(stops[i - 1], stops[i]), k = prog(t, KNOB_T[i - 1], KNOB_T[i - 1] + d);
    if (d > 0.5) {
      const pal = { ...looks[k < 0.5 ? stops[i - 1] : stops[i]], name: k < 0.5 ? stops[i - 1] : stops[i] };
      return { pal, wob: k > 0.5 && k < 1 ? Math.sin((k - 0.5) * 2 * Math.PI) : 0, idx: i, blank: k > 0 && k < 1 ? 1 - Math.abs(2 * k - 1) : 0 };
    }
    const pal = mixPal(looks[stops[i - 1]], looks[stops[i]], ease(k)); pal.name = stops[i];
    return { pal, wob: 0, idx: i, blank: 0 };
  }
  const target = (g) => (Array.isArray(g) ? g : g === 'POWER' ? [1415, DEV.strip.y + 9] : g === 'COLOR' ? [1290, DEV.strip.y + 9] : keyCenter(g));

  // ---------- one frame on a 1920x1080 stage ----------
  // frame() draws in 1920x1080 stage units on top of the caller's transform (renderFrame sets the output scale).
  function frame(ctx, t, base = BASE, lock = false) { ctx.save(); try { frame0(ctx, t, base, lock); } finally { ctx.restore(); } }
  function frame0(ctx, t, base, lock) {
    const ci = chAt(Math.min(t, DUR - 1e-3)), C = CH[ci], lt = t - C.t0;
    const { pal, wob, idx, blank } = lookAt(t, base, lock);
    ctx.fillStyle = pal.stage; ctx.fillRect(0, 0, 1920, 1080);
    if (C.end) return endCard(ctx, lt, pal, C.end);
    const cam = C.camera && !lock ? (() => { const k = ease(prog(lt, 0, C.dur)); return [lerp(C.camera.from[0], C.camera.to[0], k), lerp(C.camera.from[1], C.camera.to[1], k)]; })() : (C.camera && lock ? C.camera.from : [1, 0]);
    const dev = DEVICE === 'monitor' ? [1.06, 10] : [1, 0]; // monitor: no keyboard, a bigger screen
    ctx.save();
    ctx.translate(960, 560 + cam[1] + dev[1]); ctx.scale(cam[0] * dev[0], cam[0] * dev[0]); ctx.translate(-960, -560);
    monitor(ctx, pal, cfg.brand || '', { stand: DEVICE === 'monitor' });
    const on = powerT < 0 || t >= powerT;
    const press = {};
    for (const ty of C.typing || []) { const r = typed(ty.text, lt, ty.at, ty.cps || 12); if (r.last && r.last !== ' ') press[r.last.toUpperCase()] = 1; if (r.last === ' ') press.space = 1; }
    for (const p of C.press || []) press[p.key] = Math.max(press[p.key] || 0, clamp(1 - Math.abs(lt - p.at) * 4));
    if (DEVICE === 'terminal') keyboard(ctx, pal, { press, action: C.action || cfg.action || '⏎ ENTER' });
    const ka = idx * 0.125 + (idx && !lock ? -0.04 * (1 - ease(prog(t, KNOB_T[idx - 1], KNOB_T[idx - 1] + 0.25))) : 0);
    if (kc) knob(ctx, pal, 1290, DEV.strip.y + 6, 'COLOR', ka, { dots: KNOB.map((p) => looks[p].phos), active: lock ? 0 : idx });
    knob(ctx, pal, 1415, DEV.strip.y + 6, 'POWER', on ? 0.15 : 0, { led: on });
    const R = DEV.scr, x = { t, lt, pal, on, p: (a, b) => prog(lt, a, b), typed: (i) => typed(C.typing[i].text, lt, C.typing[i].at, C.typing[i].cps || 12).s, lock };
    screen(ctx, t, pal, R, (s, w, h) => {
      if (wob) s.translate(Math.sin(t * 70) * 10 * wob, 0);
      if (!on) { txt(s, cfg.offPrompt || '› press POWER to start', w / 2, h / 2, { font: '500 18px "JetBrains Mono"', color: pal.dim, align: 'center', alpha: 0.6 }); return; }
      C.screen && C.screen(s, w, h, x);
    }, { power: on ? 1 - clamp(blank * 1.6) : 0.6 });
    if (blank > 0) powerOn(ctx, pal, R, 1 - blank); // the collapse line while the look swaps
    if (powerT >= 0) powerOn(ctx, pal, R, prog(t, powerT + 0.05, powerT + 0.55));
    if (wob) { ctx.save(); rr(ctx, R.x, R.y, R.w, R.h, pal.fx.curve); ctx.clip(); ctx.fillStyle = rgba(pal.phos, 0.25 * wob); ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore(); }
    if (C.cursor && C.cursor.length && !lock) { const path = C.cursor.map(([a, g, d]) => [a, ...target(g), d || 0]); const cp = cursorAt(path, lt); cursor(ctx, cp[1] + 3, cp[2] + 3, cp[3]); }
    ctx.restore();
    // caption band (so the camera can move under it), caption, badge, chapter chrome
    const g = ctx.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, pal.stage); g.addColorStop(0.75, pal.stage); g.addColorStop(1, rgba(pal.stage, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 150);
    const segs = typeof C.caption === 'function' ? C.caption({ knob: KNOB.map((n) => [n, looks[n]]), pal }) : C.caption || [];
    caption(ctx, pal, segs, { alpha: prog(lt, 0, 0.18), badge: C.badge && lt >= C.badge.at ? C.badge.text : null });
    chrome(ctx, pal, cfg.footer || '', ci + 1, N);
  }

  function endCard(ctx, lt, pal, E) {
    const a = prog(lt, 0.15, 0.6), y = 520;
    if (E.kicker) txt(ctx, E.kicker, 960, y - 120, { font: '500 15px "JetBrains Mono"', color: rgba(pal.head, 0.5), align: 'center', ls: 5, alpha: a });
    ctx.save(); if (pal.fx.glow) { ctx.shadowColor = rgba(pal.mark, 0.7); ctx.shadowBlur = 28; }
    segText(ctx, [['>_ ' + E.title, pal.mark]], 960, y, '700 128px Inter', a); ctx.restore();
    if (E.tagline) txt(ctx, E.tagline, 960, y + 62, { font: '500 28px Inter', color: rgba(pal.head, 0.85), align: 'center', alpha: prog(lt, 0.4, 0.8) });
    if (E.chip) {
      const ca = prog(lt, 0.7, 1.1); ctx.save(); ctx.globalAlpha = ca; ctx.font = '600 22px "JetBrains Mono"';
      const bw = ctx.measureText(E.chip).width + 44; rr(ctx, 960 - bw / 2, y + 100, bw, 46, 4); ctx.fillStyle = pal.mark; ctx.fill();
      txt(ctx, E.chip, 960, y + 131, { font: '600 22px "JetBrains Mono"', color: pal.stage, align: 'center' }); ctx.restore();
    }
    if (E.small) txt(ctx, E.small, 960, y + 196, { font: '500 15px "JetBrains Mono"', color: rgba(pal.head, 0.5), align: 'center', alpha: prog(lt, 1.0, 1.4) });
    if (pal.fx.scan) { ctx.fillStyle = pal.light ? `rgba(0,0,0,${pal.fx.scan * 0.4})` : `rgba(0,0,0,${pal.fx.scan * 0.6})`; for (let yy = 0; yy < 1080; yy += 3) ctx.fillRect(0, yy, 1920, 1.2); }
    if (E.legal) txt(ctx, E.legal, 960, 1050, { font: '500 13px Inter', color: rgba(pal.head, 0.4), align: 'center', alpha: a });
  }

  // ---------- posters: same scene, one locked look, no camera move ----------
  const PS = { hero: [1920, 1080], square: [1080, 1080], story: [1080, 1920], triptych: [1920, 1080] };
  const poster = Q.get('poster');
  const [OW, OH] = poster ? PS[poster] : [1920, 1080];
  const scale = Number(Q.get('scale') || 1);
  const stage = document.getElementById('stage');
  const cv = document.createElement('canvas'); cv.width = OW * scale; cv.height = OH * scale; cv.style.width = OW + 'px'; cv.style.height = OH + 'px';
  stage.style.width = OW + 'px'; stage.style.height = OH + 'px'; stage.appendChild(cv);
  const ctx = cv.getContext('2d');
  const off = document.createElement('canvas'); off.width = 1920; off.height = 1080; const octx = off.getContext('2d');
  const P = cfg.poster || {};
  const at = (k) => (Q.get('t') != null ? Number(Q.get('t')) : (P.times || {})[k] ?? DUR / 2);
  function renderPoster(kind, tArg) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    let t = Number.isFinite(tArg) ? tArg : at(kind);
    if (kind !== 'hero' && CH[chAt(Math.min(t, DUR - 1e-3))].end) { // a device poster needs a device: use the last chapter
      const last = CH.filter((c) => !c.end).pop(); console.log(`[review] WARN poster ${kind} at ${t}s is on the end card; used ${last.id} instead`); t = last.t0 + last.dur * 0.7;
    }
    const pal = looks[BASE], M = (segs) => segs.map(([s, c]) => [s, c === 'mark' ? pal.mark : c || pal.head]);
    if (kind === 'hero') return frame(ctx, t, BASE, true);
    ctx.fillStyle = pal.stage; ctx.fillRect(0, 0, OW, OH);
    if (kind === 'triptych') {
      const names = stopsFor(BASE).concat(['amber', 'green', 'white', 'cyan']).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
      names.forEach((n, i) => {
        frame(octx, t, n, true); const R = DEV.scr, w = 580, h = w * (R.h + 140) / (R.w + 60), x0 = 60 + i * 620, y0 = 330;
        ctx.drawImage(off, R.x - 30, R.y - 30, R.w + 60, R.h + 140, x0, y0, w, h);
        txt(ctx, n.toUpperCase(), x0 + w / 2, y0 + h + 50, { font: '600 18px "JetBrains Mono"', color: looks[n].mark, align: 'center', ls: 6 });
      });
      segText(ctx, M(P.triptych || P.headline || [['']]), 960, 220, '700 64px Inter');
      return;
    }
    frame(octx, t, BASE, true); octx.setTransform(1, 0, 0, 1, 0, 0);
    const crop = DEVICE === 'monitor' ? { x: 330, y: 120, w: 1260, h: 960 } : { x: 380, y: 130, w: 1160, h: 950 };
    const story = kind === 'story', tw = story ? 1060 : 900, th = tw * crop.h / crop.w, ty = story ? 640 : 190;
    ctx.drawImage(off, crop.x, crop.y, crop.w, crop.h, (OW - tw) / 2, ty, tw, th);
    const fade = (y0, hgt) => { const g = ctx.createLinearGradient(0, y0, 0, y0 + hgt); g.addColorStop(0, rgba(pal.stage, 0)); g.addColorStop(1, pal.stage); ctx.fillStyle = g; ctx.fillRect(0, y0, OW, hgt); };
    if (story) {
      fade(ty + th - 160, 160);
      if (P.kicker) txt(ctx, P.kicker, 540, 290, { font: '700 54px Inter', color: pal.mark, align: 'center' });
      (P.storyLines || [P.headline || [['']]]).forEach((segs, i) => segText(ctx, M(segs), 540, 420 + i * 96, '700 84px Inter'));
      (P.lines || []).forEach((l, i) => txt(ctx, '> ' + l, 540, 1560 + i * 58, { font: '500 32px "JetBrains Mono"', color: i % 2 ? pal.head : pal.mark, align: 'center', alpha: 0.9 }));
    } else {
      segText(ctx, M(P.headline || [['']]), 540, 120, '700 60px Inter');
      fade(OH - 120, 120);
    }
  }

  // ---------- [review]: checks a person would otherwise catch on the contact sheet ----------
  const R = [];
  const words = (segs) => segs.map(([s]) => s).join('').trim().split(/\s+/).filter(Boolean).length;
  for (const c of CH) {
    if (c.end) continue;
    const segs = typeof c.caption === 'function' ? c.caption({ knob: KNOB.map((n) => [n, looks[n]]), pal: looks[BASE] }) : c.caption || [];
    if (words(segs) > 8) R.push(`WARN caption "${c.id}" has ${words(segs)} words (keep it to about 7)`);
    if (!segs.some(([, k]) => k === 'mark') && typeof c.caption !== 'function') R.push(`WARN caption "${c.id}" has no 'mark' word`);
    if (c.dur < 3.5 || c.dur > 7.5) R.push(`WARN chapter "${c.id}" is ${c.dur}s (chapters read best at 4-6 s)`);
  }
  if (N < 2 || N > 5) R.push(`WARN ${N} chapters (2-5 read best)`);
  for (const n of new Set([BASE, ...(kc ? KNOB : [])])) {
    const L = looks[n]; if (!L) { R.push(`FIX look "${n}" does not exist`); continue; }
    if (contrast(L.mark, L.stage) < 3) R.push(`FIX look "${n}": mark ${L.mark} on stage ${L.stage} contrast ${contrast(L.mark, L.stage).toFixed(1)} < 3`);
    if (contrast(L.phos, L.glass) < 4.5) R.push(`FIX look "${n}": screen text contrast ${contrast(L.phos, L.glass).toFixed(1)} < 4.5`);
    // the mark must stand out from the caption ink by lightness or by colour
    if (contrast(L.mark, L.head) < 1.6 && Math.abs(hexSat(L.mark) - hexSat(L.head)) < 0.25) R.push(`FIX look "${n}": mark ${L.mark} does not stand out from the caption ink ${L.head}`);
  }
  for (const f of cfg.fonts || []) if (!document.fonts.check(f, f.includes('Noto Sans TC') ? '曬' : 'A')) R.push(`FIX font not loaded before ready: ${f}`);
  // draw every chapter once to collect small screen text
  for (const c of CH) frame(octx, c.t0 + c.dur * 0.7);
  if (SMALL.size) R.push(`WARN screen text under 15 px: ${[...SMALL].slice(0, 4).join(', ')}${SMALL.size > 4 ? ' …' : ''}`);
  console.log(R.length ? R.map((r) => '[review] ' + r).join('\n') : `[review] OK  ${N} chapters, ${DUR.toFixed(1)} s, look ${BASE}${kc ? ' + knob ' + KNOB.slice(1).join('/') : ''}`);

  // ---------- page wiring ----------
  const events = [];
  for (const c of CH) {
    if (c.id !== CH[0].id) events.push({ t: c.t0, type: c.end ? 'end' : 'cut', dur: c.end ? c.dur : undefined });
    if (c.power != null) events.push({ t: c.t0 + c.power - 0.05, type: 'click' }, { t: c.t0 + c.power + 0.05, type: 'poweron' });
    for (const ty of c.typing || []) for (let i = 0; i < ty.text.length; i++) if (ty.text[i] !== ' ') events.push({ t: c.t0 + ty.at + (i + 1) / (ty.cps || 12), type: 'key' });
    for (const p of c.press || []) events.push({ t: c.t0 + p.at, type: 'enter' });
    for (const k of c.knob || []) events.push({ t: c.t0 + k, type: 'knob' });
    for (const e of c.events || []) events.push({ ...e, t: c.t0 + e.at });
  }
  window.__film = { fps: FPS, duration: DUR, chapters: CH.map(({ id, t0, t1 }) => ({ id, t0, t1 })), events: events.sort((a, b) => a.t - b.t), review: R };
  window.renderFrame = (t) => { if (poster) return renderPoster(poster, t); ctx.setTransform(scale, 0, 0, scale, 0, 0); frame(ctx, t); };
  window.__ready = true;
}

// image loader for screen material
export const loadImages = (map) => Promise.all(Object.entries(map).map(([k, src]) => new Promise((r, j) => { const i = new Image(); i.onload = () => r([k, i]); i.onerror = () => j(new Error('image ' + src)); i.src = src; }))).then(Object.fromEntries);
export async function loadFonts(list) { for (const f of list) await document.fonts.load(f, f.includes('Noto Sans TC') ? '曬機' : 'A'); return list; }
