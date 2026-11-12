// Every sound is synthesized with the Web Audio API so the demos ship no sample files.
let context = null;
let output = null;
let noiseBuffer = null;
const unlockCallbacks = [];

export function unlockAudio() {
  if (!context) {
    context = new AudioContext();
    const compressor = context.createDynamicsCompressor();
    compressor.connect(context.destination);
    output = context.createGain();
    output.gain.value = 0.8;
    output.connect(compressor);
    noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
    unlockCallbacks.splice(0).forEach((callback) => callback());
  }
  if (context.state === 'suspended') context.resume();
}

for (const type of ['pointerdown', 'keydown']) {
  window.addEventListener(type, unlockAudio, { capture: true, passive: true });
}

export const audioTime = () => context?.currentTime ?? 0;

export function onAudioUnlock(callback) {
  if (context) callback();
  else unlockCallbacks.push(callback);
}

function connectWithPan(node, pan, destination = output) {
  if (!pan) {
    node.connect(destination);
    return;
  }
  const panner = context.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, pan));
  node.connect(panner);
  panner.connect(destination);
}

function shapeEnvelope(gainNode, start, peak, attack, duration) {
  gainNode.gain.setValueAtTime(0.0001, start);
  gainNode.gain.linearRampToValueAtTime(peak, start + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
}

export function tone({
  frequency,
  endFrequency = frequency,
  duration = 0.2,
  gain = 0.2,
  type = 'sine',
  attack = 0.004,
  delay = 0,
  filterFrequency = null,
  filterEndFrequency = filterFrequency,
  filterQ = 1,
  pan = 0,
  destination,
}) {
  if (!context) return;
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 1), start + duration);
  const envelope = context.createGain();
  shapeEnvelope(envelope, start, gain, attack, duration);
  if (filterFrequency) {
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = filterQ;
    filter.frequency.setValueAtTime(filterFrequency, start);
    filter.frequency.exponentialRampToValueAtTime(Math.max(filterEndFrequency, 20), start + duration);
    oscillator.connect(filter);
    filter.connect(envelope);
  } else {
    oscillator.connect(envelope);
  }
  connectWithPan(envelope, pan, destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

export function noise({
  frequency = 2000,
  q = 1,
  duration = 0.05,
  gain = 0.2,
  type = 'bandpass',
  attack = 0.001,
  delay = 0,
  pan = 0,
  destination,
}) {
  if (!context) return;
  const start = context.currentTime + delay;
  const source = context.createBufferSource();
  source.buffer = noiseBuffer;
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const envelope = context.createGain();
  shapeEnvelope(envelope, start, gain, attack, duration);
  source.connect(filter);
  filter.connect(envelope);
  connectWithPan(envelope, pan, destination);
  source.start(start, Math.random() * 1.5);
  source.stop(start + duration + 0.05);
}

export function chime({ frequency, duration = 0.9, gain = 0.1, delay = 0, pan = 0, destination }) {
  tone({ frequency, duration, gain, delay, pan, destination });
  tone({ frequency: frequency * 2.76, duration: duration * 0.4, gain: gain * 0.3, delay, pan, destination });
  tone({ frequency: frequency * 5.4, duration: duration * 0.15, gain: gain * 0.1, delay, pan, destination });
}

function createDriveCurve(amount) {
  const steepness = 1 + amount * 30;
  const curve = new Float32Array(1024);
  const normalizer = Math.tanh(steepness);
  for (let index = 0; index < curve.length; index += 1) {
    const x = (index / (curve.length - 1)) * 2 - 1;
    curve[index] = Math.tanh(x * steepness) / normalizer;
  }
  return curve;
}

// A mixer channel: drive (waveshaper) -> tone (lowpass) -> volume -> pan -> master.
export function createChannel() {
  if (!context) return null;
  const input = context.createGain();
  const shaper = context.createWaveShaper();
  shaper.oversample = '4x';
  const toneFilter = context.createBiquadFilter();
  toneFilter.type = 'lowpass';
  const volume = context.createGain();
  const panner = context.createStereoPanner();
  input.connect(shaper);
  shaper.connect(toneFilter);
  toneFilter.connect(volume);
  volume.connect(panner);
  panner.connect(output);
  return {
    input,
    setDrive(amount) {
      shaper.curve = amount > 0 ? createDriveCurve(amount) : null;
      input.gain.setTargetAtTime(1 + amount * 2, context.currentTime, 0.01);
    },
    setTone(cutoff) {
      toneFilter.frequency.setTargetAtTime(cutoff, context.currentTime, 0.01);
    },
    setVolume(level) {
      volume.gain.setTargetAtTime(level, context.currentTime, 0.01);
    },
    setPan(position) {
      panner.pan.setTargetAtTime(position, context.currentTime, 0.01);
    },
  };
}

export function bubble({ frequency = 500, gain = 0.15, delay = 0, pan = 0 }) {
  tone({ frequency, endFrequency: frequency * 2.4, duration: 0.07, gain, delay, pan, attack: 0.002 });
}

export function arpeggio(frequencies, { spacing = 0.07, gain = 0.08, duration = 1.1 } = {}) {
  frequencies.forEach((frequency, index) => chime({ frequency, gain, duration, delay: index * spacing }));
}

export function startPad({ frequencies, gain = 0.025 }) {
  if (!context) return;
  const padGain = context.createGain();
  padGain.gain.setValueAtTime(0.0001, context.currentTime);
  padGain.gain.linearRampToValueAtTime(gain, context.currentTime + 4);
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  const modulator = context.createOscillator();
  modulator.frequency.value = 0.07;
  const modulatorDepth = context.createGain();
  modulatorDepth.gain.value = 400;
  modulator.connect(modulatorDepth);
  modulatorDepth.connect(filter.frequency);
  modulator.start();
  for (const frequency of frequencies) {
    for (const detune of [-6, 6]) {
      const oscillator = context.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = detune;
      oscillator.connect(filter);
      oscillator.start();
    }
  }
  filter.connect(padGain);
  padGain.connect(output);
}

export function startHum({ gain = 0.01 } = {}) {
  if (!context) return null;
  const start = context.currentTime;
  const humGain = context.createGain();
  humGain.gain.setValueAtTime(0.0001, start);
  humGain.gain.linearRampToValueAtTime(gain, start + 3);
  humGain.connect(output);
  const fan = context.createBufferSource();
  fan.buffer = noiseBuffer;
  fan.loop = true;
  const fanFilter = context.createBiquadFilter();
  fanFilter.type = 'lowpass';
  fanFilter.frequency.value = 320;
  fan.connect(fanFilter);
  fanFilter.connect(humGain);
  fan.start();
  const mains = context.createOscillator();
  mains.frequency.value = 60;
  const mainsGain = context.createGain();
  mainsGain.gain.value = 0.3;
  mains.connect(mainsGain);
  mainsGain.connect(humGain);
  mains.start();
  return {
    // Fades the hum to a fraction of its starting level; 0 silences it, 1 restores it.
    setLevel(level, seconds = 0.6) {
      humGain.gain.cancelScheduledValues(context.currentTime);
      humGain.gain.setTargetAtTime(Math.max(gain * level, 0.0001), context.currentTime, seconds / 3);
    },
  };
}

export const midiToFrequency =(note) => 440 * 2 ** ((note - 69) / 12);

// Major pentatonic on C, so any sequence of notes stays consonant.
export const PENTATONIC = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88].map(midiToFrequency);
