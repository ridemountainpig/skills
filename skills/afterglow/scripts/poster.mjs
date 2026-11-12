#!/usr/bin/env node
// Stills from the same film page: node afterglow/poster.mjs --root . --page film/film.html --outdir out/posters
//   --jobs "hero:amber:8.6,square:green,story:cyan,triptych:amber"   (kind:look[:time]; no time = poster.times in shots.js)
//   kinds: hero 1920x1080, square 1080x1080, story 1080x1920, triptych 1920x1080 (three looks side by side)
//   --query "device=monitor"  passes extra page parameters
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(path.join(process.cwd(), 'noop.js')); const { chromium } = require('playwright');
const A = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const root = path.resolve(A.root || '.'), out = A.outdir || 'posters'; fs.mkdirSync(out, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(new URL(q.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const SIZE = { hero: [1920, 1080], square: [1080, 1080], story: [1080, 1920], triptych: [1920, 1080] };
const b = await chromium.launch();
for (const job of A.jobs.split(',')) {
  const [kind, pal, t] = job.split(':'); const [w, h] = SIZE[kind];
  const pg = await b.newPage({ viewport: { width: w, height: h } });
  pg.on('pageerror', (e) => console.error('[page error]', e.message));
  pg.on('console', (m) => { if (m.text().includes('[review] FIX')) console.error('[page]', m.text()); });
  await pg.goto(`http://127.0.0.1:${srv.address().port}/${A.page}?poster=${kind}&palette=${pal}${A.query ? '&' + A.query : ''}`);
  await pg.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  await pg.evaluate((x) => window.renderFrame(x), Number(t));
  const f = path.join(out, `${kind}-${pal}.png`); await pg.screenshot({ path: f }); console.log('->', f); await pg.close();
}
await b.close(); srv.close();
