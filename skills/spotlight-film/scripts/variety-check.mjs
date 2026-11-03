// Gate 8 numbers: how far this film's family sequence is from every film in film-log.md,
// and the shape of its shot lengths. Families use the short codes listed in film-log.md.
//   node sf/variety-check.mjs --log film-log.md --families "burst fig sig bloom ..." [--timeline out/timeline.json]
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const seq = (opt('--families', '') || '').trim().split(/\s+/).filter(Boolean);
if (!seq.length) { console.error('pass --families "<codes in shot order>"'); process.exit(2); }

const rows = fs.existsSync(opt('--log', 'film-log.md'))
  ? fs.readFileSync(opt('--log', 'film-log.md'), 'utf8').split('\n').filter((r) => r.startsWith('|') && !r.includes('---')) : [];
const head = rows[0]?.split('|').map((c) => c.trim()).filter(Boolean) || [];
const films = rows.slice(1).map((r) => { const c = r.split('|').map((x) => x.trim()).filter(Boolean); return Object.fromEntries(head.map((k, i) => [k, c[i]])); });

const lev = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
// longest run of consecutive families shared with another film, in the same order
const run = (a, b) => { let best = 0; for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) { let k = 0; while (a[i + k] && a[i + k] === b[j + k]) k++; best = Math.max(best, k); } return best; };

let fail = false;
for (const f of films) {
  const other = (f.families || '').split(/\s+/).filter(Boolean);
  if (!other.length) continue;
  const dist = lev(seq, other) / Math.max(seq.length, other.length), r = run(seq, other);
  const ok = dist >= 0.5 && r < 3;
  if (!ok && f === films[films.length - 1]) fail = true;
  console.log(`[variety] vs ${f.film}: difference ${(dist * 100).toFixed(0)}% (≥ 50), shared run ${r} (< 3) ${ok ? 'OK' : 'FIX'}`);
}

if (opt('--timeline')) {
  const t = JSON.parse(fs.readFileSync(opt('--timeline'), 'utf8'));
  const cuts = [0, ...(t.cuts || []), t.duration];
  const len = cuts.slice(1).map((c, i) => c - cuts[i]).filter((x) => x > 0.05);
  const bar = (x) => '█'.repeat(Math.max(1, Math.round(x * 4)));
  console.log('\n[variety] shot lengths (s), check the shape against the tempo in PLAN.md:');
  len.forEach((x, i) => console.log(`  ${String(i + 1).padStart(2)} ${x.toFixed(2).padStart(5)} ${bar(x)}`));
  const short = len.filter((x) => x <= 0.8).length, long = len.filter((x) => x >= 4).length;
  const flat = len.slice(1).filter((x, i) => Math.abs(x - len[i]) / Math.max(x, len[i]) < 0.1).length;
  console.log(`  ≤ 0.8 s: ${short} (≥ 1) · ≥ 4 s: ${long} (≥ 1) · neighbours within 10%: ${flat} (≤ 2)`);
  if (!short || !long || flat > 2) fail = true;
}
console.log(fail ? '\n[variety] FIX' : '\n[variety] OK');
process.exit(fail ? 1 : 0);
