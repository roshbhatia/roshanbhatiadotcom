import { audioTime, createChannel, onAudioUnlock, midiToFrequency } from '../shared/audio.js';
import { DRUM_VOICES, NOTE_VOICES, DRUM_VOICE_NAMES, NOTE_VOICE_NAMES } from './instruments.js';

export const STEPS = 16;
export const PATTERN_COUNT = 8;
const LOOKAHEAD_SECONDS = 0.12;
const SCHEDULER_INTERVAL_MS = 25;
const STORAGE_KEY = 'desk-sequencer-v1';
const STATE_VERSION = 1;

export const TRACKS = [
  { name: 'KICK', voice: 'KICK' },
  { name: 'SNARE', voice: 'SNARE' },
  { name: 'CLAP', voice: 'CLAP' },
  { name: 'HAT', voice: 'HAT' },
  { name: 'OPEN HAT', voice: 'OPEN HAT' },
  { name: 'TOM', voice: 'TOM' },
  { name: 'PERC', voice: 'RIM' },
  { name: 'BASS', voice: 'BASS', melodic: true, baseNote: 36 },
  { name: 'LEAD', voice: 'PLUCK', melodic: true, baseNote: 60 },
  { name: 'KEYS', voice: 'BELL', melodic: true, baseNote: 72 },
];
const VELOCITY_GAIN = [0, 0.45, 0.8, 1];
export const SCALE_OFFSETS = [0, 2, 4, 7, 9, 12, 14, 16, 19];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const noteName = (midi) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
const cutoffFor = (tone) => 200 * 90 ** tone;

export const PARAMS = [
  { key: 'volume', label: 'VOL', min: 0, max: 1, step: 0.05, format: (value) => `${Math.round(value * 100)}` },
  { key: 'pan', label: 'PAN', min: -1, max: 1, step: 0.1, format: (value) => (value === 0 ? 'C' : `${value < 0 ? 'L' : 'R'}${Math.round(Math.abs(value) * 100)}`) },
  { key: 'pitch', label: 'PITCH', min: -24, max: 24, step: 1, format: (value) => `${value > 0 ? '+' : ''}${value} st` },
  { key: 'decay', label: 'DECAY', min: 0.2, max: 3, step: 0.1, format: (value) => `${value.toFixed(1)}x` },
  { key: 'drive', label: 'DRIVE', min: 0, max: 1, step: 0.05, format: (value) => `${Math.round(value * 100)}%` },
  { key: 'tone', label: 'TONE', min: 0, max: 1, step: 0.05, format: (value) => `${Math.round(cutoffFor(value))} Hz` },
  { key: 'length', label: 'LENGTH', min: 1, max: STEPS, step: 1, format: (value) => `${value} steps` },
  { key: 'voice', label: 'VOICE' },
];

function createEmptyPattern() {
  return { tracks: TRACKS.map(() => ({ length: STEPS, steps: new Array(STEPS).fill(null) })) };
}

function createStarterPattern() {
  const pattern = createEmptyPattern();
  const place = (track, entries) => {
    for (const [step, velocity, note] of entries) {
      pattern.tracks[track].steps[step] = { velocity, note: note ?? TRACKS[track].baseNote ?? 60 };
    }
  };
  place(0, [[0, 3], [4, 2], [8, 3], [10, 1], [12, 2]]);
  place(1, [[4, 3], [12, 3], [15, 1]]);
  place(2, [[12, 2]]);
  place(3, [[2, 2], [6, 2], [10, 2], [14, 2], [1, 1], [5, 1], [9, 1], [13, 1]]);
  place(4, [[15, 2]]);
  place(6, [[7, 1], [11, 2]]);
  place(7, [[0, 3, 36], [3, 2, 36], [6, 2, 43], [8, 3, 36], [11, 2, 39], [14, 2, 41]]);
  place(8, [[0, 2, 72], [3, 2, 76], [6, 2, 79], [10, 2, 76], [12, 3, 81], [14, 1, 74]]);
  place(9, [[0, 2, 64], [8, 2, 67]]);
  return pattern;
}

function createDefaultState() {
  return {
    version: STATE_VERSION,
    bpm: 112,
    swing: 0.1,
    chain: false,
    patternIndex: 0,
    tracks: TRACKS.map((track) => ({ voice: track.voice, volume: 0.8, pan: 0, pitch: 0, decay: 1, drive: 0, tone: 1, mute: false, solo: false })),
    patterns: [createStarterPattern(), ...Array.from({ length: PATTERN_COUNT - 1 }, createEmptyPattern)],
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const valid =
      saved?.version === STATE_VERSION &&
      saved.patterns?.length === PATTERN_COUNT &&
      saved.tracks?.length === TRACKS.length &&
      saved.patterns.every((pattern) => pattern.tracks?.length === TRACKS.length);
    return valid ? saved : null;
  } catch {
    return null;
  }
}

function createSequencerEngine() {
  const state = loadState() ?? createDefaultState();
  const channels = [];
  const flashUntil = new Array(TRACKS.length).fill(0);
  const scheduled = [];
  let playing = false;
  let recording = false;
  let tick = 0;
  let nextTickTime = 0;
  let queuedPattern = null;
  let lastPlayed = null;
  let saveTimer = null;

  const currentPattern = () => state.patterns[state.patternIndex];
  const laneFor = (track) => currentPattern().tracks[track];
  const stepDuration = () => 60 / state.bpm / 4;
  const voiceNames = (track) => (TRACKS[track].melodic ? NOTE_VOICE_NAMES : DRUM_VOICE_NAMES);
  const patternHasSteps = (pattern) => pattern.tracks.some((lane) => lane.steps.some(Boolean));

  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Storage can be unavailable (private mode); the session keeps working without it.
      }
    }, 250);
  }

  function applyChannel(track) {
    const channel = channels[track];
    if (!channel) return;
    const settings = state.tracks[track];
    channel.setVolume(settings.volume);
    channel.setPan(settings.pan);
    channel.setDrive(settings.drive);
    channel.setTone(cutoffFor(settings.tone));
  }

  function ensureChannel(track) {
    if (!channels[track]) {
      const channel = createChannel();
      if (!channel) return null;
      channels[track] = channel;
      applyChannel(track);
    }
    return channels[track];
  }
  onAudioUnlock(() => TRACKS.forEach((_, track) => ensureChannel(track)));

  function triggerTrack(track, time, velocity = 2, note) {
    const channel = ensureChannel(track);
    if (!channel) return;
    const settings = state.tracks[track];
    const gain = VELOCITY_GAIN[velocity];
    if (TRACKS[track].melodic) {
      const frequency = midiToFrequency((note ?? TRACKS[track].baseNote) + settings.pitch);
      NOTE_VOICES[settings.voice](time, { frequency, decay: settings.decay, gain, destination: channel.input });
    } else {
      DRUM_VOICES[settings.voice](time, { ratio: 2 ** (settings.pitch / 12), decay: settings.decay, gain, destination: channel.input });
    }
    flashUntil[track] = time + 0.12;
  }

  function advancePatternAtBarLine() {
    if (queuedPattern !== null) {
      state.patternIndex = queuedPattern;
      queuedPattern = null;
      return;
    }
    if (!state.chain) return;
    for (let offset = 1; offset < PATTERN_COUNT; offset += 1) {
      const candidate = (state.patternIndex + offset) % PATTERN_COUNT;
      if (patternHasSteps(state.patterns[candidate])) {
        state.patternIndex = candidate;
        return;
      }
    }
  }

  function schedule() {
    if (!playing) return;
    while (nextTickTime < audioTime() + LOOKAHEAD_SECONDS) {
      if (tick > 0 && tick % STEPS === 0) advancePatternAtBarLine();
      const time = nextTickTime + (tick % 2 === 1 ? state.swing * stepDuration() : 0);
      const anySolo = state.tracks.some((track) => track.solo);
      currentPattern().tracks.forEach((lane, track) => {
        const step = lane.steps[tick % lane.length];
        const settings = state.tracks[track];
        if (!step || settings.mute || (anySolo && !settings.solo)) return;
        triggerTrack(track, time, step.velocity, step.note);
      });
      scheduled.push({ tick, time, patternIndex: state.patternIndex });
      nextTickTime += stepDuration();
      tick += 1;
    }
  }
  setInterval(schedule, SCHEDULER_INTERVAL_MS);

  function writeStep(track, stepIndex, step) {
    laneFor(track).steps[stepIndex] = step;
    persist();
  }

  function lastNoteOn(track) {
    const found = laneFor(track).steps.findLast?.((step) => step) ?? null;
    return found?.note ?? TRACKS[track].baseNote ?? 60;
  }

  function paramRange(track, param) {
    return param.key === 'voice' ? { min: 0, max: voiceNames(track).length - 1, step: 1 } : param;
  }

  function getParam(track, param) {
    if (param.key === 'length') return laneFor(track).length;
    if (param.key === 'voice') return voiceNames(track).indexOf(state.tracks[track].voice);
    return state.tracks[track][param.key];
  }

  function recordTarget() {
    if (!lastPlayed) return null;
    const elapsedSteps = (audioTime() - lastPlayed.time) / stepDuration();
    return elapsedSteps > 0.5 ? lastPlayed.tick + 1 : lastPlayed.tick;
  }

  const engine = {
    state,
    laneFor,
    lastNoteOn,
    paramRange,
    getParam,
    patternHasSteps,
    get playing() {
      return playing;
    },
    get recording() {
      return recording;
    },
    get queuedPattern() {
      return queuedPattern;
    },
    // Advances the visible playhead to the step that is sounding now.
    playheadStep(track) {
      const now = audioTime();
      while (scheduled.length && scheduled[0].time <= now) lastPlayed = scheduled.shift();
      if (!playing || !lastPlayed || lastPlayed.patternIndex !== state.patternIndex) return -1;
      return lastPlayed.tick % laneFor(track).length;
    },
    isFlashing(track) {
      const now = audioTime();
      return now >= flashUntil[track] - 0.12 && now <= flashUntil[track];
    },
    togglePlayback() {
      playing = !playing;
      scheduled.length = 0;
      lastPlayed = null;
      queuedPattern = null;
      if (playing) {
        tick = 0;
        nextTickTime = audioTime() + 0.05;
        schedule();
      }
    },
    stop() {
      if (playing) engine.togglePlayback();
      recording = false;
    },
    toggleRecording() {
      recording = !recording;
    },
    toggleChain() {
      state.chain = !state.chain;
      persist();
    },
    changeTempo(amount) {
      state.bpm = Math.min(220, Math.max(50, state.bpm + amount));
      persist();
    },
    changeSwing(amount) {
      state.swing = Math.min(0.5, Math.max(0, Number((state.swing + amount).toFixed(2))));
      persist();
    },
    selectPattern(index) {
      if (playing && index !== state.patternIndex) queuedPattern = index;
      else state.patternIndex = index;
      persist();
    },
    copyPatternTo(index) {
      state.patterns[index] = structuredClone(currentPattern());
      persist();
    },
    clearPattern() {
      state.patterns[state.patternIndex] = createEmptyPattern();
      persist();
    },
    clearTrack(track) {
      laneFor(track).steps.fill(null);
      persist();
    },
    setParam(track, param, rawValue) {
      const { min, max, step } = paramRange(track, param);
      const value = Number((Math.round((Math.min(max, Math.max(min, rawValue)) - min) / step) * step + min).toFixed(3));
      if (value === getParam(track, param)) return;
      if (param.key === 'length') laneFor(track).length = value;
      else if (param.key === 'voice') {
        state.tracks[track].voice = voiceNames(track)[value];
        triggerTrack(track, audioTime());
      } else {
        state.tracks[track][param.key] = value;
        applyChannel(track);
      }
      persist();
    },
    voiceName(track) {
      return state.tracks[track].voice;
    },
    deleteStep(track, stepIndex) {
      writeStep(track, stepIndex, null);
    },
    toggleStep(track, stepIndex) {
      const lane = laneFor(track);
      if (stepIndex >= lane.length) return;
      if (lane.steps[stepIndex]) writeStep(track, stepIndex, null);
      else {
        const step = { velocity: 2, note: lastNoteOn(track) };
        writeStep(track, stepIndex, step);
        triggerTrack(track, audioTime(), step.velocity, step.note);
      }
    },
    cycleVelocity(track, stepIndex, direction = 1) {
      const lane = laneFor(track);
      if (stepIndex >= lane.length) return;
      const step = lane.steps[stepIndex];
      if (!step) writeStep(track, stepIndex, { velocity: 3, note: lastNoteOn(track) });
      else writeStep(track, stepIndex, { ...step, velocity: ((step.velocity - 1 + direction + 3) % 3) + 1 });
      const updated = lane.steps[stepIndex];
      triggerTrack(track, audioTime(), updated.velocity, updated.note);
    },
    nudgeNote(track, stepIndex, semitones) {
      const step = laneFor(track).steps[stepIndex];
      if (!step) return;
      if (!TRACKS[track].melodic) {
        engine.cycleVelocity(track, stepIndex, Math.sign(semitones));
        return;
      }
      writeStep(track, stepIndex, { ...step, note: Math.min(96, Math.max(24, step.note + semitones)) });
      triggerTrack(track, audioTime(), step.velocity, laneFor(track).steps[stepIndex].note);
    },
    rotateTrack(track, direction) {
      const lane = laneFor(track);
      const active = lane.steps.slice(0, lane.length);
      const rotated = direction > 0 ? [active.at(-1), ...active.slice(0, -1)] : [...active.slice(1), active[0]];
      lane.steps.splice(0, lane.length, ...rotated);
      persist();
    },
    randomizeTrack(track) {
      const lane = laneFor(track);
      const density = TRACKS[track].melodic ? 0.35 : [0.3, 0.2, 0.12, 0.55, 0.1, 0.15, 0.25][track];
      lane.steps = lane.steps.map((_, index) => {
        if (track === 0 && index === 0) return { velocity: 3, note: 60 };
        if (Math.random() >= density) return null;
        const degree = SCALE_OFFSETS[Math.floor(Math.random() * 6)];
        return { velocity: 1 + Math.floor(Math.random() * 3), note: (TRACKS[track].baseNote ?? 60) + degree };
      });
      persist();
    },
    // Plays a track now; while recording during playback, also writes it to the nearest step.
    playLive(track, note) {
      triggerTrack(track, audioTime(), 2, note);
      if (!playing || !recording) return;
      const target = recordTarget();
      if (target === null) return;
      const lane = laneFor(track);
      writeStep(track, target % lane.length, { velocity: 2, note: note ?? TRACKS[track].baseNote ?? 60 });
    },
    // Step entry while stopped: writes the note at a step and returns the next step.
    enterNote(track, stepIndex, degree) {
      const note = TRACKS[track].melodic ? TRACKS[track].baseNote + SCALE_OFFSETS[degree] : undefined;
      if (playing) {
        engine.playLive(track, note);
        return stepIndex;
      }
      const lane = laneFor(track);
      const target = stepIndex >= lane.length ? 0 : stepIndex;
      writeStep(track, target, { velocity: 2, note: note ?? 60 });
      triggerTrack(track, audioTime(), 2, note);
      return (target + 1) % lane.length;
    },
    toggleTrackFlag(track, flag) {
      state.tracks[track][flag] = !state.tracks[track][flag];
      persist();
    },
    audition(track) {
      triggerTrack(track, audioTime(), 2, TRACKS[track].melodic ? lastNoteOn(track) : undefined);
    },
  };
  return engine;
}

let sharedEngine = null;

// One sequencer per page: the scene's power switch and the terminal program control the same playback.
export function getSequencerEngine() {
  sharedEngine ??= createSequencerEngine();
  return sharedEngine;
}
