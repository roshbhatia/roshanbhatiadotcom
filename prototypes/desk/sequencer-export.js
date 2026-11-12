import { createChannel } from '../shared/audio.js';
import { cutoffFor, TRACKS } from './sequencer-engine.js';

const MP3_ENCODER_URL = 'https://cdn.jsdelivr.net/npm/@breezystack/lamejs@1.2.7/dist/lamejs.js';
const SAMPLE_RATE = 44100;
const MP3_KBPS = 192;
const TAIL_SECONDS = 2;
const MIDI_TICKS_PER_QUARTER = 96;
const MIDI_TICKS_PER_STEP = MIDI_TICKS_PER_QUARTER / 4;
const MIDI_DRUM_CHANNEL = 9;
const MIDI_VELOCITY = [0, 50, 90, 120];

// General MIDI percussion keys, matched against the voice name.
const GM_DRUMS = [
  [/KICK SHORT/, 36],
  [/BOOM|BASS DRUM/, 35],
  [/KICK/, 36],
  [/RIM/, 37],
  [/SNARE/, 38],
  [/CLAP/, 39],
  [/PEDAL HAT/, 44],
  [/OPEN HAT|HI-HAT OPEN/, 46],
  [/HAT/, 42],
  [/TOM LOW/, 41],
  [/TOM HIGH/, 48],
  [/TOM/, 45],
  [/CYMBAL/, 49],
  [/TAMBOURINE/, 54],
  [/COWBELL/, 56],
  [/CONGA/, 63],
  [/SHAKER/, 70],
  [/CLAVE/, 75],
  [/ZAP/, 81],
];
// General MIDI programs (zero-based) for the melodic voices.
const GM_PROGRAMS = [
  [/BASS|ACID|SUB/, 38],
  [/FM PIANO/, 5],
  [/CLAVI/, 7],
  [/VIBES/, 11],
  [/MARIMBA/, 12],
  [/GLOCK/, 9],
  [/BELL/, 14],
  [/ORGAN/, 16],
  [/PLUCK/, 45],
  [/LEAD/, 80],
  [/PAD/, 88],
];
const matchTable = (table, name, fallback) => table.find(([pattern]) => pattern.test(name))?.[1] ?? fallback;

function variableLength(value) {
  const bytes = [value & 0x7f];
  for (let rest = value >> 7; rest > 0; rest >>= 7) bytes.unshift((rest & 0x7f) | 0x80);
  return bytes;
}

const ascii = (text) => [...text].map((character) => character.charCodeAt(0) & 0x7f);
const uint32 = (value) => [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];

function midiTrack(events) {
  const ordered = [...events].sort((a, b) => a.tick - b.tick || a.order - b.order);
  const body = [];
  let previous = 0;
  for (const event of ordered) {
    body.push(...variableLength(event.tick - previous), ...event.data);
    previous = event.tick;
  }
  body.push(0, 0xff, 0x2f, 0);
  return [...ascii('MTrk'), ...uint32(body.length), ...body];
}

const metaText = (type, text) => [0xff, type, ...variableLength(text.length), ...ascii(text)];

// A type 1 Standard MIDI File: a tempo track, then one track per sequencer track that has notes.
export function exportMidi(engine, bars) {
  const { state } = engine;
  const { events } = engine.arrange(bars);
  const swingTicks = Math.round(state.swing * MIDI_TICKS_PER_STEP);
  const tickFor = (step) => step * MIDI_TICKS_PER_STEP + (step % 2 === 1 ? swingTicks : 0);
  const microsecondsPerQuarter = Math.round(60_000_000 / state.bpm);

  const tracks = [
    midiTrack([
      { tick: 0, order: 0, data: metaText(0x03, `SEQ-16 pattern ${state.patternIndex + 1}`) },
      { tick: 0, order: 1, data: [0xff, 0x51, 0x03, (microsecondsPerQuarter >> 16) & 0xff, (microsecondsPerQuarter >> 8) & 0xff, microsecondsPerQuarter & 0xff] },
      { tick: 0, order: 2, data: [0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08] },
      { tick: bars * 16 * MIDI_TICKS_PER_STEP, order: 3, data: metaText(0x01, 'end') },
    ]),
  ];

  let melodicChannel = 0;
  TRACKS.forEach((definition, track) => {
    const trackEvents = events.filter((event) => event.track === track);
    if (!trackEvents.length) return;
    const settings = state.tracks[track];
    const channel = definition.melodic ? melodicChannel++ : MIDI_DRUM_CHANNEL;
    const midiEvents = [{ tick: 0, order: 0, data: metaText(0x03, `${definition.name} (${settings.voice})`) }];
    if (definition.melodic) midiEvents.push({ tick: 0, order: 1, data: [0xc0 | channel, matchTable(GM_PROGRAMS, settings.voice, 0)] });
    for (const event of trackEvents) {
      const key = definition.melodic ? Math.min(127, Math.max(0, event.note + settings.pitch)) : matchTable(GM_DRUMS, settings.voice, 38);
      const start = tickFor(event.step);
      const length = definition.melodic ? MIDI_TICKS_PER_STEP : MIDI_TICKS_PER_STEP / 2;
      midiEvents.push({ tick: start, order: 3, data: [0x90 | channel, key, MIDI_VELOCITY[event.velocity]] });
      midiEvents.push({ tick: start + length, order: 2, data: [0x80 | channel, key, 0] });
    }
    tracks.push(midiTrack(midiEvents));
  });

  const header = [...ascii('MThd'), ...uint32(6), 0, 1, (tracks.length >> 8) & 0xff, tracks.length & 0xff, (MIDI_TICKS_PER_QUARTER >> 8) & 0xff, MIDI_TICKS_PER_QUARTER & 0xff];
  return new Blob([new Uint8Array([...header, ...tracks.flat()])], { type: 'audio/midi' });
}

// Renders the arrangement offline through the same voices and per-track mixer settings as playback.
async function renderAudio(engine, bars) {
  await engine.loadSamples();
  const { events, totalSeconds } = engine.arrange(bars);
  const offline = new OfflineAudioContext(2, Math.ceil((totalSeconds + TAIL_SECONDS) * SAMPLE_RATE), SAMPLE_RATE);
  const master = offline.createGain();
  master.gain.value = 0.8;
  const compressor = offline.createDynamicsCompressor();
  master.connect(compressor);
  compressor.connect(offline.destination);
  const channels = TRACKS.map((_, track) => {
    const channel = createChannel(offline, master);
    const settings = engine.state.tracks[track];
    channel.setVolume(settings.volume);
    channel.setPan(settings.pan);
    channel.setDrive(settings.drive);
    channel.setTone(cutoffFor(settings.tone));
    return channel;
  });
  const lead = 0.05;
  for (const event of events) engine.renderTrack(event.track, lead + event.time, event.velocity, event.note, channels[event.track].input);
  return offline.startRendering();
}

const toInt16 = (samples) => {
  const output = new Int16Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) output[index] = Math.max(-1, Math.min(1, samples[index])) * 0x7fff;
  return output;
};

function encodeWav(buffer) {
  const left = toInt16(buffer.getChannelData(0));
  const right = toInt16(buffer.getChannelData(1));
  const data = new DataView(new ArrayBuffer(44 + left.length * 4));
  const writeAscii = (offset, text) => [...text].forEach((character, index) => data.setUint8(offset + index, character.charCodeAt(0)));
  writeAscii(0, 'RIFF');
  data.setUint32(4, 36 + left.length * 4, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  data.setUint32(16, 16, true);
  data.setUint16(20, 1, true);
  data.setUint16(22, 2, true);
  data.setUint32(24, SAMPLE_RATE, true);
  data.setUint32(28, SAMPLE_RATE * 4, true);
  data.setUint16(32, 4, true);
  data.setUint16(34, 16, true);
  writeAscii(36, 'data');
  data.setUint32(40, left.length * 4, true);
  for (let index = 0; index < left.length; index += 1) {
    data.setInt16(44 + index * 4, left[index], true);
    data.setInt16(46 + index * 4, right[index], true);
  }
  return new Blob([data], { type: 'audio/wav' });
}

async function encodeMp3(buffer) {
  const { Mp3Encoder } = await import(MP3_ENCODER_URL);
  const encoder = new Mp3Encoder(2, SAMPLE_RATE, MP3_KBPS);
  const left = toInt16(buffer.getChannelData(0));
  const right = toInt16(buffer.getChannelData(1));
  const chunks = [];
  const blockSize = 1152;
  for (let index = 0; index < left.length; index += blockSize) {
    const chunk = encoder.encodeBuffer(left.subarray(index, index + blockSize), right.subarray(index, index + blockSize));
    if (chunk.length) chunks.push(chunk);
  }
  chunks.push(encoder.flush());
  return new Blob(chunks, { type: 'audio/mpeg' });
}

export async function exportAudio(engine, bars, format) {
  const buffer = await renderAudio(engine, bars);
  return format === 'mp3' ? encodeMp3(buffer) : encodeWav(buffer);
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
