# afterglow sound: python3 afterglow/sound.py out/timeline.json out/sound.wav
# Built from the film's own event list (window.__film.events, written by render.mjs --timeline).
# CRT hum + key clicks + knob detents + power-on + a quiet pad. Original, no samples. numpy + stdlib only.
import json, sys, wave, numpy as np
SR = 48000
tl = json.load(open(sys.argv[1])); out = sys.argv[2]
N = int((tl['duration'] + 0.5) * SR); L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7); t = np.arange(N) / SR
def add(sig, at, pan=0.0, g=1.0):
    i = int(at * SR); n = min(len(sig), N - i)
    if n <= 0 or i < 0: return
    L[i:i+n] += sig[:n] * g * (1 - pan); R[i:i+n] += sig[:n] * g * (1 + pan)
def env(n, a=0.002, d=0.05):
    x = np.arange(n) / SR; return np.minimum(1, x / a) * np.exp(-x / d)
def click(d=0.03):
    n = int(d * SR); s = rng.standard_normal(n) * env(n, 0.0005, d / 4); return np.convolve(np.diff(np.concatenate([[0], s])), np.ones(6) / 6, "same")
def tone(f, d, a=0.01, dec=0.3, h=(1, .4, .2)):
    n = int(d * SR); x = np.arange(n) / SR
    return sum(w * np.sin(2 * np.pi * f * (k + 1) * x) for k, w in enumerate(h)) * env(n, a, dec)
on = next((e['t'] for e in tl['events'] if e['type'] == 'poweron'), 0.0); end = tl['duration']
hum = (0.5 * np.sin(2*np.pi*60*t) + 0.25*np.sin(2*np.pi*120*t)) * 0.012
pad = sum(np.sin(2*np.pi*f*t + p) for f, p in [(110, 0), (164.81, 1), (261.63, 2), (246.94, 3)]) * 0.012
pad *= 0.6 + 0.4 * np.sin(2*np.pi*0.25*t)
gate = np.clip((t - on) / 1.5, 0, 1) * np.clip((end + 0.3 - t) / 1.2, 0, 1)
L += (hum + pad) * gate; R += (hum + pad * 0.9) * gate
for e in tl['events']:
    a, k = e['t'], e['type']
    if k == 'key': add(click(0.025), a + rng.uniform(-.008, .008), rng.uniform(-.3, .3), 0.35); add(tone(180, .05, .001, .015, (1,)), a, 0, .08)
    elif k == 'click': add(click(0.02), a, .4, .4)
    elif k == 'enter': add(click(0.05), a, .3, .6); add(tone(95, .2, .001, .05, (1, .3)), a, 0, .35)
    elif k == 'knob':
        for j in range(3): add(click(0.012), a + j * 0.045, .35, .3)
        add(tone(880, .25, .001, .06, (1, .2)), a + .14, 0, .05)
    elif k == 'poweron':
        n = int(1.2 * SR); x = np.arange(n) / SR
        thump = np.sin(2*np.pi*(55 + 30*np.exp(-x*8))*x) * env(n, .003, .25)
        whine = np.sin(2*np.pi*(4000 + 3000*np.minimum(1, x/0.4))*x) * env(n, .2, .3) * .05
        add(thump * .6 + whine, a)
    elif k == 'scan':
        n = int(e['dur'] * SR); x = np.arange(n) / SR
        add(np.sin(2*np.pi*(600 + 500*np.sin(np.pi*x/e['dur']))*x) * np.sin(np.pi*x/e['dur']) * .05, a)
    elif k == 'ok':
        for j, f in enumerate([659.25, 987.77]): add(tone(f, .5, .003, .15), a + j*.09, 0, .12)
    elif k == 'rain':
        for j in range(26): add(tone(rng.choice([1318.5, 1567.98, 1975.5, 2349.3]), .25, .001, .05, (1,)), a + rng.uniform(0, e['dur']), rng.uniform(-.7, .7), .05)
    elif k == 'cut': add(click(0.015), a, 0, .12)
    elif k == 'end':
        for f in [220, 329.63, 440, 554.37]: add(tone(f, 3.4, .4, 1.4, (1, .3, .1)), a + .1, 0, .06)
# loudness: scale to about -16 LUFS by RMS (the bed is quiet, the clicks are peaky), then soft-clip the peaks
mix = np.stack([L, R], 1); mix *= 10 ** (-17.5 / 20) / np.sqrt(np.mean(mix ** 2)); mix = 0.62 * np.tanh(mix / 0.62)
w = wave.open(out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes()); w.close()
print('audio ->', out)
