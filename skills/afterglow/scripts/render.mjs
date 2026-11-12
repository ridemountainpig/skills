#!/usr/bin/env node
// Render a film page frame by frame with Playwright + ffmpeg.
//
//   node render.mjs --root <dir> --page film/film.html --out out/film.mp4
//        [--scale 0.5] [--blur 3] [--from 0] [--to <sec>] [--audio audio.wav] [--query k=v&k2=v2]
//   node render.mjs --root <dir> --page film/film.html --stills 1.2,3.5 --outdir out/stills
//   node render.mjs --root <dir> --page film/film.html --timeline out/timeline.json   (alone, or with --out/--stills)
//
// --blur N renders N shutter sub-samples per frame (180° shutter) and averages them.
// Sub-samples never cross a cut: the page clamps them to the frame's own shot.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

// Resolve playwright from the project first, then from the global install.
const require = createRequire(path.join(process.cwd(), 'noop.js'));
const { chromium } = require('playwright');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
const root = path.resolve(args.root || '.');
const scale = Number(args.scale || 1);
const blur = Math.max(1, Number(args.blur || 1));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.ttf': 'font/ttf', '.otf': 'font/otf', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.hdr': 'application/octet-stream' };
// Byte ranges matter: without them Chromium cannot seek a <video>, and every footage frame
// would show the clip's first frame.
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  const type = MIME[path.extname(p).toLowerCase()] || 'application/octet-stream', size = fs.statSync(p).size;
  const r = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (r && (r[1] || r[2])) {
    const a = r[1] ? Number(r[1]) : Math.max(0, size - Number(r[2])), b = r[1] && r[2] ? Math.min(Number(r[2]), size - 1) : size - 1;
    if (a >= size || a > b) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }); return res.end(); }
    res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${a}-${b}/${size}`, 'Content-Length': b - a + 1 });
    return fs.createReadStream(p, { start: a, end: b }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': size });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// The stage is always 1920x1080 CSS px; --scale shrinks the output through the device scale factor.
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
page.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('[review]')) console.error('[page]', m.text()); });
page.on('pageerror', (e) => console.error('[page error]', e.message));
await page.goto(`http://127.0.0.1:${port}/${args.page}?scale=${scale}${args.query ? `&${args.query}` : ''}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
const film = await page.evaluate(() => window.__film);

const shoot = async (t, anchor) => {
  await page.evaluate(([a, b]) => window.renderFrame(a, b), [t, anchor]);
  return page.screenshot({ type: 'png' });
};

// --timeline writes the film's cut and event list; with --out or --stills the render follows
if (args.timeline) {
  fs.mkdirSync(path.dirname(path.resolve(args.timeline)), { recursive: true });
  fs.writeFileSync(args.timeline, JSON.stringify(film, null, 2));
  console.log('timeline ->', args.timeline);
}
if (args.timeline && !args.out && !args.stills) {
  // timeline only
} else if (args.stills) {
  const outdir = args.outdir || 'stills';
  fs.mkdirSync(outdir, { recursive: true });
  for (const s of String(args.stills).split(',')) {
    const t = Number(s);
    fs.writeFileSync(path.join(outdir, `still-${t.toFixed(2).padStart(6, '0')}.png`), await shoot(t, t));
  }
  console.log('stills ->', outdir);
} else {
  const fps = film.fps;
  const from = Number(args.from || 0), to = Number(args.to || film.duration);
  const f0 = Math.round(from * fps), f1 = Math.round(to * fps);
  fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
  const vf = blur > 1
    ? `tmix=frames=${blur},select='eq(mod(n\\,${blur})\\,${blur - 1})',setpts=N/${fps}/TB`
    : 'null';
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(fps * blur), '-i', '-',
    ...(args.audio ? ['-ss', String(from), '-i', args.audio] : []),
    '-vf', `${vf},format=yuv420p`, '-r', String(fps),
    '-c:v', 'libx264', '-preset', scale < 1 ? 'veryfast' : 'slow', '-crf', scale < 1 ? '23' : '16',
    ...(args.audio ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
    '-movflags', '+faststart', args.out], { stdio: ['pipe', 'inherit', 'inherit'] });
  // If ffmpeg dies (bad args, disk full), stop feeding it and fail instead of reporting an incomplete video.
  let ffExit = null;
  const ffDone = new Promise((r) => { ff.on('close', (c, sig) => r(ffExit = [c, sig])); ff.on('error', (e) => r(ffExit = [e.message, null])); });
  ff.stdin.on('error', () => {}); // EPIPE after an early exit; the exit code is reported below
  const started = Date.now();
  for (let f = f0; f < f1 && !ffExit; f++) {
    const anchor = f / fps;
    for (let k = 0; k < blur; k++) {
      // 180° shutter centred on the frame time.
      const t = blur > 1 ? anchor + ((k + 0.5) / blur - 0.5) * (0.5 / fps) : anchor;
      const png = await shoot(t, anchor);
      if (ffExit) break;
      if (!ff.stdin.write(png)) await Promise.race([new Promise((r) => ff.stdin.once('drain', r)), ffDone]);
    }
    if ((f - f0) % 24 === 0) process.stdout.write(`frame ${f}/${f1} (${((Date.now() - started) / 1000).toFixed(0)}s)\n`);
  }
  ff.stdin.end();
  const [code, signal] = await ffDone;
  if (code !== 0) { console.error(`ffmpeg failed (code ${code}, signal ${signal}); ${args.out} is incomplete`); await browser.close(); server.close(); process.exit(1); }
  console.log('video ->', args.out);
}
await browser.close();
server.close();
