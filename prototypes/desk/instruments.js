import { tone, noise, audioTime } from '../shared/audio.js';
import { DRUM_SAMPLES, PITCHED_SAMPLES, createDrumSampleVoice, createPitchedSampleVoice } from './sample-library.js';

// Delay from now until `time` on the clock of the context the sound is routed to (live or offline export).
const delayUntil = (time, destination) => Math.max(0, time - (destination?.context.currentTime ?? audioTime()));

// Drum voices receive { ratio, decay, gain, destination }: ratio scales every frequency (pitch),
// decay scales every duration, gain is the step velocity.
const SYNTH_DRUM_VOICES = {
  KICK(time, { ratio, decay, gain, destination }) {
    const delay = delayUntil(time, destination);
    tone({ frequency: 160 * ratio, endFrequency: 42 * ratio, duration: 0.42 * decay, gain: 0.9 * gain, attack: 0.002, delay, destination });
    noise({ frequency: 3000 * ratio, q: 0.7, duration: 0.012, gain: 0.2 * gain, delay, destination });
  },
  BOOM(time, { ratio, decay, gain, destination }) {
    const delay = delayUntil(time, destination);
    tone({ frequency: 120 * ratio, endFrequency: 38 * ratio, duration: 1.2 * decay, gain: 0.85 * gain, attack: 0.002, delay, destination });
    tone({ frequency: 240 * ratio, endFrequency: 76 * ratio, duration: 0.2 * decay, gain: 0.15 * gain, type: 'triangle', delay, destination });
  },
  SNARE(time, { ratio, decay, gain, destination }) {
    const delay = delayUntil(time, destination);
    noise({ frequency: 1900 * ratio, q: 0.7, duration: 0.2 * decay, gain: 0.45 * gain, delay, destination });
    tone({ frequency: 240 * ratio, endFrequency: 170 * ratio, duration: 0.09 * decay, gain: 0.3 * gain, type: 'triangle', delay, destination });
  },
  CLAP(time, { ratio, decay, gain, destination }) {
    const delay = delayUntil(time, destination);
    for (const offset of [0, 0.011, 0.022]) {
      noise({ frequency: 1300 * ratio, q: 2.2, duration: 0.02, gain: 0.4 * gain, delay: delay + offset, destination });
    }
    noise({ frequency: 1200 * ratio, q: 1.5, duration: 0.2 * decay, gain: 0.3 * gain, delay: delay + 0.03, destination });
  },
  HAT(time, { ratio, decay, gain, destination }) {
    noise({ type: 'highpass', frequency: 8000 * ratio, q: 0.7, duration: 0.045 * decay, gain: 0.3 * gain, delay: delayUntil(time, destination), destination });
  },
  'OPEN HAT'(time, { ratio, decay, gain, destination }) {
    noise({ type: 'highpass', frequency: 7000 * ratio, q: 0.7, duration: 0.32 * decay, gain: 0.2 * gain, delay: delayUntil(time, destination), destination });
  },
  TOM(time, { ratio, decay, gain, destination }) {
    tone({ frequency: 210 * ratio, endFrequency: 110 * ratio, duration: 0.3 * decay, gain: 0.6 * gain, attack: 0.002, delay: delayUntil(time, destination), destination });
  },
  RIM(time, { ratio, decay, gain, destination }) {
    const delay = delayUntil(time, destination);
    tone({ frequency: 1700 * ratio, endFrequency: 1600 * ratio, duration: 0.03 * decay, gain: 0.25 * gain, type: 'triangle', delay, destination });
    noise({ frequency: 4000 * ratio, q: 3, duration: 0.02 * decay, gain: 0.2 * gain, delay, destination });
  },
  COWBELL(time, { ratio, decay, gain, destination }) {
    const delay = delayUntil(time, destination);
    for (const frequency of [540, 800]) {
      tone({ frequency: frequency * ratio, duration: 0.25 * decay, gain: 0.08 * gain, type: 'square', filterFrequency: 2500, delay, destination });
    }
  },
  SHAKER(time, { ratio, decay, gain, destination }) {
    noise({ type: 'highpass', frequency: 6000 * ratio, q: 0.7, attack: 0.02, duration: 0.09 * decay, gain: 0.18 * gain, delay: delayUntil(time, destination), destination });
  },
  ZAP(time, { ratio, decay, gain, destination }) {
    tone({ frequency: 1800 * ratio, endFrequency: 80 * ratio, duration: 0.15 * decay, gain: 0.22 * gain, type: 'square', filterFrequency: 3000, delay: delayUntil(time, destination), destination });
  },
};

// Melodic voices receive { frequency, decay, gain, destination }.
const SYNTH_NOTE_VOICES = {
  PLUCK(time, { frequency, decay, gain, destination }) {
    const delay = delayUntil(time, destination);
    tone({ frequency, duration: 0.35 * decay, gain: 0.2 * gain, type: 'triangle', filterFrequency: 2400, filterEndFrequency: 600, delay, destination });
    tone({ frequency: frequency * 2, duration: 0.08 * decay, gain: 0.05 * gain, delay, destination });
  },
  BELL(time, { frequency, decay, gain, destination }) {
    const delay = delayUntil(time, destination);
    tone({ frequency, duration: 1.4 * decay, gain: 0.12 * gain, delay, destination });
    tone({ frequency: frequency * 2.76, duration: 0.56 * decay, gain: 0.036 * gain, delay, destination });
    tone({ frequency: frequency * 5.4, duration: 0.21 * decay, gain: 0.012 * gain, delay, destination });
  },
  BASS(time, { frequency, decay, gain, destination }) {
    const delay = delayUntil(time, destination);
    tone({ frequency, duration: 0.32 * decay, gain: 0.3 * gain, type: 'sawtooth', filterFrequency: 700, filterEndFrequency: 250, delay, destination });
    tone({ frequency, duration: 0.32 * decay, gain: 0.25 * gain, delay, destination });
  },
  ACID(time, { frequency, decay, gain, destination }) {
    tone({
      frequency,
      duration: 0.25 * decay,
      gain: 0.18 * gain,
      type: 'sawtooth',
      filterFrequency: 3200 * gain,
      filterEndFrequency: 260,
      filterQ: 14,
      delay: delayUntil(time, destination),
      destination,
    });
  },
  LEAD(time, { frequency, decay, gain, destination }) {
    const delay = delayUntil(time, destination);
    tone({ frequency, duration: 0.24 * decay, gain: 0.08 * gain, type: 'square', filterFrequency: 1800, attack: 0.01, delay, destination });
    tone({ frequency: frequency * 1.005, duration: 0.24 * decay, gain: 0.06 * gain, type: 'sawtooth', filterFrequency: 1800, attack: 0.01, delay, destination });
  },
  ORGAN(time, { frequency, decay, gain, destination }) {
    const delay = delayUntil(time, destination);
    [1, 2, 3].forEach((harmonic, index) => {
      tone({ frequency: frequency * harmonic, duration: 0.4 * decay, gain: (0.1 / (index + 1)) * gain, attack: 0.01, delay, destination });
    });
  },
  PAD(time, { frequency, decay, gain, destination }) {
    const delay = delayUntil(time, destination);
    for (const detune of [0.995, 1.005]) {
      tone({ frequency: frequency * detune, duration: 1.2 * decay, gain: 0.07 * gain, type: 'triangle', attack: 0.15, filterFrequency: 1500, delay, destination });
    }
  },
  SUB(time, { frequency, decay, gain, destination }) {
    tone({ frequency, duration: 0.4 * decay, gain: 0.35 * gain, attack: 0.005, delay: delayUntil(time, destination), destination });
  },
};

const prefixed = (voices) => Object.fromEntries(Object.entries(voices).map(([name, voice]) => [`SYNTH ${name}`, voice]));

// Sampled voices first, then the synthesized ones under a SYNTH prefix.
export const DRUM_VOICES = {
  ...Object.fromEntries(Object.entries(DRUM_SAMPLES).map(([name, { fallback }]) => [name, createDrumSampleVoice(name, SYNTH_DRUM_VOICES[fallback])])),
  ...prefixed(SYNTH_DRUM_VOICES),
};
export const NOTE_VOICES = {
  ...Object.fromEntries(Object.entries(PITCHED_SAMPLES).map(([name, { fallback }]) => [name, createPitchedSampleVoice(name, SYNTH_NOTE_VOICES[fallback])])),
  ...prefixed(SYNTH_NOTE_VOICES),
};
export const DRUM_VOICE_NAMES = Object.keys(DRUM_VOICES);
export const NOTE_VOICE_NAMES = Object.keys(NOTE_VOICES);
