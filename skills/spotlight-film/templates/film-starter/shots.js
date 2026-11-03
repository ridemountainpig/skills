// Starter: a small product-neutral film assembled from sf/shots-lib.js with seq(). Swap
// materials.js, run plan-dice for your own Film concept, and build a different order: this one
// (cold-open, stop-start) is only an example of how the pieces fit.
// Shot times are shot-seconds; runFilm() stretches them by `pace`. Durations are written in beats
// (B(n), from beats(bpm, pace)) so every cut lands on the beat ([review] grid).
import { ready } from '../sf/engine.js';
import { useFace, runFilm, beats } from '../sf/anchor.js';
import { seq, typeCard, insert, bloomShot, blackout, funnel, brand } from '../sf/shots-lib.js';
import { face, today, week } from './materials.js';
import { PINS } from './pins.js';

useFace(face(), { light: 'auto' });
const BPM = 108, PACE = 1.3, B = beats(BPM, PACE);

const shots = seq([
  typeCard({ id: 'figure', dur: B(3), lines: [[['7', 'fig'], ['DAYS', 'word']]], size: 240 }),
  insert({ id: 'week', dur: B(2), m: week }),
  // the anchor appears late (rule break), turning counter-clockwise; the second beat is cut away
  bloomShot({ id: 'bloom', w: 170, beats: [
    { m: today, at: [560, -220], w: 680, t0: 0, t1: B(7) },
    { m: week, at: [-560, 220], w: 680, t0: B(7) + 0.05, t1: B(11), shut: 0, dir: -1, type: [[['EVERY STREAK', 'word']], [['KEPT', 'fig']]], size: 72 },
  ] }),
  blackout({ id: 'black', dur: B(1) }),
  funnel({ id: 'claim', dur: B(7), m: week, lines: [[['UP TO', 'word'], ['2X', 'fig']], [['MORE HABITS KEPT*', 'word']]] }),
  brand({ id: 'brand', dur: B(6), style: 'black-line', line: 'Tempo. Habits that stick.',
    legal: 'Tempo is a fictional product made for this template. *Illustrative claim, not a measured result.' }),
]);

runFilm({
  shots, duration: shots[shots.length - 1].end, pace: PACE, bpm: BPM, pins: PINS
});
await ready([`800 80px 'Archivo Variable'`, `600 20px 'Inter'`, `700 20px 'Inter'`]);
