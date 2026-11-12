// Starter: a small film for a FICTIONAL product ("Tally", a spending log in the terminal), drawn without any
// screenshots, on the 'monitor' device (no keyboard). Replace the chapters with your own; do not reuse its order.
import { reel, loadFonts } from '../afterglow/reel.js';
import { txt, rgba, rr, ease, easeOut, lerp, prog } from '../afterglow/kit.js';

const FONTS = await loadFonts(['600 52px Inter', '700 20px Inter', '500 20px Inter', '500 20px "JetBrains Mono"', '600 20px "JetBrains Mono"', '700 20px "JetBrains Mono"']);
const PAD = 70, mono = (px, w = 500) => `${w} ${px}px "JetBrains Mono"`;
const head = (s, x, title, sub) => {
  txt(s, '>_', PAD, 100, { font: mono(40, 700), color: x.pal.phos });
  txt(s, title, PAD + 64, 100, { font: '700 52px Inter', color: x.pal.phos });
  if (sub) txt(s, sub, PAD, 140, { font: '500 20px Inter', color: x.pal.dim });
  s.fillStyle = rgba(x.pal.dim, 0.45); s.fillRect(PAD, 162, 920 - PAD * 2, 1);
};
const ROWS = [['09:12', 'coffee', '4.20'], ['11:05', 'train', '2.80'], ['12:40', 'lunch', '12.50']]; // the last row is the one added on screen

const chapters = [
  { id: 'log', dur: 5.2, caption: [['One line. '], ['Logged.', 'mark']], badge: { at: 3.2, text: '+1 entry' },
    typing: [{ text: 'tally add 12.50 lunch', at: 0.6, cps: 13 }], events: [{ at: 2.5, type: 'enter' }, { at: 3.1, type: 'ok' }],
    screen(s, w, h, x) {
      head(s, x, 'Tally', 'Spending, one line at a time.');
      txt(s, '$ ' + x.typed(0) + (x.lt < 2.5 && Math.floor(x.t * 2.5) % 2 === 0 ? '▍' : ''), PAD, 210, { font: mono(22), color: x.pal.hot });
      const show = x.lt > 2.6 ? 3 : 2;
      ROWS.slice(0, show).forEach(([tm, what, amt], i) => {
        const a = i === 2 ? x.p(2.6, 2.9) : 1, y = 270 + i * 44;
        txt(s, tm, PAD, y, { font: mono(22), color: x.pal.dim, alpha: a });
        txt(s, what, PAD + 120, y, { font: mono(22), color: x.pal.phos, alpha: a });
        txt(s, amt, w - PAD, y, { font: mono(22, 600), color: i === 2 && x.lt > 2.6 ? x.pal.mark || x.pal.phos : x.pal.phos, alpha: a, align: 'right' });
      });
      if (x.lt > 3.0) txt(s, '✓ saved · today 19.50', PAD, 460, { font: mono(22, 600), color: x.pal.ok, alpha: x.p(3.0, 3.2) });
    } },
  { id: 'ask', dur: 5.4, caption: [['Ask in '], ['plain words', 'mark']], camera: { from: [1, 0], to: [1.04, 6] },
    typing: [{ text: 'tally coffee this month?', at: 0.4, cps: 14 }], events: [{ at: 2.3, type: 'enter' }, { at: 2.4, type: 'scan', dur: 1.2 }],
    screen(s, w, h, x) {
      head(s, x, 'This month', null);
      txt(s, '$ ' + x.typed(0), PAD, 214, { font: mono(22), color: x.pal.hot });
      const weeks = [['wk 1', 18.9], ['wk 2', 12.6], ['wk 3', 21.0], ['wk 4', 8.4]];
      weeks.forEach(([wk, v], i) => {
        const k = ease(x.p(2.4 + i * 0.18, 3.0 + i * 0.18)), y = 280 + i * 54, bw = (w - PAD * 2 - 220) * (v / 21) * k;
        txt(s, wk, PAD, y + 22, { font: mono(20), color: x.pal.dim });
        s.fillStyle = x.pal.phos; s.globalAlpha = 0.85; s.fillRect(PAD + 90, y + 2, bw, 28); s.globalAlpha = 1;
        if (k > 0.9) txt(s, v.toFixed(2), PAD + 104 + bw, y + 24, { font: mono(20, 600), color: x.pal.phos });
      });
    } },
  { id: 'month', dur: 5.0, caption: [['Every month, '], ['one page', 'mark']], badge: { at: 2.4, text: 'PDF ready' },
    cursor: [[0, [1250, 900]], [1.6, [1250, 655]], [1.8, [1250, 655], 1], [2.0, [1250, 655]]], events: [{ at: 1.8, type: 'click' }, { at: 2.3, type: 'ok' }],
    screen(s, w, h, x) {
      head(s, x, 'March', 'Fictional numbers for this template.');
      const tiles = [['spent', '612.40'], ['entries', '87'], ['top', 'rent']];
      tiles.forEach(([k, v], i) => { const tx = PAD + i * 260, a = x.p(0.2 + i * 0.15, 0.5 + i * 0.15);
        rr(s, tx, 196, 236, 120, 12); s.strokeStyle = rgba(x.pal.phos, 0.35 * a); s.lineWidth = 1.5; s.stroke();
        txt(s, k, tx + 20, 232, { font: mono(18), color: x.pal.dim, alpha: a }); txt(s, v, tx + 20, 290, { font: '700 44px Inter', color: x.pal.phos, alpha: a }); });
      // sparkline
      s.beginPath(); for (let i = 0; i <= 30; i++) { const px = PAD + i * 18, py = 420 - 50 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.31)); i ? s.lineTo(px, py) : s.moveTo(px, py); }
      s.strokeStyle = x.pal.phos; s.lineWidth = 2.5; s.globalAlpha = x.p(0.6, 1.2); s.stroke(); s.globalAlpha = 1;
      // export button (the cursor presses it)
      const down = x.lt > 1.8 && x.lt < 2.0, bx = w - PAD - 170, by = 430;
      rr(s, bx, by, 170, 50, 8); s.fillStyle = x.lt > 1.8 ? x.pal.phos : 'transparent'; s.fill(); s.strokeStyle = x.pal.phos; s.lineWidth = 1.5; s.stroke();
      txt(s, x.lt > 2.0 ? '✓ exported' : 'export', bx + 85, by + 32 + (down ? 2 : 0), { font: mono(20, 600), color: x.lt > 1.8 ? x.pal.glass : x.pal.phos, align: 'center' });
    } },
];

await reel({
  brand: 'TALLY', footer: 'TALLY · AFTERGLOW STARTER', palette: 'green', device: 'monitor', fonts: FONTS, chapters,
  end: { kicker: 'A FICTIONAL PRODUCT', title: 'Tally', tagline: 'Spending, one line at a time.', chip: '$ tally add', small: 'log · ask · export',
    legal: 'Tally is a fictional product made for this template.' },
  poster: { headline: [['One line. '], ['Logged.', 'mark']], kicker: '>_ Tally', storyLines: [[['One line.']], [['Logged.', 'mark']]],
    lines: ['log in one line', 'ask in plain words', 'one page a month'], triptych: [['Same numbers. '], ['Any glow.', 'mark']],
    times: { hero: 8.6, square: 3.6, story: 13.6, triptych: 8.8 } },
});
