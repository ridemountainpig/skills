// A physical product as the anchor: the phone is a lit 3D object (productFace + slabObject), not a
// printed card, and its beams carry footage that plays frame-accurately (footage()).
// The order here is only an example; run plan-dice for your own Film concept.
// Stand-in footage until the user supplies some:
//   ffmpeg -f lavfi -i "gradients=s=1280x720:r=24:d=8:speed=0.03:c0=0x1b2a4a:c1=0xd08a50:c2=0x2c5f73:n=3,drawgrid=w=160:h=160:t=2:c=white@0.25" -c:v libvpx-vp9 -b:v 1M assets/clip.webm
import { ready, footage } from '../sf/engine.js';
import { useFace, runFilm, beats } from '../sf/anchor.js';
import { productFace, slabObject } from '../sf/product3d.js';
import { seq, heroHold, bloomShot, funnel, insert, brand } from '../sf/shots-lib.js';
import { back } from './materials.js';
import { PINS } from './pins.js';

const BPM = 120, PACE = 1.25, B = beats(BPM, PACE);

// With a model: const phone = await loadGLB('/assets/phone.glb');
const phone = slabObject(back(), { depth: 0.09, radius: 0.16, edge: 0x6d7076 });
// a slow turn that stays within ±25° (the beam's neck is measured from the outline at t = 0)
useFace(productFace(phone, { w: 600, h: 1100, view: (t) => ({ yaw: -22 + 8 * Math.sin(t * 0.6), pitch: 14 }) }), { cutout: true, light: 'auto' });

const run = footage('/assets/clip.webm'), clip = () => run;

const shots = seq([
  heroHold({ id: 'hero', dur: B(6), w: 300, name: [[['LUMEN 1', 'word']]], line: 'A camera that fits in a pocket.' }),
  bloomShot({ id: 'bloom', w: 200, beats: [
    { m: clip, at: [560, -200], w: 680, t0: 0, t1: B(7), type: [[['SHOT ON', 'word']], [['LUMEN', 'fig']]], size: 72 },
  ] }),
  insert({ id: 'insert', dur: B(2), m: clip }),
  funnel({ id: 'claim', dur: B(7), w: 140, size: 80, m: clip, lines: [[['TWO', 'word'], ['48MP', 'fig']], [['CAMERAS*', 'word']]] }),
  brand({ id: 'brand', dur: B(6), name: 'Lumen 1',
    legal: 'Lumen 1 is a fictional product made for this template. *Illustrative claim. Footage is a stand-in.' }),
]);

runFilm({
  shots, duration: shots[shots.length - 1].end, pace: PACE, bpm: BPM, pins: PINS
});
await ready([`800 80px 'Archivo Variable'`, `600 20px 'Inter'`, `700 20px 'Inter'`]);
