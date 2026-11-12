// Example: FlightShot (曬機), an iPhone app that turns a flight into story cards.
// Every caption and screen line traces to the app's website copy (see PLAN.md). Cards are the app's own renders.
// This is an EXAMPLE of how chapters are written, not a shot list to reuse: plan your own chapters.
import { reel, loadImages, loadFonts } from '../afterglow/reel.js';
import { txt, rgba, tinted, rain, rr, prog, ease, easeOut, lerp } from '../afterglow/kit.js';

const IMG = await loadImages({
  pass: '../assets/en-modernPass.webp', cover: '../assets/en-magazineCover.webp', flap: '../assets/en-splitFlap.webp',
  pola: '../assets/en-polaroid.webp', dep: '../assets/en-departure.webp',
});
const FONTS = await loadFonts(['600 52px Inter', '700 20px Inter', '500 20px Inter', '500 20px "JetBrains Mono"',
  '600 20px "JetBrains Mono"', '700 20px "JetBrains Mono"', '500 30px "Noto Sans TC"']);

const PAD = 70;
const mono = (px, w = 500) => `${w} ${px}px "JetBrains Mono"`;
const rule = (s, pal, y, w) => { s.fillStyle = rgba(pal.dim, 0.45); s.fillRect(PAD, y, w - PAD * 2, 1); };

function home(s, w, pal, t, cmd, caret) {
  txt(s, '>_', PAD, 104, { font: mono(46, 700), color: pal.phos });
  s.font = '700 62px Inter'; const fw = s.measureText('FlightShot').width;
  txt(s, 'FlightShot', PAD + 72, 104, { font: '700 62px Inter', color: pal.phos });
  txt(s, '曬機', PAD + 88 + fw, 104, { font: '500 54px "Noto Sans TC"', color: pal.phos, alpha: 0.85 });
  txt(s, 'Before takeoff, show it off.', PAD, 148, { font: '500 22px Inter', color: pal.dim });
  [['Input: ', 'boarding pass'], ['Status:', null], ['Output:', 'story card']].forEach(([k, v], i) => {
    txt(s, k, PAD, 196 + i * 28, { font: mono(17), color: pal.dim });
    if (v) txt(s, v, PAD + 84, 196 + i * 28, { font: mono(17), color: pal.phos });
    else { s.beginPath(); s.arc(PAD + 90, 190 + i * 28, 4.5, 0, 7); s.fillStyle = pal.ok; s.fill(); txt(s, 'ready', PAD + 102, 196 + i * 28, { font: mono(17), color: pal.phos }); }
  });
  rule(s, pal, 276, w);
  txt(s, '$ flightshot scan ' + cmd + (caret && Math.floor(t * 2.5) % 2 === 0 ? '▍' : ''), PAD, 316, { font: mono(19), color: pal.hot });
  rule(s, pal, 346, w);
}

const chapters = [
  { id: 'boot', dur: 4.6, power: 1.4, action: '⏎ SCAN',
    caption: [['Press '], ['POWER', 'mark'], [' to boot']],
    cursor: [[0, [1300, 1010]], [1.2, 'POWER'], [1.4, 'POWER', 1], [1.6, 'POWER'], [3, [1480, 940]]],
    screen(s, w, h, x) {
      if (x.lt < 3.35) {
        ['FLIGHTSHOT v1.0', 'memory check ............ ok', 'loading cards (42) ...... ok', 'mounting boarding_pass .. ok'].forEach((l, i) => {
          const n = Math.max(0, Math.min(l.length, Math.floor((x.lt - 2.0 - i * 0.3) * 60)));
          txt(s, l.slice(0, n), w / 2 - 200, h / 2 - 50 + i * 32, { font: mono(19), color: i ? x.pal.dim : x.pal.phos });
        });
        return;
      }
      s.globalAlpha = x.p(3.35, 3.55); home(s, w, x.pal, x.t, '', true);
    } },

  { id: 'scan', dur: 5.6, action: '⏎ SCAN', camera: { from: [1, 0], to: [1.05, 10] },
    caption: [['Scan your '], ['boarding pass', 'mark']], badge: { at: 3.4, text: '✓ Recognized' },
    typing: [{ text: 'boarding-pass.jpg', at: 0.4, cps: 12 }], press: [{ key: 'ACTION', at: 2.1 }],
    events: [{ at: 2.3, type: 'scan', dur: 1.1 }, { at: 3.35, type: 'ok' }],
    screen(s, w, h, x) {
      const sc = ease(x.p(2.2, 2.8)) * 246;
      s.save(); s.translate(0, -sc);
      home(s, w, x.pal, x.t, x.typed(0), x.lt < 2.1);
      const y0 = 390, cw = 250, chh = cw * 685 / 600;
      txt(s, 'Scanning', PAD, y0 + 6, { font: '700 21px Inter', color: x.pal.phos });
      s.drawImage(tinted(IMG.pass, x.pal, cw * 2, chh * 2), PAD, y0 + 28, cw, chh);
      const k = x.p(2.3, 3.4);
      if (k > 0 && k < 1) { const sy = y0 + 28 + chh * (0.7 + 0.2 * Math.sin(k * Math.PI * 2)); s.fillStyle = rgba(x.pal.hot, 0.9); s.fillRect(PAD - 8, sy, cw + 16, 2.5); s.fillStyle = rgba(x.pal.hot, 0.18); s.fillRect(PAD - 8, sy - 10, cw + 16, 22); }
      ['{', '  "recognized": true,', '  "route":  "TPE ✈ NGO",', '  "flight": "CI 150",', '  "time":   "08:40 → 12:20 · +1H"', '}'].forEach((L, i) => {
        const a = x.p(3.35 + i * 0.13, 3.45 + i * 0.13); if (!a) return;
        const [kk, ...rest] = L.split(':'), yy = y0 + 70 + i * 36;
        if (rest.length) { txt(s, kk + ':', 380, yy, { font: mono(20, 600), color: x.pal.phos, alpha: a }); s.font = mono(20, 600); txt(s, rest.join(':'), 380 + s.measureText(kk + ':').width, yy, { font: mono(20), color: i === 1 ? x.pal.ok : x.pal.dim, alpha: a }); }
        else txt(s, L, 380, yy, { font: mono(20, 600), color: x.pal.dim, alpha: a });
      });
      s.restore();
    } },

  { id: 'knob', dur: 5.4, action: '⏎ SHARE', knob: [0.8, 2.0, 3.2],
    caption: ({ knob }) => [['Turn the knob: '], ...knob.flatMap(([n, L], i) => [[n, L.mark], [i < knob.length - 1 ? ', ' : '']])],
    cursor: [[0, [1150, 1000]], [0.6, 'COLOR'], [0.8, 'COLOR', 1], [0.95, 'COLOR'], [2.0, 'COLOR', 1], [2.15, 'COLOR'], [3.2, 'COLOR', 1], [3.35, 'COLOR']],
    screen(s, w, h, x) {
      txt(s, '>_', PAD, 100, { font: mono(36, 700), color: x.pal.phos });
      txt(s, '42 cards.', PAD + 58, 100, { font: '700 46px Inter', color: x.pal.phos });
      s.font = '700 46px Inter'; const w1 = s.measureText('42 cards. ').width;
      txt(s, 'One of them is you.', PAD + 58 + w1, 100, { font: '500 46px Inter', color: x.pal.phos, alpha: 0.8 });
      txt(s, '$ flightshot cards --theme all', PAD, 142, { font: mono(18), color: x.pal.hot });
      txt(s, `theme: ${x.pal.name}`, w - PAD, 142, { font: mono(18), color: x.pal.dim, align: 'right' });
      rule(s, x.pal, 164, w);
      let cx = PAD - x.lt * 46;
      for (const [k, iw, ih] of [['pass', 600, 685], ['cover', 556, 900], ['flap', 600, 853], ['pola', 600, 816], ['dep', 600, 460], ['pass', 600, 685]]) {
        const ch = 320, cw = ch * iw / ih; s.drawImage(tinted(IMG[k], x.pal, Math.round(cw * 1.6), Math.round(ch * 1.6)), cx, 190, cw, ch); cx += cw + 34;
      }
    } },

  { id: 'share', dur: 5.2, action: '⏎ SHARE', camera: { from: [1, -84], to: [1.03, -96] },
    caption: [['Hit '], ['⏎ SHARE', 'mark'], ['. Straight to your story.']], badge: { at: 1.5, text: '1 tap' },
    press: [{ key: 'ACTION', at: 1.1 }], events: [{ at: 1.15, type: 'rain', dur: 2.5 }],
    cursor: [[0, [1100, 1030]], [0.9, 'ACTION'], [1.1, 'ACTION', 1], [1.3, 'ACTION']],
    screen(s, w, h, x) {
      const e = easeOut(x.p(1.05, 1.65)), done = x.lt > 1.2;
      txt(s, '>_', PAD, 96, { font: mono(32, 700), color: x.pal.phos });
      txt(s, 'Straight to your story', PAD + 52, 96, { font: '700 42px Inter', color: x.pal.phos });
      rule(s, x.pal, 124, w);
      // left: the share log (fills the space the card leaves behind)
      txt(s, '$ flightshot share --story', PAD, 172, { font: mono(19), color: x.pal.hot });
      const log = [['card', 'magazine cover'], ['flight', 'CI 150 · TPE ✈ NGO'], ['size', '1080 × 1920'], ['status', done ? 'shared · 1 tap' : 'draft']];
      log.forEach(([k, v], i) => { txt(s, k.padEnd(7), PAD, 216 + i * 34, { font: mono(19), color: x.pal.dim }); txt(s, v, PAD + 100, 216 + i * 34, { font: mono(19), color: i === 3 && done ? x.pal.ok : x.pal.phos }); });
      if (!done) txt(s, 'press ⏎ SHARE', PAD, 400, { font: mono(22, 600), color: x.pal.phos, alpha: 0.4 + 0.6 * Math.round((x.t * 2) % 1) });
      else txt(s, '✓ Posted to your story', PAD, 400, { font: mono(24, 600), color: x.pal.ok, alpha: x.p(1.4, 1.6) });
      // right: the story frame; the card grows into it
      const fx = 600, fy = 140, fw = 236, fh = 360;
      rr(s, fx, fy, fw, fh, 26); s.strokeStyle = rgba(x.pal.phos, 0.6); s.lineWidth = 2; s.setLineDash([6, 6]); s.stroke(); s.setLineDash([]);
      txt(s, 'Your story · now', fx + fw / 2, fy + fh + 26, { font: mono(16), color: x.pal.dim, align: 'center' });
      const cw = lerp(150, fw - 16, e), chh = cw * 900 / 556, cx = lerp(fx - 190, fx + 8, e), cy = lerp(fy + 60, fy + 8, e);
      s.save(); rr(s, cx, cy, cw, Math.min(chh, fh - 16), 16); s.clip(); s.drawImage(tinted(IMG.cover, x.pal, 360, 582), cx, cy, cw, chh); s.restore();
      rain(s, x.t, x.t - x.lt + 1.15, w, h, x.pal, '✈{}[]":,✈', 52);
    } },
];

await reel({
  brand: 'FLIGHTSHOT', footer: 'FLIGHTSHOT 曬機 · AFTERGLOW', palette: 'amber', device: 'terminal', fonts: FONTS,
  knobStops: ['amber', 'green', 'white', 'cyan'],
  chapters,
  end: { kicker: 'NEW · FOR iPHONE', title: 'FlightShot', tagline: 'Before takeoff, show it off.', chip: 'scan · share · story',
    small: 'No account · No tracking · Stays on your iPhone', legal: 'Cards show the app’s sample flight. Not affiliated with any airline.' },
  poster: {
    headline: [['Before takeoff, '], ['show it off.', 'mark']], kicker: '>_ FlightShot',
    storyLines: [[['Before takeoff,']], [['show it off.', 'mark']]],
    lines: ['scan your boarding pass', '42 cards, one is you', 'straight to your story'],
    triptych: [['One app. '], ['Every glow.', 'mark']],
    times: { hero: 8.6, square: 8.6, story: 17.4, triptych: 12.6 },
  },
});
