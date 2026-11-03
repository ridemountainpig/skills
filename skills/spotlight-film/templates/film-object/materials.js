// A fictional phone ("Lumen 1") for the physical-product template. With a real product, replace
// `back` by the product photo on alpha (an <img> drawn into a material) or load its GLB instead.
import { material } from '../sf/engine.js';

// the back of the phone: dark glass, a camera plateau with two lenses, a small wordmark
export const back = () => material(500, 1040, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2a2c31'); g.addColorStop(1, '#121316');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#0b0c0e'; c.beginPath(); c.roundRect(40, 40, 220, 330, 60); c.fill();
  for (const y of [130, 280]) {
    c.fillStyle = '#1d1f24'; c.beginPath(); c.arc(150, y, 62, 0, 7); c.fill();
    c.fillStyle = '#05060a'; c.beginPath(); c.arc(150, y, 40, 0, 7); c.fill();
    c.fillStyle = 'rgba(120,160,255,.5)'; c.beginPath(); c.arc(138, y - 12, 9, 0, 7); c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '600 34px Inter, sans-serif'; c.fillText('LUMEN', 190, 900);
});
