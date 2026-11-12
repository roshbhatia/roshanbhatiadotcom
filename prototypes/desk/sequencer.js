import { audioTime, createChannel, onAudioUnlock, midiToFrequency } from '../shared/audio.js';
import { DRUM_VOICES, NOTE_VOICES, DRUM_VOICE_NAMES, NOTE_VOICE_NAMES } from './instruments.js';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './computer-model.js';
import { PHOSPHOR, prepareText } from './phosphor.js';

const STEPS = 16;
const PATTERN_COUNT = 8;
const LOOKAHEAD_SECONDS = 0.12;
const SCHEDULER_INTERVAL_MS = 25;
const STORAGE_KEY = 'desk-sequencer-v1';
const STATE_VERSION = 1;

const TRACKS = [
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
const SCALE_OFFSETS = [0, 2, 4, 7, 9, 12, 14, 16, 19];
const PAD_CODES = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'];
const NOTE_CODES = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL'];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = (midi) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
const cutoffFor = (tone) => 200 * 90 ** tone;

const PARAMS = [
  { key: 'volume', label: 'VOL', min: 0, max: 1, step: 0.05, format: (value) => `${Math.round(value * 100)}` },
  { key: 'pan', label: 'PAN', min: -1, max: 1, step: 0.1, format: (value) => (value === 0 ? 'C' : `${value < 0 ? 'L' : 'R'}${Math.round(Math.abs(value) * 100)}`) },
  { key: 'pitch', label: 'PITCH', min: -24, max: 24, step: 1, format: (value) => `${value > 0 ? '+' : ''}${value} st` },
  { key: 'decay', label: 'DECAY', min: 0.2, max: 3, step: 0.1, format: (value) => `${value.toFixed(1)}x` },
  { key: 'drive', label: 'DRIVE', min: 0, max: 1, step: 0.05, format: (value) => `${Math.round(value * 100)}%` },
  { key: 'tone', label: 'TONE', min: 0, max: 1, step: 0.05, format: (value) => `${Math.round(cutoffFor(value))} Hz` },
  { key: 'length', label: 'LENGTH', min: 1, max: STEPS, step: 1, format: (value) => `${value} steps` },
  { key: 'voice', label: 'VOICE' },
];

const LAYOUT = {
  laneTop: 80,
  laneHeight: 34,
  gridLeft: 200,
  cellWidth: 48,
  paramTop: 440,
  footerTop: 680,
};
const laneY = (track) => LAYOUT.laneTop + track * LAYOUT.laneHeight;
const stepX = (step) => LAYOUT.gridLeft + step * LAYOUT.cellWidth;

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

export function createSequencer({ exit }) {
  const state = loadState() ?? createDefaultState();
  const channels = [];
  const flashUntil = new Array(TRACKS.length).fill(0);
  const cursor = { track: 0, step: 0 };
  const scheduled = [];
  let selectedParam = 0;
  let playing = false;
  let recording = false;
  let tick = 0;
  let nextTickTime = 0;
  let queuedPattern = null;
  let lastPlayed = null;
  let regions = [];
  let drag = null;
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

  function togglePlayback() {
    playing = !playing;
    scheduled.length = 0;
    lastPlayed = null;
    queuedPattern = null;
    if (playing) {
      tick = 0;
      nextTickTime = audioTime() + 0.05;
      schedule();
    }
  }

  function selectPattern(index) {
    if (playing && index !== state.patternIndex) queuedPattern = index;
    else state.patternIndex = index;
    persist();
  }

  function copyPatternTo(index) {
    state.patterns[index] = structuredClone(currentPattern());
    persist();
  }

  function paramRange(track, param) {
    return param.key === 'voice' ? { min: 0, max: voiceNames(track).length - 1, step: 1 } : param;
  }

  function getParam(track, param) {
    if (param.key === 'length') return laneFor(track).length;
    if (param.key === 'voice') return voiceNames(track).indexOf(state.tracks[track].voice);
    return state.tracks[track][param.key];
  }

  function setParam(track, param, rawValue) {
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
  }

  function nudgeParam(param, direction, coarse) {
    const { step } = paramRange(cursor.track, param);
    setParam(cursor.track, param, getParam(cursor.track, param) + direction * step * (coarse ? 4 : 1));
  }

  function writeStep(track, stepIndex, step) {
    laneFor(track).steps[stepIndex] = step;
    persist();
  }

  function lastNoteOn(track) {
    const found = laneFor(track).steps.findLast?.((step) => step) ?? null;
    return found?.note ?? TRACKS[track].baseNote ?? 60;
  }

  function toggleStep(track, stepIndex) {
    const lane = laneFor(track);
    if (stepIndex >= lane.length) return;
    if (lane.steps[stepIndex]) writeStep(track, stepIndex, null);
    else {
      const step = { velocity: 2, note: lastNoteOn(track) };
      writeStep(track, stepIndex, step);
      triggerTrack(track, audioTime(), step.velocity, step.note);
    }
  }

  function cycleVelocity(track, stepIndex, direction = 1) {
    const lane = laneFor(track);
    if (stepIndex >= lane.length) return;
    const step = lane.steps[stepIndex];
    if (!step) writeStep(track, stepIndex, { velocity: 3, note: lastNoteOn(track) });
    else writeStep(track, stepIndex, { ...step, velocity: ((step.velocity - 1 + direction + 3) % 3) + 1 });
    const updated = lane.steps[stepIndex];
    triggerTrack(track, audioTime(), updated.velocity, updated.note);
  }

  function nudgeNote(track, stepIndex, semitones) {
    const step = laneFor(track).steps[stepIndex];
    if (!step) return;
    if (!TRACKS[track].melodic) {
      cycleVelocity(track, stepIndex, Math.sign(semitones));
      return;
    }
    writeStep(track, stepIndex, { ...step, note: Math.min(96, Math.max(24, step.note + semitones)) });
    triggerTrack(track, audioTime(), step.velocity, laneFor(track).steps[stepIndex].note);
  }

  function rotateTrack(track, direction) {
    const lane = laneFor(track);
    const active = lane.steps.slice(0, lane.length);
    const rotated = direction > 0 ? [active.at(-1), ...active.slice(0, -1)] : [...active.slice(1), active[0]];
    lane.steps.splice(0, lane.length, ...rotated);
    persist();
  }

  function randomizeTrack(track) {
    const lane = laneFor(track);
    const density = TRACKS[track].melodic ? 0.35 : [0.3, 0.2, 0.12, 0.55, 0.1, 0.15, 0.25][track];
    lane.steps = lane.steps.map((_, index) => {
      if (track === 0 && index === 0) return { velocity: 3, note: 60 };
      if (Math.random() >= density) return null;
      const degree = SCALE_OFFSETS[Math.floor(Math.random() * 6)];
      return { velocity: 1 + Math.floor(Math.random() * 3), note: (TRACKS[track].baseNote ?? 60) + degree };
    });
    persist();
  }

  function recordTarget() {
    if (!lastPlayed) return null;
    const elapsedSteps = (audioTime() - lastPlayed.time) / stepDuration();
    return elapsedSteps > 0.5 ? lastPlayed.tick + 1 : lastPlayed.tick;
  }

  function playLive(track, note) {
    triggerTrack(track, audioTime(), 2, note);
    if (!playing || !recording) return;
    const target = recordTarget();
    if (target === null) return;
    const lane = laneFor(track);
    writeStep(track, target % lane.length, { velocity: 2, note: note ?? TRACKS[track].baseNote ?? 60 });
  }

  function enterNote(degree) {
    const track = cursor.track;
    const note = TRACKS[track].melodic ? TRACKS[track].baseNote + SCALE_OFFSETS[degree] : undefined;
    if (playing) {
      playLive(track, note);
      return;
    }
    const lane = laneFor(track);
    if (cursor.step >= lane.length) cursor.step = 0;
    writeStep(track, cursor.step, { velocity: 2, note: note ?? 60 });
    triggerTrack(track, audioTime(), 2, note);
    cursor.step = (cursor.step + 1) % lane.length;
  }

  function toggleTrackFlag(track, flag) {
    state.tracks[track][flag] = !state.tracks[track][flag];
    persist();
  }

  function close() {
    if (playing) togglePlayback();
    exit();
  }

  function handleKey({ key, code, shift }) {
    const padIndex = PAD_CODES.indexOf(code);
    const noteIndex = NOTE_CODES.indexOf(code);
    const digit = /^Digit([1-8])$/.exec(code ?? '');
    if (code === 'Escape' || key === 'Escape') close();
    else if (code === 'Space' || key === ' ') togglePlayback();
    else if (code === 'Enter' || code === 'NumpadEnter' || key === 'Enter') {
      if (shift) cycleVelocity(cursor.track, cursor.step);
      else toggleStep(cursor.track, cursor.step);
    } else if (code === 'ArrowUp') cursor.track = (cursor.track + TRACKS.length - 1) % TRACKS.length;
    else if (code === 'ArrowDown') cursor.track = (cursor.track + 1) % TRACKS.length;
    else if (code === 'ArrowLeft') shift ? rotateTrack(cursor.track, -1) : (cursor.step = (cursor.step + STEPS - 1) % STEPS);
    else if (code === 'ArrowRight') shift ? rotateTrack(cursor.track, 1) : (cursor.step = (cursor.step + 1) % STEPS);
    else if (code === 'Tab') selectedParam = (selectedParam + (shift ? PARAMS.length - 1 : 1)) % PARAMS.length;
    else if (code === 'BracketLeft') nudgeParam(PARAMS[selectedParam], -1, shift);
    else if (code === 'BracketRight') nudgeParam(PARAMS[selectedParam], 1, shift);
    else if (code === 'Comma') nudgeNote(cursor.track, cursor.step, shift ? -12 : -1);
    else if (code === 'Period') nudgeNote(cursor.track, cursor.step, shift ? 12 : 1);
    else if (code === 'Minus') state.bpm = Math.max(50, state.bpm - (shift ? 10 : 2));
    else if (code === 'Equal') state.bpm = Math.min(220, state.bpm + (shift ? 10 : 2));
    else if (code === 'Semicolon') state.swing = Math.max(0, Number((state.swing - 0.05).toFixed(2)));
    else if (code === 'Quote') state.swing = Math.min(0.5, Number((state.swing + 0.05).toFixed(2)));
    else if (code === 'Backspace' || code === 'Delete') writeStep(cursor.track, cursor.step, null);
    else if (digit) shift ? copyPatternTo(Number(digit[1]) - 1) : selectPattern(Number(digit[1]) - 1);
    else if (padIndex !== -1) playLive(padIndex, TRACKS[padIndex].melodic ? lastNoteOn(padIndex) : undefined);
    else if (noteIndex !== -1) enterNote(noteIndex);
    else if (code === 'KeyZ') toggleTrackFlag(cursor.track, 'mute');
    else if (code === 'KeyX') toggleTrackFlag(cursor.track, 'solo');
    else if (code === 'KeyC') {
      if (shift) state.patterns[state.patternIndex] = createEmptyPattern();
      else laneFor(cursor.track).steps.fill(null);
      persist();
    } else if (code === 'KeyV') randomizeTrack(cursor.track);
    else if (code === 'KeyB') state.chain = !state.chain;
    else if (code === 'KeyN') recording = !recording;
    else return;
    persist();
  }

  function addRegion(x, y, width, height, handlers) {
    regions.push({ x, y, width, height, ...handlers });
  }

  function regionAt(x, y) {
    for (let index = regions.length - 1; index >= 0; index -= 1) {
      const region = regions[index];
      if (x >= region.x && x <= region.x + region.width && y >= region.y && y <= region.y + region.height) return region;
    }
    return null;
  }

  function cellAt(x, y) {
    const step = Math.floor((x - LAYOUT.gridLeft) / LAYOUT.cellWidth);
    const track = Math.floor((y - LAYOUT.laneTop) / LAYOUT.laneHeight);
    if (step < 0 || step >= STEPS || track < 0 || track >= TRACKS.length) return null;
    return { track, step };
  }

  function handlePointer(type, x, y, { shift = false } = {}) {
    if (type === 'up') {
      drag = null;
      return;
    }
    if (type === 'down') {
      const region = regionAt(x, y);
      region?.down?.(x, y, shift);
      drag = region?.drag ? region : null;
      return;
    }
    drag?.drag(x, y);
  }

  function handleWheel(x, y, deltaY) {
    regionAt(x, y)?.wheel?.(x, y, deltaY > 0 ? -1 : 1);
  }

  function drawButton(context, x, y, width, label, onPress, { active = false, blink = false, seconds = 0 } = {}) {
    const height = 40;
    const lit = active || (blink && Math.floor(seconds * 4) % 2 === 0);
    context.shadowBlur = 0;
    context.fillStyle = lit ? PHOSPHOR.foreground : PHOSPHOR.faint;
    context.fillRect(x, y, width, height);
    context.strokeStyle = PHOSPHOR.dim;
    context.lineWidth = 2;
    context.strokeRect(x, y, width, height);
    prepareText(context, 26, lit ? PHOSPHOR.background : PHOSPHOR.foreground);
    context.shadowBlur = lit ? 0 : 6;
    context.textAlign = 'center';
    context.fillText(label, x + width / 2, y + 29);
    addRegion(x, y, width, height, { down: onPress });
  }

  function drawTopBar(context, seconds) {
    const y = 18;
    drawButton(context, 20, y, 84, playing ? 'STOP' : 'PLAY', togglePlayback, { active: playing });
    drawButton(context, 110, y, 64, 'REC', () => (recording = !recording), { active: recording, blink: recording && playing, seconds });
    prepareText(context, 26);
    context.fillText(`BPM ${state.bpm}`, 182, y + 29);
    drawButton(context, 276, y, 30, '-', () => (state.bpm = Math.max(50, state.bpm - 2)));
    drawButton(context, 310, y, 30, '+', () => (state.bpm = Math.min(220, state.bpm + 2)));
    prepareText(context, 26);
    context.fillText(`SW ${Math.round(state.swing * 100)}`, 350, y + 29);
    drawButton(context, 420, y, 30, '-', () => (state.swing = Math.max(0, Number((state.swing - 0.05).toFixed(2)))));
    drawButton(context, 454, y, 30, '+', () => (state.swing = Math.min(0.5, Number((state.swing + 0.05).toFixed(2)))));
    state.patterns.forEach((pattern, index) => {
      const label = patternHasSteps(pattern) ? `${index + 1}` : `${index + 1}`;
      drawButton(context, 496 + index * 38, y, 34, label, () => selectPattern(index), {
        active: index === state.patternIndex,
        blink: index === queuedPattern,
        seconds,
      });
      if (patternHasSteps(pattern) && index !== state.patternIndex) {
        context.fillStyle = PHOSPHOR.foreground;
        context.fillRect(496 + index * 38 + 13, y + 34, 8, 3);
      }
    });
    drawButton(context, 804, y, 86, 'CHAIN', () => (state.chain = !state.chain), { active: state.chain });
    drawButton(context, 896, y, 108, 'EXIT', close);
  }

  function drawLanes(context, now) {
    const gridHeight = TRACKS.length * LAYOUT.laneHeight;
    context.shadowBlur = 0;
    for (let group = 0; group < STEPS; group += 8) {
      context.fillStyle = PHOSPHOR.faint;
      context.fillRect(stepX(group), LAYOUT.laneTop - 2, LAYOUT.cellWidth * 4, gridHeight + 4);
    }
    const anySolo = state.tracks.some((track) => track.solo);

    TRACKS.forEach((definition, track) => {
      const y = laneY(track);
      const lane = laneFor(track);
      const settings = state.tracks[track];
      const audible = !settings.mute && (!anySolo || settings.solo);
      const flashing = now >= flashUntil[track] - 0.12 && now <= flashUntil[track];
      if (track === cursor.track) {
        context.shadowBlur = 0;
        context.fillStyle = 'rgba(141, 255, 183, 0.1)';
        context.fillRect(14, y + 1, 180, LAYOUT.laneHeight - 2);
      }
      prepareText(context, 24, flashing ? '#e8fff0' : audible ? PHOSPHOR.foreground : PHOSPHOR.dim);
      context.fillText(definition.name, 22, y + 25);
      addRegion(14, y, 118, LAYOUT.laneHeight, {
        down: () => {
          cursor.track = track;
          triggerTrack(track, audioTime(), 2, definition.melodic ? lastNoteOn(track) : undefined);
        },
      });
      for (const [offset, flag, letter] of [[134, 'mute', 'M'], [164, 'solo', 'S']]) {
        const on = settings[flag];
        context.shadowBlur = 0;
        context.fillStyle = on ? PHOSPHOR.foreground : 'transparent';
        context.fillRect(offset, y + 5, 26, LAYOUT.laneHeight - 10);
        context.strokeStyle = PHOSPHOR.dim;
        context.lineWidth = 1.5;
        context.strokeRect(offset, y + 5, 26, LAYOUT.laneHeight - 10);
        prepareText(context, 20, on ? PHOSPHOR.background : PHOSPHOR.dim);
        context.shadowBlur = 0;
        context.textAlign = 'center';
        context.fillText(letter, offset + 13, y + 23);
        addRegion(offset, y + 5, 26, LAYOUT.laneHeight - 10, { down: () => toggleTrackFlag(track, flag) });
      }

      const playheadStep = playing && lastPlayed && lastPlayed.patternIndex === state.patternIndex ? lastPlayed.tick % lane.length : -1;
      for (let stepIndex = 0; stepIndex < STEPS; stepIndex += 1) {
        const x = stepX(stepIndex) + 4;
        const cellY = y + 4;
        const width = LAYOUT.cellWidth - 8;
        const height = LAYOUT.laneHeight - 8;
        context.shadowBlur = 0;
        if (stepIndex >= lane.length) {
          context.fillStyle = PHOSPHOR.dim;
          context.fillRect(x + width / 2 - 2, cellY + height / 2 - 2, 4, 4);
          continue;
        }
        const step = lane.steps[stepIndex];
        const atPlayhead = stepIndex === playheadStep;
        if (step) {
          context.fillStyle = step.velocity === 3 ? '#e8fff0' : step.velocity === 2 ? PHOSPHOR.foreground : PHOSPHOR.dim;
          if (atPlayhead) {
            context.shadowColor = PHOSPHOR.foreground;
            context.shadowBlur = 16;
          }
          context.fillRect(x, cellY, width, height);
          context.shadowBlur = 0;
          if (definition.melodic) {
            context.font = PHOSPHOR.font(18);
            context.fillStyle = PHOSPHOR.background;
            context.textAlign = 'center';
            context.fillText(noteName(step.note), x + width / 2, cellY + height - 7);
          }
        } else {
          context.strokeStyle = atPlayhead ? PHOSPHOR.foreground : PHOSPHOR.dim;
          context.lineWidth = atPlayhead ? 2.5 : 1.2;
          context.strokeRect(x, cellY, width, height);
        }
      }
    });

    context.shadowBlur = 0;
    context.strokeStyle = '#e8fff0';
    context.lineWidth = 3;
    context.strokeRect(stepX(cursor.step) + 1, laneY(cursor.track) + 1, LAYOUT.cellWidth - 2, LAYOUT.laneHeight - 2);

    let paintValue = null;
    addRegion(LAYOUT.gridLeft, LAYOUT.laneTop, STEPS * LAYOUT.cellWidth, gridHeight, {
      down: (x, y, shift) => {
        const cell = cellAt(x, y);
        if (!cell) return;
        cursor.track = cell.track;
        cursor.step = cell.step;
        if (shift) {
          paintValue = null;
          cycleVelocity(cell.track, cell.step);
          return;
        }
        paintValue = !laneFor(cell.track).steps[cell.step];
        toggleStep(cell.track, cell.step);
      },
      drag: (x, y) => {
        const cell = cellAt(x, y);
        if (!cell || paintValue === null || cell.step >= laneFor(cell.track).length) return;
        const hasStep = Boolean(laneFor(cell.track).steps[cell.step]);
        if (hasStep !== paintValue) toggleStep(cell.track, cell.step);
      },
      wheel: (x, y, direction) => {
        const cell = cellAt(x, y);
        if (cell) nudgeNote(cell.track, cell.step, direction);
      },
    });
  }

  function drawParams(context) {
    const track = cursor.track;
    const top = LAYOUT.paramTop;
    context.shadowBlur = 0;
    context.strokeStyle = PHOSPHOR.dim;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(20, top - 8);
    context.lineTo(1004, top - 8);
    context.stroke();
    prepareText(context, 26);
    const settings = state.tracks[track];
    const flags = [settings.mute && 'MUTED', settings.solo && 'SOLO', recording && 'REC ARMED', state.chain && 'CHAIN'].filter(Boolean).join('  ');
    context.fillText(`TRACK ${String(track + 1).padStart(2, '0')} ${TRACKS[track].name}   PATTERN ${state.patternIndex + 1}   ${flags}`, 22, top + 22);

    PARAMS.forEach((param, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = 22 + column * 500;
      const y = top + 40 + row * 46;
      const barX = x + 100;
      const barWidth = 260;
      const range = paramRange(track, param);
      const value = getParam(track, param);
      const fraction = (value - range.min) / (range.max - range.min || 1);
      const selected = index === selectedParam;
      prepareText(context, 24, selected ? '#e8fff0' : PHOSPHOR.dim);
      context.fillText(`${selected ? '>' : ' '}${param.label}`, x, y + 26);
      context.shadowBlur = 0;
      context.strokeStyle = selected ? PHOSPHOR.foreground : PHOSPHOR.dim;
      context.lineWidth = 1.5;
      context.strokeRect(barX, y + 8, barWidth, 24);
      context.fillStyle = selected ? PHOSPHOR.foreground : PHOSPHOR.dim;
      if (param.key === 'pan') {
        const center = barX + barWidth / 2;
        const end = barX + fraction * barWidth;
        context.fillRect(Math.min(center, end), y + 11, Math.max(2, Math.abs(end - center)), 18);
      } else {
        context.fillRect(barX + 3, y + 11, Math.max(0, fraction * (barWidth - 6)), 18);
      }
      prepareText(context, 24, PHOSPHOR.foreground);
      const label = param.key === 'voice' ? state.tracks[track].voice : param.format(value);
      context.fillText(label, barX + barWidth + 14, y + 26);
      const setFromX = (pointerX) => {
        selectedParam = index;
        setParam(track, param, range.min + ((pointerX - barX) / barWidth) * (range.max - range.min));
      };
      addRegion(x, y + 4, barWidth + 100, 32, {
        down: setFromX,
        drag: setFromX,
        wheel: (_, __, direction) => {
          selectedParam = index;
          setParam(track, param, value + direction * range.step);
        },
      });
    });
  }

  function drawFooter(context) {
    prepareText(context, 21, PHOSPHOR.dim);
    context.shadowBlur = 0;
    const lines = [
      'SPACE play  N rec  ARROWS move  ENTER step  SHIFT+ENTER velocity  , . note (SHIFT octave)  BKSP delete',
      'Q-P play tracks  A-L notes (step entry when stopped)  TAB param  [ ] adjust  1-8 pattern  SHIFT+1-8 copy',
      'Z mute  X solo  C clear (SHIFT pattern)  V random  B chain  SHIFT+ARROWS rotate  - = tempo  ; \' swing  ESC exit',
    ];
    lines.forEach((line, index) => context.fillText(line, 22, LAYOUT.footerTop + 18 + index * 26));
  }

  return {
    open() {
      cursor.track = 0;
      cursor.step = 0;
    },
    // Called by the scene when the computer loses power.
    stop() {
      if (playing) togglePlayback();
      recording = false;
    },
    handleKey,
    handlePointer,
    handleWheel,
    draw(context, seconds) {
      const now = audioTime();
      while (scheduled.length && scheduled[0].time <= now) lastPlayed = scheduled.shift();
      regions = [];
      context.fillStyle = PHOSPHOR.background;
      context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      drawTopBar(context, seconds);
      drawLanes(context, now);
      drawParams(context);
      drawFooter(context);
    },
  };
}
