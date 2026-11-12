import { chime, noise, tone } from '../shared/audio.js';

const MIN_SPEED = 4;
const BODY_INTERVAL_MS = 70;
const GLOBAL_INTERVAL_MS = 14;
const lastSoundByBody = new WeakMap();
let lastSoundAt = 0;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const vary = (value, amount = 0.12) => value * (1 - amount + Math.random() * amount * 2);
const panFor = (x) => clamp(x / 40, -1, 1);

const VOICES = {
  plastic({ level, weight, pan }) {
    const pitch = vary(240 - weight * 150);
    tone({ frequency: pitch, endFrequency: pitch * 0.6, duration: 0.08 + weight * 0.08, gain: level * 0.5, type: 'triangle', pan });
    noise({ frequency: vary(1300 - weight * 600), q: 1.4, duration: 0.05, gain: level * 0.35, pan });
    noise({ type: 'highpass', frequency: 3500, q: 0.7, duration: 0.012, gain: level * 0.15, pan });
  },
  metal({ level, weight, pan }) {
    const pitch = vary(900 - weight * 450);
    tone({ frequency: pitch, endFrequency: pitch * 0.97, duration: 0.25, gain: level * 0.18, type: 'triangle', pan });
    chime({ frequency: vary(pitch * 2.3), duration: 0.35, gain: level * 0.08, pan });
    noise({ frequency: 3000, q: 2, duration: 0.03, gain: level * 0.25, pan });
  },
  glass({ level, weight, pan }) {
    chime({ frequency: vary(2600 - weight * 900), duration: 0.5, gain: level * 0.14, pan });
    noise({ type: 'highpass', frequency: 4200, q: 0.8, duration: 0.04, gain: level * 0.3, pan });
    tone({ frequency: vary(140), endFrequency: 80, duration: 0.12, gain: level * 0.35 * weight, pan });
  },
  ceramic({ level, weight, pan }) {
    chime({ frequency: vary(3200 - weight * 1400, 0.2), duration: 0.28, gain: level * 0.12, pan });
    noise({ type: 'highpass', frequency: 3800, q: 0.7, duration: 0.025, gain: level * 0.35, pan });
    tone({ frequency: vary(700), endFrequency: 500, duration: 0.05, gain: level * 0.15, pan });
  },
  wood({ level, weight, pan }) {
    const pitch = vary(1100 - weight * 500, 0.2);
    tone({ frequency: pitch, endFrequency: pitch * 0.8, duration: 0.04, gain: level * 0.3, type: 'triangle', pan });
    noise({ frequency: vary(2600), q: 4, duration: 0.025, gain: level * 0.3, pan });
  },
  paper({ level, pan }) {
    noise({ type: 'lowpass', frequency: 1400, q: 0.6, duration: 0.07, gain: level * 0.4, pan });
  },
  rubber({ level, pan }) {
    tone({ frequency: vary(110), endFrequency: 70, duration: 0.07, gain: level * 0.35, pan });
  },
};

export function playImpact({ body, material = 'plastic', speed, mass, x }) {
  if (speed < MIN_SPEED) return;
  const now = performance.now();
  if (now - lastSoundAt < GLOBAL_INTERVAL_MS || now - (lastSoundByBody.get(body) ?? 0) < BODY_INTERVAL_MS) return;
  lastSoundAt = now;
  lastSoundByBody.set(body, now);
  const level = clamp((speed - MIN_SPEED) / 45, 0.05, 1) * clamp(0.35 + Math.log10(1 + mass * 4) * 0.5, 0.25, 1);
  const weight = clamp(Math.log10(1 + mass) / 1.2, 0, 1);
  (VOICES[material] ?? VOICES.plastic)({ level, weight, pan: panFor(x) });
}

export function playPunch(material, x) {
  const pan = panFor(x);
  noise({ type: 'lowpass', frequency: 700, q: 0.8, duration: 0.06, gain: 0.35, pan });
  tone({ frequency: 90, endFrequency: 55, duration: 0.09, gain: 0.3, pan });
  (VOICES[material] ?? VOICES.plastic)({ level: 0.35, weight: 0.5, pan });
}

export function playBreak(x) {
  const pan = panFor(x);
  for (let index = 0; index < 6; index += 1) {
    const delay = index * 0.03 + Math.random() * 0.03;
    noise({ frequency: vary(1100, 0.4), q: 2, duration: 0.05, gain: 0.25, delay, pan });
    tone({ frequency: vary(180, 0.3), endFrequency: 90, duration: 0.06, gain: 0.15, type: 'triangle', delay, pan });
  }
}

export function playShatter(x) {
  const pan = panFor(x);
  noise({ type: 'highpass', frequency: 2600, q: 0.7, duration: 0.18, gain: 0.55, pan });
  tone({ frequency: 220, endFrequency: 90, duration: 0.12, gain: 0.35, pan });
  for (let index = 0; index < 14; index += 1) {
    const delay = Math.random() * 0.35;
    noise({ frequency: 2500 + Math.random() * 6000, q: 6, duration: 0.02 + Math.random() * 0.05, gain: 0.12 + Math.random() * 0.1, delay, pan: pan + (Math.random() - 0.5) * 0.4 });
  }
  for (let index = 0; index < 7; index += 1) {
    chime({ frequency: 2200 + Math.random() * 3600, duration: 0.25 + Math.random() * 0.3, gain: 0.04 + Math.random() * 0.03, delay: Math.random() * 0.3, pan });
  }
}

export function playGlassShatter(x) {
  const pan = panFor(x);
  noise({ type: 'highpass', frequency: 4200, q: 0.6, duration: 0.25, gain: 0.5, pan });
  tone({ frequency: 1500, endFrequency: 900, duration: 0.05, gain: 0.12, pan });
  for (let index = 0; index < 18; index += 1) {
    const delay = Math.random() * 0.45;
    noise({ frequency: 4000 + Math.random() * 7000, q: 9, duration: 0.015 + Math.random() * 0.04, gain: 0.08 + Math.random() * 0.1, delay, pan: pan + (Math.random() - 0.5) * 0.5 });
  }
  for (let index = 0; index < 9; index += 1) {
    chime({ frequency: 3200 + Math.random() * 4200, duration: 0.3 + Math.random() * 0.4, gain: 0.03 + Math.random() * 0.03, delay: Math.random() * 0.4, pan });
  }
}
