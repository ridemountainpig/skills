// Starter materials for a fictional app, "Tempo" (a habit tracker). Replace every material with
// the real product: screen recordings (VP9 WebM), real UI states, or a 3D model. Keep each draw
// deterministic in t.
import { material, clamp } from '../sf/engine.js';

const UI = "'Inter', system-ui, sans-serif";

// The anchor's face: whatever stands for the product (app icon, device top view, box, card).
export const face = () => material(600, 600, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#ff8a3d'); g.addColorStop(1, '#ff3d6e');
  c.fillStyle = g; c.beginPath(); c.roundRect(0, 0, w, h, 130); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 46; c.lineCap = 'round';
  c.beginPath(); c.arc(w / 2, h / 2, 170, -Math.PI / 2, Math.PI * 1.1); c.stroke();
});

const HABITS = ['Run 5 km', 'Read 20 pages', 'No phone after 22:00', 'Stretch', 'Water 2 L'];
export const today = () => material(1280, 720, (c, w, h, t) => {
  c.fillStyle = '#101014'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#f5f5f7'; c.font = `800 52px ${UI}`; c.fillText('Today', 80, 110);
  const done = clamp(Math.floor(t * 1.6), 0, HABITS.length);
  HABITS.forEach((hb, i) => {
    const y = 180 + i * 100;
    c.fillStyle = '#1c1c22'; c.beginPath(); c.roundRect(80, y, w - 160, 80, 18); c.fill();
    c.fillStyle = i < done ? '#ff6a4d' : '#3a3a44'; c.beginPath(); c.arc(130, y + 40, 18, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ececf0'; c.font = `600 30px ${UI}`; c.fillText(hb, 170, y + 51);
  });
});

// A light UI on purpose: beams dim its sampled background automatically (fill 'auto').
export const week = () => material(1280, 720, (c, w, h, t) => {
  c.fillStyle = '#f4f4f6'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#111'; c.font = `800 48px ${UI}`; c.fillText('This week', 80, 110);
  const vals = [3, 4, 5, 2, 5, 4, 5];
  vals.forEach((v, i) => {
    const p = clamp(t * 1.5 - i * 0.12, 0, 1), bh = v * 80 * p;
    c.fillStyle = v === 5 ? '#ff5a4d' : '#c9c9d1';
    c.beginPath(); c.roundRect(110 + i * 150, 620 - bh, 90, bh, 14); c.fill();
    c.fillStyle = '#777'; c.font = `600 24px ${UI}`; c.fillText('MTWTFSS'[i], 142 + i * 150, 670);
  });
});
