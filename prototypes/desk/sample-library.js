// Open-source samples for the sequencer (fetched by scripts/fetch-sequencer-samples.sh):
// the TR808EmulationKit from Hydrogen (GPL-2.0) and the Versilian Community Sample Library (CC0).
const ROOT = 'assets/samples';
const NOTE_INDEX = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

// Scientific pitch names (C4 = MIDI 60), as used in the VCSL file names.
const midiFromName = (name) => {
  const [, letter, octave] = /^([A-G]#?)(-?\d)$/.exec(name);
  return (Number(octave) + 1) * 12 + NOTE_INDEX[letter];
};
const fileName = (note) => note.replace('#', 's');

// Drum voices: name -> sample file, plus the synth voice to use until the sample has loaded.
export const DRUM_SAMPLES = {
  '808 KICK': { file: 'tr808/Kick_Long.flac', fallback: 'KICK' },
  '808 KICK SHORT': { file: 'tr808/Kick_Short.flac', fallback: 'KICK' },
  '808 SNARE': { file: 'tr808/Snare_1.flac', fallback: 'SNARE' },
  '808 SNARE 2': { file: 'tr808/Snare_2.flac', fallback: 'SNARE' },
  '808 CLAP': { file: 'tr808/Clap.flac', fallback: 'CLAP' },
  '808 HAT': { file: 'tr808/Hat_Closed.flac', fallback: 'HAT' },
  '808 OPEN HAT': { file: 'tr808/Hat_Open.flac', fallback: 'OPEN HAT' },
  '808 PEDAL HAT': { file: 'tr808/Hat_Pedal.flac', fallback: 'HAT' },
  '808 TOM LOW': { file: 'tr808/Tom_Low.flac', fallback: 'TOM' },
  '808 TOM MID': { file: 'tr808/Tom_Mid.flac', fallback: 'TOM' },
  '808 TOM HIGH': { file: 'tr808/Tom_Hi.flac', fallback: 'TOM' },
  '808 COWBELL': { file: 'tr808/Cowbell.flac', fallback: 'COWBELL' },
  '808 SHAKER': { file: 'tr808/Shaker.flac', fallback: 'SHAKER' },
  '808 CLAVE': { file: 'tr808/Clave.flac', fallback: 'RIM' },
  '808 CONGA': { file: 'tr808/Conga.flac', fallback: 'TOM' },
  '808 CYMBAL': { file: 'tr808/Cymbal.flac', fallback: 'OPEN HAT' },
  'BASS DRUM': { file: 'vcsl/drums/kick.flac', fallback: 'BOOM' },
  'SNARE DRUM': { file: 'vcsl/drums/snare.flac', fallback: 'SNARE' },
  'HI-HAT': { file: 'vcsl/drums/hat.flac', fallback: 'HAT' },
  'HI-HAT OPEN': { file: 'vcsl/drums/open-hat.flac', fallback: 'OPEN HAT' },
  'TOM DRUM': { file: 'vcsl/drums/tom.flac', fallback: 'TOM' },
  'HAND CLAP': { file: 'vcsl/drums/clap.flac', fallback: 'CLAP' },
  COWBELL: { file: 'vcsl/drums/cowbell.flac', fallback: 'COWBELL' },
  TAMBOURINE: { file: 'vcsl/drums/tambourine.flac', fallback: 'SHAKER' },
  SHAKER: { file: 'vcsl/drums/shaker.flac', fallback: 'SHAKER' },
};

// Pitched voices: name -> sampled notes; other notes are repitched from the nearest one.
// The VCSL mallet files sound one octave above their names (measured), hence `octaveOffset`.
export const PITCHED_SAMPLES = {
  'FM PIANO': { folder: 'vcsl/fm-piano', notes: ['C1', 'G#1', 'C2', 'G#2', 'C3', 'G#3', 'C4', 'G#4', 'C5', 'G#5', 'C6'], fallback: 'ORGAN' },
  CLAVI: { folder: 'vcsl/clavisynth', notes: ['C1', 'G#1', 'C2', 'G#2', 'C3', 'G#3', 'C4', 'G#4', 'C5', 'G#5', 'C6'], fallback: 'PLUCK' },
  VIBES: { folder: 'vcsl/vibraphone', notes: ['F2', 'A2', 'C3', 'E3', 'G3', 'B3', 'D4', 'F4', 'A4', 'C5', 'E5'], octaveOffset: 12, fallback: 'BELL' },
  MARIMBA: { folder: 'vcsl/marimba', notes: ['F1', 'C2', 'G2', 'B2', 'F3', 'C4', 'G4', 'B4', 'F5', 'C6'], octaveOffset: 12, fallback: 'PLUCK' },
  GLOCK: { folder: 'vcsl/glockenspiel', notes: ['G4', 'C5', 'G5', 'C6', 'G6', 'C7'], octaveOffset: 12, fallback: 'BELL' },
};

const buffers = new Map();
let loading = null;

// Decodes every sample once. Decoded AudioBuffers can be played in the live and the export contexts.
export function loadSamples() {
  loading ??= (async () => {
    const decoder = new OfflineAudioContext(1, 1, 44100);
    const files = [
      ...Object.values(DRUM_SAMPLES).map(({ file }) => file),
      ...Object.values(PITCHED_SAMPLES).flatMap(({ folder, notes }) => notes.map((note) => `${folder}/${fileName(note)}.flac`)),
    ];
    await Promise.all(
      files.map(async (file) => {
        try {
          const response = await fetch(`${ROOT}/${file}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          buffers.set(file, await decoder.decodeAudioData(await response.arrayBuffer()));
        } catch (error) {
          console.warn(`sample ${file} failed to load`, error);
        }
      }),
    );
  })();
  return loading;
}

function playBuffer(buffer, time, { rate = 1, gain = 1, decay = 1, destination }) {
  const audio = destination.context;
  const start = Math.max(time, audio.currentTime);
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  const envelope = audio.createGain();
  const length = buffer.duration / rate;
  envelope.gain.setValueAtTime(gain, start);
  // DECAY shortens the sample with a fade; values above 1 leave it at its natural length.
  if (decay < 1) envelope.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.02, length * decay));
  source.connect(envelope);
  envelope.connect(destination);
  source.start(start);
  source.stop(start + length + 0.05);
}

export function createDrumSampleVoice(name, fallbackVoice) {
  const { file } = DRUM_SAMPLES[name];
  return (time, { ratio, decay, gain, destination }) => {
    const buffer = buffers.get(file);
    if (!buffer) {
      fallbackVoice(time, { ratio, decay, gain, destination });
      return;
    }
    playBuffer(buffer, time, { rate: ratio, gain: gain * 1.2, decay, destination });
  };
}

export function createPitchedSampleVoice(name, fallbackVoice) {
  const { folder, notes, octaveOffset = 0 } = PITCHED_SAMPLES[name];
  const roots = notes.map((note) => ({ midi: midiFromName(note) + octaveOffset, file: `${folder}/${fileName(note)}.flac` }));
  return (time, { frequency, decay, gain, destination }) => {
    const midi = 69 + 12 * Math.log2(frequency / 440);
    const root = roots.reduce((best, entry) => (Math.abs(entry.midi - midi) < Math.abs(best.midi - midi) ? entry : best));
    const buffer = buffers.get(root.file);
    if (!buffer) {
      fallbackVoice(time, { frequency, decay, gain, destination });
      return;
    }
    playBuffer(buffer, time, { rate: 2 ** ((midi - root.midi) / 12), gain: gain * 0.9, decay, destination });
  };
}
