import { getSequencerEngine } from './sequencer-engine.js';

// The sequencer now runs as the `daw` program inside the terminal. The scene still holds this
// handle so cutting power can stop playback.
export function createSequencer() {
  const engine = getSequencerEngine();
  return {
    stop: () => engine.stop(),
    open() {},
    draw() {},
    handleKey() {},
    handlePointer() {},
  };
}
