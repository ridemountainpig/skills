// Formwright (a fictional form builder) screen states, drawn as deterministic canvases. With a real
// product, code on screen must follow its README or docs: never invent an API.
// Replace each with a real recording (VP9 WebM) for a final film.
import { material, clamp, lerp } from '../sf/engine.js';

const UI = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', monospace";
const SERIF = "'Liberation Serif', 'DejaVu Serif', serif";
const typed = (s, t, cps, start = 0) => s.slice(0, Math.max(0, Math.floor((t - start) * cps)));

// ---------- hero object: the form card ----------
export function drawCard(ctx, w, h, t, { sign = 1 } = {}) {
  ctx.fillStyle = '#f3f0e8';
  ctx.fillRect(0, 0, w, h);
  const u = w / 100;
  ctx.fillStyle = '#0a0a0a';
  ctx.font = `700 ${4.2 * u}px ${MONO}`;
  ctx.fillText('OF-01', 8 * u, 11 * u);
  ctx.textAlign = 'right';
  ctx.font = `500 ${3.4 * u}px ${MONO}`;
  ctx.fillText('forms/meetup/index.tsx', 92 * u, 11 * u);
  ctx.textAlign = 'left';
  ctx.fillRect(8 * u, 15 * u, 84 * u, 0.5 * u);
  ctx.font = `800 ${9 * u}px ${UI}`;
  ctx.fillText('Meetup', 8 * u, 30 * u);
  const fields = ['Your name', 'Work email', 'Role'];
  fields.forEach((f, i) => {
    const y = 44 * u + i * 17 * u;
    ctx.font = `600 ${3.6 * u}px ${UI}`;
    ctx.fillStyle = '#55524b';
    ctx.fillText(f.toUpperCase(), 8 * u, y);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(8 * u, y + 7 * u, 84 * u, 0.45 * u);
  });
  const sy = h - 18 * u;
  ctx.font = `italic 600 ${5 * u}px ${SERIF}`;
  ctx.fillText('Sign here.', 8 * u, sy - 3 * u);
  ctx.fillRect(8 * u, sy + 4 * u, 84 * u, 0.6 * u);
  // signature stroke, drawn in as `sign` goes 0 -> 1
  ctx.strokeStyle = '#1d3fd6';
  ctx.lineWidth = 1.1 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const n = Math.floor(60 * clamp(sign, 0, 1));
  for (let k = 0; k <= n; k++) {
    const p = k / 60;
    const x = 40 * u + p * 46 * u;
    const y = sy - 1 * u + Math.sin(p * 18) * 3.2 * u * (1 - p * 0.5) - p * 3 * u;
    k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
}
export const card = (w = 600, h = 760) => material(w, h, (c, W, H, t) => drawCard(c, W, H, t, { sign: clamp(t / 1.2, 0, 1) }));

// ---------- agent terminal writing the form file ----------
// Formwright's DSL (fictional): a config export + a default component.
const CODE = [
  [['k', 'import'], ['t', ' { defineForm, Email, Form, Page, Select, Submit, Text, When }']],
  [['k', '  from'], ['s', " '@formwright/core'"], ['t', ';']],
  [['k', 'export const'], ['t', ' config = '], ['f', 'defineForm'], ['t', '({']],
  [['p', '  title'], ['t', ': '], ['s', "'Developer Meetup'"], ['t', ',']],
  [['p', '  submissions'], ['t', ': { maxResponses: '], ['n', '100'], ['t', ', uniqueBy: '], ['s', "'email'"], ['t', ' },']],
  [['t', '});']],
  [['k', 'export default function'], ['f', ' Meetup'], ['t', '() {']],
  [['k', '  return'], ['g', ' <Form>']],
  [['g', '    <Page'], ['p', ' title'], ['t', '='], ['s', '"About you"'], ['g', '>']],
  [['g', '      <Text'], ['p', ' name'], ['t', '='], ['s', '"name"'], ['p', ' label'], ['t', '='], ['s', '"Name"'], ['p', ' required'], ['g', ' />']],
  [['g', '      <Email'], ['p', ' name'], ['t', '='], ['s', '"email"'], ['p', ' label'], ['t', '='], ['s', '"Email"'], ['p', ' required'], ['g', ' />']],
  [['g', '      <Select'], ['p', ' name'], ['t', '='], ['s', '"role"'], ['p', ' options'], ['t', '={roles}'], ['g', ' />']],
  [['g', '      <When'], ['p', ' field'], ['t', '='], ['s', '"role"'], ['p', ' equals'], ['t', '='], ['s', '"Student"'], ['g', '>']],
  [['g', '        <Text'], ['p', ' name'], ['t', '='], ['s', '"school"'], ['p', ' required'], ['g', ' />']],
  [['g', '      </When></Page>']],
  [['g', '    <Submit>'], ['t', 'Register'], ['g', '</Submit></Form>'], ['t', ';']],
];
export function drawTerminal(ctx, w, h, t) {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
  const s = h / 720;
  ctx.font = `500 ${22 * s}px ${MONO}`;
  ctx.fillStyle = '#8a8a90';
  ctx.fillText('›', 40 * s, 60 * s);
  ctx.fillStyle = '#f5f5f7';
  ctx.fillText(typed('Meetup signup: name, email, role. Ask students for their school. Cap 100.', t, 60), 64 * s, 60 * s);
  if (t > 0.6) {
    ctx.fillStyle = '#30d158';
    ctx.fillText('● Writing forms/meetup/index.tsx', 40 * s, 104 * s);
  }
  const col = { k: '#ff7ab2', t: '#e6e6ea', s: '#fc6a5d', f: '#67b7a4', p: '#9ec7ff', n: '#d0bf69', g: '#ffa14f' };
  let budget = Math.floor(Math.max(0, t - 0.8) * 160);
  ctx.font = `500 ${21 * s}px ${MONO}`;
  CODE.forEach((line, i) => {
    let x = 60 * s;
    const y = 150 * s + i * 34 * s;
    line.forEach(([k, str]) => {
      const vis = str.slice(0, Math.max(0, budget));
      budget -= str.length;
      ctx.fillStyle = col[k];
      ctx.fillText(vis, x, y);
      x += ctx.measureText(vis).width;
    });
  });
}
export const terminal = (w = 1280, h = 720) => material(w, h, drawTerminal);

// ---------- the running form at /f/beta, in five theme starters ----------
const THEMES = {
  classic: { bg: '#eef0f3', card: '#ffffff', ink: '#111114', sub: '#6b6b73', line: '#d5d7dc', accent: '#2f5bff', font: UI, title: UI, radius: 14 },
  terminal: { bg: '#050805', card: '#0b120b', ink: '#7dff8a', sub: '#3fa34a', line: '#1f4d24', accent: '#7dff8a', font: MONO, title: MONO, radius: 0 },
  editorial: { bg: '#efe7d8', card: '#f7f1e6', ink: '#1b1712', sub: '#7a6e5c', line: '#1b1712', accent: '#b2361f', font: UI, title: SERIF, radius: 0 },
  conversational: { bg: '#141416', card: '#1f1f23', ink: '#f2f2f5', sub: '#8d8d96', line: '#34343a', accent: '#a78bfa', font: UI, title: UI, radius: 22 },
  brutalist: { bg: '#ffe500', card: '#ffffff', ink: '#000000', sub: '#000000', line: '#000000', accent: '#ff3b00', font: "'Archivo Variable', sans-serif", title: "'Archivo Variable', sans-serif", radius: 0 },
};
export function drawForm(ctx, w, h, t, theme = 'classic') {
  const T = THEMES[theme];
  const s = h / 720;
  ctx.fillStyle = T.bg;
  ctx.fillRect(0, 0, w, h);
  const cx = w * 0.18, cw = w * 0.64, cy = h * 0.1, ch = h * 0.82;
  ctx.fillStyle = T.card;
  if (theme === 'brutalist') { ctx.fillStyle = '#000'; ctx.fillRect(cx + 14 * s, cy + 14 * s, cw, ch); ctx.fillStyle = T.card; }
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, T.radius * s);
  ctx.fill();
  if (theme === 'brutalist') { ctx.lineWidth = 6 * s; ctx.strokeStyle = '#000'; ctx.stroke(); }
  const x = cx + 48 * s;
  ctx.fillStyle = T.sub;
  ctx.font = `600 ${17 * s}px ${T.font}`;
  ctx.fillText(theme === 'terminal' ? '[ step 1/2 ]' : 'Step 1 of 2', x, cy + 56 * s);
  ctx.fillStyle = T.ink;
  ctx.font = `${theme === 'editorial' ? 'italic 700' : '800'} ${46 * s}px ${T.title}`;
  ctx.fillText(theme === 'terminal' ? '> developer_meetup' : 'Developer Meetup', x, cy + 118 * s);
  if (theme === 'conversational') {
    const bubbles = [['q', "Hi! What's your name?"], ['a', typed('Mei Lin', t, 10)], ['q', 'And your work email?'], ['a', typed('mei@studio.dev', t, 14, 0.9)]];
    bubbles.forEach(([k, str], i) => {
      const y = cy + 170 * s + i * 82 * s;
      const bw = Math.max(120 * s, ctx.measureText(str).width + 60 * s);
      ctx.fillStyle = k === 'q' ? '#2c2c33' : T.accent;
      ctx.beginPath();
      ctx.roundRect(k === 'q' ? x : cx + cw - 48 * s - bw, y, bw, 58 * s, 26 * s);
      ctx.fill();
      ctx.fillStyle = k === 'q' ? T.ink : '#120a24';
      ctx.font = `600 ${21 * s}px ${UI}`;
      ctx.fillText(str, (k === 'q' ? x : cx + cw - 48 * s - bw) + 28 * s, y + 37 * s);
    });
    return;
  }
  const vals = [typed('Mei Lin', t, 10), typed('mei@studio.dev', t, 14, 0.9), t > 2 ? 'Designer' : ''];
  ['Your name', 'Work email', 'Role'].forEach((lab, i) => {
    const y = cy + 180 * s + i * 108 * s;
    ctx.fillStyle = T.sub;
    ctx.font = `600 ${16 * s}px ${T.font}`;
    ctx.fillText(theme === 'terminal' ? `${lab.toLowerCase().replace(' ', '_')}:` : lab, x, y);
    ctx.strokeStyle = T.line;
    ctx.lineWidth = (theme === 'brutalist' ? 4 : theme === 'editorial' ? 1.5 : 2) * s;
    if (theme === 'editorial' || theme === 'terminal') {
      ctx.beginPath(); ctx.moveTo(x, y + 52 * s); ctx.lineTo(cx + cw - 48 * s, y + 52 * s); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.roundRect(x, y + 12 * s, cw - 96 * s, 52 * s, T.radius * 0.6 * s); ctx.stroke();
    }
    ctx.fillStyle = T.ink;
    ctx.font = `500 ${21 * s}px ${T.font}`;
    ctx.fillText(vals[i], x + (theme === 'editorial' || theme === 'terminal' ? 0 : 16 * s), y + 45 * s);
  });
  const by = cy + ch - 92 * s;
  ctx.fillStyle = T.accent;
  ctx.beginPath();
  ctx.roundRect(x, by, 240 * s, 58 * s, T.radius * 0.6 * s);
  ctx.fill();
  if (theme === 'brutalist') { ctx.lineWidth = 4 * s; ctx.strokeStyle = '#000'; ctx.stroke(); }
  ctx.fillStyle = theme === 'terminal' ? '#050805' : '#fff';
  ctx.font = `700 ${20 * s}px ${T.font}`;
  ctx.fillText(theme === 'terminal' ? '[ continue ]' : 'Continue  →', x + 26 * s, by + 37 * s);
}
export const form = (theme, w = 1280, h = 720) => material(w, h, (c, W, H, t) => drawForm(c, W, H, t, theme));

// ---------- Studio: responses table / edit mode ----------
const PEOPLE = [
  ['Mei Lin', 'mei@studio.dev', 'Designer'], ['Arjun Rao', 'arjun@lattice.io', 'Engineer'],
  ['Sofia Marín', 'sofia@norte.co', 'Founder'], ['Kenji Ito', 'kenji@ito.jp', 'Engineer'],
  ['Ada Okafor', 'ada@okafor.dev', 'Designer'], ['Lena Vogt', 'lena@vogt.de', 'Engineer'],
  ['Tom Becker', 'tom@becker.io', 'Founder'], ['Yuna Park', 'yuna@park.kr', 'Designer'],
  ['Noah Silva', 'noah@silva.br', 'Engineer'], ['Iris Chen', 'iris@chen.tw', 'Designer'],
];
function studioChrome(ctx, w, h, tab) {
  const s = h / 720;
  ctx.fillStyle = '#0c0c0e';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#151518';
  ctx.fillRect(0, 0, 230 * s, h);
  ctx.fillStyle = '#f5f5f7';
  ctx.font = `700 ${20 * s}px ${UI}`;
  ctx.fillText('Formwright', 28 * s, 46 * s);
  ctx.font = `500 ${16 * s}px ${UI}`;
  ['beta', 'feedback', 'waitlist', 'rsvp'].forEach((f, i) => {
    ctx.fillStyle = i === 0 ? '#2a2a30' : 'transparent';
    ctx.fillRect(16 * s, (78 + i * 40) * s, 198 * s, 32 * s);
    ctx.fillStyle = i === 0 ? '#fff' : '#8d8d96';
    ctx.fillText(`forms/${f}`, 28 * s, (100 + i * 40) * s);
  });
  ['Preview', 'Edit', 'Responses'].forEach((tb, i) => {
    const x = (270 + i * 130) * s;
    ctx.fillStyle = tb === tab ? '#fff' : '#7d7d86';
    ctx.font = `600 ${17 * s}px ${UI}`;
    ctx.fillText(tb, x, 48 * s);
    if (tb === tab) { ctx.fillRect(x, 60 * s, ctx.measureText(tb).width, 3 * s); }
  });
}
export function drawStudio(ctx, w, h, t) {
  const s = h / 720;
  studioChrome(ctx, w, h, 'Responses');
  const n = clamp(Math.floor(3 + t * 3.2), 0, PEOPLE.length);
  ctx.fillStyle = '#fff';
  ctx.font = `800 ${34 * s}px ${UI}`;
  ctx.fillText(`${44 + n} responses`, 270 * s, 128 * s);
  ['Excel', 'CSV', 'JSON'].forEach((b, i) => {
    const x = w - (330 - i * 100) * s;
    ctx.strokeStyle = '#3a3a42';
    ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.roundRect(x, 100 * s, 86 * s, 38 * s, 8 * s); ctx.stroke();
    ctx.fillStyle = '#d6d6dc';
    ctx.font = `600 ${15 * s}px ${UI}`;
    ctx.fillText(b, x + 22 * s, 125 * s);
  });
  const cols = [270, 520, 860, 1060];
  ctx.fillStyle = '#7d7d86';
  ctx.font = `600 ${14 * s}px ${UI}`;
  ['NAME', 'EMAIL', 'ROLE', 'SUBMITTED'].forEach((c, i) => ctx.fillText(c, cols[i] * s, 186 * s));
  for (let i = 0; i < n; i++) {
    const y = (222 + i * 48) * s;
    const fresh = i >= n - 1 ? clamp((t * 3.2) % 1 * 3, 0, 1) : 1;
    ctx.globalAlpha = fresh;
    ctx.fillStyle = i === n - 1 ? 'rgba(48,209,88,0.12)' : 'transparent';
    ctx.fillRect(255 * s, y - 30 * s, w - 280 * s, 44 * s);
    ctx.fillStyle = '#ececf0';
    ctx.font = `500 ${17 * s}px ${UI}`;
    const p = PEOPLE[PEOPLE.length - 1 - i];
    ctx.fillText(p[0], cols[0] * s, y);
    ctx.fillStyle = '#a9a9b2';
    ctx.fillText(p[1], cols[1] * s, y);
    ctx.fillText(p[2], cols[2] * s, y);
    ctx.fillText(i === n - 1 ? 'just now' : `${(i + 1) * 3}m ago`, cols[3] * s, y);
    ctx.globalAlpha = 1;
  }
}
export const studio = (w = 1280, h = 720) => material(w, h, drawStudio);

export function drawStudioEdit(ctx, w, h, t) {
  const s = h / 720;
  studioChrome(ctx, w, h, 'Edit');
  ctx.save();
  ctx.translate(320 * s, 100 * s);
  drawForm(ctx, 800 * s, 590 * s, 3, 'classic');
  ctx.restore();
  // comment pins
  [[620, 300, 'Make email optional?'], [900, 560, 'Change CTA copy']].forEach(([x, y, txt], i) => {
    if (t < 0.3 + i * 0.5) return;
    ctx.fillStyle = '#ff9f0a';
    ctx.beginPath(); ctx.arc(x * s, y * s, 16 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = `800 ${16 * s}px ${UI}`;
    ctx.fillText(String(i + 1), (x - 5) * s, (y + 6) * s);
    ctx.fillStyle = '#1c1c20';
    ctx.beginPath(); ctx.roundRect((x + 26) * s, (y - 22) * s, 250 * s, 44 * s, 10 * s); ctx.fill();
    ctx.fillStyle = '#f0f0f3';
    ctx.font = `500 ${16 * s}px ${UI}`;
    ctx.fillText(txt, (x + 42) * s, (y + 6) * s);
  });
}
export const studioEdit = (w = 1280, h = 720) => material(w, h, drawStudioEdit);

// ---------- code editor: one line typing with a block caret, earlier lines dimmed ----------
// The typing line always sits on row EDITOR.row, so a camera can zoom onto it (EDITOR.caret).
const EDIT = [
  ['export default function Meetup() {', 0], ['return (', 1], ['<Form>', 2], ['<Page title="About you">', 3],
  ['<Text name="name" label="Name" required />', 4], ['<Email name="email" label="Email" required />', 4], ['</Page>', 3],
  ['<Page title="Background">', 3],
  ['<Select name="role" label="Role" options={["Student", "Engineer"]} />', 4],
  ['<When field="role" equals="Student">', 4], ['<Text name="school" label="School" required />', 5], ['</When>', 4],
  ['</Page>', 3], ['<Submit>Register</Submit>', 3], ['</Form>', 2],
];
export const EDITOR = { w: 3200, h: 1800, row: 12, x: 220, lh: 112, top: 260, indent: 64, font: 62 };
export function drawEditor(ctx, w, h, t) {
  const E = EDITOR, s = w / E.w;
  ctx.fillStyle = '#0b0b0c';
  ctx.fillRect(0, 0, w, h);
  ctx.font = `500 ${34 * s}px ${MONO}`;
  ctx.fillStyle = '#6a6a70';
  ctx.fillText('forms/meetup/index.tsx', 80 * s, 120 * s);
  // the typing line starts at line 8; each line takes len / cps seconds
  const cps = 34;
  let k = 8, left = Math.max(0, t) * cps;
  while (k < EDIT.length - 1 && left > EDIT[k][0].length + 6) { left -= EDIT[k][0].length + 6; k++; }
  const shown = Math.min(EDIT[k][0].length, Math.floor(left));
  const first = k - E.row;
  ctx.font = `500 ${E.font * s}px ${MONO}`;
  for (let r = 0; r <= E.row; r++) {
    const i = first + r;
    if (i < 0) continue;
    const y = (E.top + r * E.lh) * s;
    const [src, ind] = EDIT[i];
    const str = i === k ? src.slice(0, shown) : src;
    if (i === k) { ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(0, y - E.lh * 0.72 * s, w, E.lh * s); }
    ctx.fillStyle = '#4a4a50';
    ctx.fillText(String(41 + i).padStart(2), 70 * s, y);
    const x = (E.x + ind * E.indent) * s;
    ctx.fillStyle = i === k ? '#f5f5f7' : i >= k - 2 ? '#c9c9ce' : '#7c7c82';
    ctx.fillText(str, x, y);
    if (i === k && Math.floor(t * 2.4) % 2 === 0) {
      const cw = ctx.measureText(str).width;
      ctx.fillRect(x + cw + 2 * s, y - E.font * 0.82 * s, E.font * 0.55 * s, E.font * 1.0 * s);
    }
  }
}
export const editor = (w = EDITOR.w, h = EDITOR.h) => material(w, h, drawEditor);

// ---------- runtime: conditional page + validation, handled by Formwright ----------
export function drawLogic(ctx, w, h, t) {
  const s = h / 720;
  ctx.fillStyle = '#eef0f3'; ctx.fillRect(0, 0, w, h);
  const cx = w * 0.2, cw = w * 0.6, cy = h * 0.08;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(cx, cy, cw, h * 0.84, 14 * s); ctx.fill();
  const x = cx + 48 * s;
  ctx.fillStyle = '#6b6b73'; ctx.font = `600 ${17 * s}px ${UI}`; ctx.fillText('Step 2 of 2 · Background', x, cy + 56 * s);
  ctx.fillStyle = '#111114'; ctx.font = `800 ${44 * s}px ${UI}`; ctx.fillText('Developer Meetup', x, cy + 114 * s);
  const fw = cw - 96 * s;
  const field = (y, lab, val, err, a = 1) => {
    ctx.globalAlpha = a;
    ctx.fillStyle = '#6b6b73'; ctx.font = `600 ${16 * s}px ${UI}`; ctx.fillText(lab, x, y);
    ctx.strokeStyle = err ? '#e5484d' : '#d5d7dc'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.roundRect(x, y + 12 * s, fw, 52 * s, 9 * s); ctx.stroke();
    ctx.fillStyle = '#111114'; ctx.font = `500 ${21 * s}px ${UI}`; ctx.fillText(val, x + 16 * s, y + 45 * s);
    if (err) { ctx.fillStyle = '#e5484d'; ctx.font = `600 ${16 * s}px ${UI}`; ctx.fillText(err, x, y + 88 * s); }
    ctx.globalAlpha = 1;
  };
  const pick = t > 0.7;
  field(cy + 180 * s, 'Role', pick ? 'Student' : 'Select…');
  if (pick) {
    ctx.fillStyle = '#2f5bff'; ctx.font = `700 ${14 * s}px ${MONO}`;
    ctx.fillText('<When field="role" equals="Student">', x + fw - 340 * s, cy + 180 * s);
  }
  const a = clamp((t - 0.8) * 3, 0, 1);
  if (a > 0) field(cy + (290 - 30 * (1 - a)) * s, 'School', typed('NTU', t, 6, 1.2), t > 1.9 && t < 2.6 ? '' : '', a);
  field(cy + 400 * s, 'Email', 'mei@studio', t > 1.6 ? 'Enter a valid email address' : '');
  const by = cy + h * 0.84 - 92 * s;
  ctx.fillStyle = '#2f5bff'; ctx.beginPath(); ctx.roundRect(x, by, 220 * s, 58 * s, 9 * s); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `700 ${20 * s}px ${UI}`; ctx.fillText('Register', x + 26 * s, by + 37 * s);
}
export const logic = (w = 1280, h = 720) => material(w, h, drawLogic);

// ---------- runtime: dev server log, submissions validated and stored in SQLite ----------
const LOG = [
  ['#8a8a90', '$ npm run dev'],
  ['#f5f5f7', '  Formwright  ready on http://localhost:5173'],
  ['#8a8a90', '  forms: meetup  ·  storage: .formwright/ (SQLite)'],
  ['#8a8a90', ''],
  ['#30d158', '  POST /api/forms/meetup   201  saved  #45'],
  ['#ff9f0a', '  POST /api/forms/meetup   400  email: invalid'],
  ['#30d158', '  POST /api/forms/meetup   201  saved  #46'],
  ['#ff453a', '  POST /api/forms/meetup   409  duplicate email'],
  ['#30d158', '  POST /api/forms/meetup   201  saved  #47'],
  ['#30d158', '  POST /api/forms/meetup   201  saved  #48'],
];
export function drawServer(ctx, w, h, t) {
  const s = h / 720;
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, w, h);
  ctx.font = `500 ${24 * s}px ${MONO}`;
  const n = clamp(Math.floor(3 + t * 2.6), 0, LOG.length);
  for (let i = 0; i < n; i++) { ctx.fillStyle = LOG[i][0]; ctx.fillText(LOG[i][1], 50 * s, (80 + i * 52) * s); }
  ctx.fillStyle = '#f5f5f7'; ctx.font = `800 ${30 * s}px ${UI}`;
  ctx.fillText(`${Math.max(0, n - 4) > 0 ? 44 + LOG.slice(4, n).filter((r) => r[1].includes('201')).length : 44} / 100`, 50 * s, 660 * s);
  ctx.fillStyle = '#8a8a90'; ctx.font = `500 ${18 * s}px ${UI}`; ctx.fillText('responses · unique by email', 200 * s, 660 * s);
}
export const server = (w = 1280, h = 720) => material(w, h, drawServer);
