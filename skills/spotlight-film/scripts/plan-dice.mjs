// Draws the free axes of a film (structure, tempo, opening, closing, bloom order and link,
// bpm, pace, one rule break) from a seed, so two products never start from the same plan.
// It reads film-log.md and redraws any axis that matches the most recent film.
//   node sf/plan-dice.mjs "Product name" [--log film-log.md] [--seed 7]
// Paste the printed block into PLAN.md › Film concept. You may override ONE draw; write why.
import fs from 'node:fs';

const AXES = {
  structure: ['classic', 'cold-open', 'one-take', 'call-response', 'countdown', 'deep-dive', 'two-act'],
  tempo: ['steady-build', 'accelerate', 'decelerate', 'breath', 'stop-start'],
  opening: ['shrink', 'light-first', 'macro-pullback', 'type-first', 'type-slot', 'cold-proof'],
  closing: ['small-name', 'retract-all', 'beam-to-mark', 'black-line', 'hero-hold'],
  bloomOrder: ['cw', 'ccw', 'near', 'mirror'],
  bloomLink: ['return', 'chain', 'interrupt'],
  bpm: [96, 100, 104, 108, 112, 116, 120, 124, 128, 132],
  pace: [1.1, 1.2, 1.25, 1.3, 1.4, 1.5],
  ruleBreak: ['two-beams-once', 'anchor-off-centre-once', 'one-dissolve', 'giant-anchor', 'anchor-late', 'beam-without-content'],
};

const MEAN = {
  classic: 'shrink → title → bloom → claim → burst → bloom → claim → brand',
  'cold-open': 'strongest proof or figure first; the anchor arrives in shot 2–3 as the answer',
  'one-take': 'one continuous camera path through 4–5 beams; internal cuts only, one hard cut to brand',
  'call-response': 'two themes alternate A/B/A/B, beams mirrored left/right, each round shorter',
  countdown: 'features stack up, shots shrink 2.5 → 1.5 → 0.8 → 0.5 s, then one long still',
  'deep-dive': 'one claim only, the same beam seen from many angles and scales',
  'two-act': 'slow and large, a 0.5–1 s blackout, then all fast cuts',
  'steady-build': 'shots shorten gently toward the end',
  accelerate: 'each act is clearly faster than the last',
  decelerate: 'fast start, long final holds',
  breath: 'fast – slow – fast; the slow middle holds one image ≥ 4 s',
  'stop-start': 'runs of 0.5 s cuts broken by dead-still holds',
  shrink: 'anchor fills the frame, shrinks and tips to isometric',
  'light-first': 'black, then a beam of light alone, then the anchor appears at its narrow end',
  'macro-pullback': 'start on a macro detail of the anchor, pull back until it is a speck',
  'type-first': 'the product name or figure alone on black, the anchor cuts in under it',
  'type-slot': 'typeSlot(): name and figure fill the frame on a diagonal plane, the anchor stands on the type and its first beam opens between the words',
  'cold-proof': 'a full-frame proof shot before anything else',
  'small-name': 'small anchor + name + legal',
  'retract-all': '3–4 of the film\'s beams reopen in turn (≥ 1.2 shot-s each, retractAll()), then the name',
  'beam-to-mark': 'the last beam narrows into the product mark or name',
  'black-line': 'hard cut to black with one line of type, then the legal',
  'hero-hold': 'the anchor large and still, name beside it',
  cw: 'each next beam clockwise from the last', ccw: 'each next beam counter-clockwise', near: 'each next beam the shorter way',
  mirror: 'beats alternate sides (place them mirrored), turning the shorter way',
  return: 'each beam shuts and the anchor is seen face up before the next',
  chain: 'the next beam opens as the last one shuts, no face-up pause',
  interrupt: 'some beams never shut: a hard cut takes them mid-hold (shut: 0)',
  'two-beams-once': 'one shot shows two beams from the anchor',
  'anchor-off-centre-once': 'one beam shot puts the anchor off-centre',
  'one-dissolve': 'one boundary dissolves instead of cutting',
  'giant-anchor': 'one shot where the anchor fills half the frame',
  'anchor-late': 'the anchor does not appear until the second third',
  'beam-without-content': 'one beam is pure light, no content',
};

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const name = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))) || 'film';
const logPath = opt('--log', 'film-log.md');

// FNV-1a over the name (+ optional seed), then mulberry32
let h = 2166136261;
for (const ch of `${name}#${opt('--seed', '0')}`) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
let s = h >>> 0;
const rand = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// last film's fingerprint: the last table row of film-log.md, columns in AXES order after the name
let last = {};
if (fs.existsSync(logPath)) {
  const rows = fs.readFileSync(logPath, 'utf8').split('\n').filter((r) => r.startsWith('|') && !r.includes('---'));
  const head = rows[0]?.split('|').map((c) => c.trim()).filter(Boolean) || [];
  const row = rows.length > 1 ? rows[rows.length - 1].split('|').map((c) => c.trim()).filter(Boolean) : [];
  head.forEach((k, i) => { last[k] = row[i]; });
}

const draw = {};
for (const [k, vals] of Object.entries(AXES)) {
  const pool = vals.filter((v) => String(v) !== last[k]);
  draw[k] = pool[Math.floor(rand() * pool.length)];
}
// classic is the old default: never draw it twice in a row, and pair it with a non-default tempo
if (draw.structure === 'classic' && draw.tempo === 'steady-build') draw.tempo = 'stop-start';

console.log(`## Film concept (drawn by plan-dice for "${name}"${last.film ? `, avoiding ${last.film}` : ''})\n`);
console.log('| Axis | Draw | Meaning (references/structures.md) |\n| --- | --- | --- |');
for (const [k, v] of Object.entries(draw)) console.log(`| ${k} | ${v} | ${MEAN[v] || ''} |`);
console.log('\nConcept (one sentence, how the form echoes the product):\nSignature moment (only this product could have it; which rule it breaks):\nOverride (at most one axis, with the reason):');
console.log(`\nfilm-log row: | ${name} | ${Object.values(draw).join(' | ')} | <family sequence> |`);
