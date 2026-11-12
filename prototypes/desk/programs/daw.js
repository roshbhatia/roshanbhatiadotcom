import { STYLE } from '../tty/widgets.js';
import { getSequencerEngine, noteName, PARAMS, PATTERN_COUNT, STEPS, TRACKS } from '../sequencer-engine.js';
import { downloadBlob, exportAudio, exportMidi } from '../sequencer-export.js';
import { runFullScreen } from './full-screen.js';

const PAD_KEYS = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const NOTE_KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
// Shifted digits on a US layout copy the current pattern into slots 1-8.
const SHIFTED_DIGITS = ['!', '@', '#', '$', '%', '^', '&', '*'];
const DRUM_SHADES = ['', '▒▒▒', '▓▓▓', '███'];
const EXPORT_FORMATS = [
  { label: 'MIDI', extension: 'mid' },
  { label: 'MP3', extension: 'mp3' },
  { label: 'WAV', extension: 'wav' },
];
const MAX_EXPORT_BARS = 128;

const NAME_WIDTH = 9;
const CELL_WIDTH = 4;
const GROUP = 4;
const PANEL_LEFT = 1;

const stepOffset = (step) => step * CELL_WIDTH + Math.floor(step / GROUP);

export function createDaw(io) {
  const engine = getSequencerEngine();
  const cursor = { track: 0, step: 0 };
  let selectedParam = 0;
  let showHelp = false;
  let paintValue = null;
  // The export dialog: null when closed.
  let exportDialog = null;

  // Track name, then [M] [S], then the step grid, inside the panel border.
  const gridLeft = PANEL_LEFT + 1 + 2 + NAME_WIDTH + 8;
  const panelWidth = Math.min(io.columns - PANEL_LEFT * 2, gridLeft + stepOffset(STEPS) + 1 - PANEL_LEFT);
  const tracksTop = 3;
  const tracksHeight = TRACKS.length + 3;
  const paramsTop = tracksTop + tracksHeight;
  const paramsHeight = Math.ceil(PARAMS.length / 2) + 2;
  const padsTop = paramsTop + paramsHeight;
  const padsHeight = 4;

  function cellAtColumn(column) {
    for (let step = 0; step < STEPS; step += 1) {
      const x = gridLeft + stepOffset(step);
      if (column >= x && column < x + CELL_WIDTH - 1) return step;
    }
    return -1;
  }

  function nudgeSelectedParam(direction, coarse) {
    const param = PARAMS[selectedParam];
    const { step } = engine.paramRange(cursor.track, param);
    engine.setParam(cursor.track, param, engine.getParam(cursor.track, param) + direction * step * (coarse ? 4 : 1));
  }

  function drawTransport(ui, seconds) {
    const { screen } = ui;
    const { state } = engine;
    let x = PANEL_LEFT;
    x += ui.button(x, 1, engine.playing ? '■ STOP' : '▶ PLAY', { active: engine.playing, onPress: () => engine.togglePlayback() }) + 1;
    const recordLit = engine.recording && (!engine.playing || Math.floor(seconds * 3) % 2 === 0);
    x += ui.button(x, 1, '● REC', { active: recordLit, onPress: () => engine.toggleRecording() }) + 2;
    x += screen.text(x, 1, 'BPM', STYLE.dim) + 1;
    x += ui.button(x, 1, '-', { onPress: () => engine.changeTempo(-2) });
    x += screen.text(x, 1, String(state.bpm).padStart(4).padEnd(5), STYLE.bright);
    x += ui.button(x, 1, '+', { onPress: () => engine.changeTempo(2) }) + 2;
    x += screen.text(x, 1, 'SWING', STYLE.dim) + 1;
    x += ui.button(x, 1, '-', { onPress: () => engine.changeSwing(-0.05) });
    x += screen.text(x, 1, `${Math.round(state.swing * 100)}%`.padStart(4).padEnd(5), STYLE.bright);
    x += ui.button(x, 1, '+', { onPress: () => engine.changeSwing(0.05) }) + 2;
    x += ui.button(x, 1, 'CHAIN', { active: state.chain, onPress: () => engine.toggleChain() }) + 1;
    ui.button(x, 1, 'EXIT', { onPress: () => program.quit() });

    let patternX = PANEL_LEFT;
    patternX += screen.text(patternX, 2, 'PATTERN ', STYLE.dim);
    for (let index = 0; index < PATTERN_COUNT; index += 1) {
      const queued = engine.queuedPattern === index && Math.floor(seconds * 4) % 2 === 0;
      const used = engine.patternHasSteps(state.patterns[index]);
      const label = used ? `${index + 1}•` : `${index + 1} `;
      patternX += ui.button(patternX, 2, label, { active: index === state.patternIndex || queued, onPress: () => engine.selectPattern(index) }) + 1;
    }
    ui.button(patternX + 1, 2, 'EXPORT', { active: exportDialog !== null, onPress: openExport });
  }

  function openExport() {
    exportDialog ??= { format: 0, bars: 4, status: '', busy: false };
  }

  function changeExportBars(amount) {
    exportDialog.bars = Math.min(MAX_EXPORT_BARS, Math.max(1, exportDialog.bars + amount));
  }

  async function runExport() {
    if (exportDialog.busy) return;
    const dialog = exportDialog;
    const format = EXPORT_FORMATS[dialog.format];
    const fileName = `seq16-pattern${engine.state.patternIndex + 1}-${dialog.bars}bars-${engine.state.bpm}bpm.${format.extension}`;
    dialog.busy = true;
    dialog.status = format.extension === 'mid' ? 'writing midi...' : 'rendering audio...';
    program.invalidate();
    try {
      const blob = format.extension === 'mid' ? exportMidi(engine, dialog.bars) : await exportAudio(engine, dialog.bars, format.extension);
      downloadBlob(blob, fileName);
      dialog.status = `saved ${fileName} (${(blob.size / 1024).toFixed(0)} KB)`;
    } catch (error) {
      dialog.status = `export failed: ${error.message}`;
    } finally {
      dialog.busy = false;
      program.invalidate();
    }
  }

  function drawExport(ui) {
    const { screen } = ui;
    const dialog = exportDialog;
    const { state } = engine;
    const width = 60;
    const height = 11;
    const x = Math.floor((io.columns - width) / 2);
    const y = Math.max(1, Math.floor((io.rows - height) / 2));
    screen.fill({ x, y, width, height }, ' ');
    ui.region({ x: 0, y: 0, width: io.columns, height: io.rows }, { down: () => {}, wheel: () => {} });
    const inner = screen.box({ x, y, width, height }, { title: 'EXPORT', titleStyle: STYLE.bright, border: 'double' });
    const left = inner.x + 2;
    screen.text(left, inner.y + 1, 'FORMAT', STYLE.dim);
    let formatX = left + 9;
    EXPORT_FORMATS.forEach((format, index) => {
      formatX += ui.button(formatX, inner.y + 1, format.label, { active: index === dialog.format, onPress: () => (dialog.format = index) }) + 1;
    });
    screen.text(left, inner.y + 3, 'BARS', STYLE.dim);
    let barsX = left + 9;
    barsX += ui.button(barsX, inner.y + 3, '-', { onPress: () => changeExportBars(-1) });
    barsX += screen.text(barsX, inner.y + 3, String(dialog.bars).padStart(4).padEnd(5), STYLE.bright);
    ui.button(barsX, inner.y + 3, '+', { onPress: () => changeExportBars(1) });
    const seconds = (dialog.bars * STEPS * 60) / state.bpm / 4;
    const source = state.chain ? 'chained patterns' : `pattern ${state.patternIndex + 1}`;
    screen.text(left, inner.y + 5, `${source}, ${state.bpm} bpm, ${seconds.toFixed(1)} s`, STYLE.normal, inner.width - 4);
    let actionX = left;
    actionX += ui.button(actionX, inner.y + 7, dialog.busy ? 'WORKING' : 'EXPORT', { active: true, onPress: runExport }) + 1;
    ui.button(actionX, inner.y + 7, 'CLOSE', { onPress: () => (exportDialog = null) });
    screen.text(left, inner.y + 8, dialog.status, STYLE.bright, inner.width - 4);
  }

  function onExportKey({ key }) {
    if (key === 'Escape' || key === 'q') exportDialog = null;
    else if (key === 'ArrowLeft') exportDialog.format = (exportDialog.format + EXPORT_FORMATS.length - 1) % EXPORT_FORMATS.length;
    else if (key === 'ArrowRight' || key === 'Tab') exportDialog.format = (exportDialog.format + 1) % EXPORT_FORMATS.length;
    else if (key === 'ArrowUp' || key === '+' || key === '=') changeExportBars(1);
    else if (key === 'ArrowDown' || key === '-' || key === '_') changeExportBars(-1);
    else if (key === 'Enter') runExport();
  }

  function drawTracks(ui) {
    const { screen } = ui;
    const anySolo = engine.state.tracks.some((track) => track.solo);
    const inner = screen.box({ x: PANEL_LEFT, y: tracksTop, width: panelWidth, height: tracksHeight }, { title: 'TRACKS', titleStyle: STYLE.bright, border: 'rounded' });
    const headerY = inner.y;
    const playhead = engine.playheadStep(cursor.track);
    for (let step = 0; step < STEPS; step += 1) {
      const x = gridLeft + stepOffset(step);
      const label = step === playhead ? ' ▼ ' : String(step + 1).padStart(2).padEnd(3);
      screen.text(x, headerY, label, step === playhead ? STYLE.bright : step % GROUP === 0 ? STYLE.normal : STYLE.dim);
      if (step % GROUP === GROUP - 1 && step < STEPS - 1) screen.put(x + CELL_WIDTH - 1, headerY, '│', STYLE.dim);
    }

    TRACKS.forEach((definition, track) => {
      const y = inner.y + 1 + track;
      const settings = engine.state.tracks[track];
      const audible = !settings.mute && (!anySolo || settings.solo);
      const selected = track === cursor.track;
      const nameStyle = selected ? STYLE.brightInverse : engine.isFlashing(track) ? STYLE.bright : audible ? STYLE.normal : STYLE.dim;
      screen.text(inner.x + 1, y, definition.name.padEnd(NAME_WIDTH), nameStyle);
      ui.region({ x: inner.x + 1, y, width: NAME_WIDTH, height: 1 }, {
        down: () => {
          cursor.track = track;
          engine.audition(track);
        },
      });
      [['M', 'mute'], ['S', 'solo']].forEach(([letter, flag], index) => {
        const x = inner.x + 2 + NAME_WIDTH + index * 4;
        screen.text(x, y, `[${letter}]`, settings[flag] ? STYLE.brightInverse : STYLE.dim);
        ui.region({ x, y, width: 3, height: 1 }, { down: () => engine.toggleTrackFlag(track, flag) });
      });

      const lane = engine.laneFor(track);
      const trackPlayhead = engine.playheadStep(track);
      for (let step = 0; step < STEPS; step += 1) {
        const x = gridLeft + stepOffset(step);
        if (step % GROUP === GROUP - 1 && step < STEPS - 1) screen.put(x + CELL_WIDTH - 1, y, '│', STYLE.dim);
        const isCursor = selected && step === cursor.step;
        if (step >= lane.length) {
          screen.text(x, y, isCursor ? '[ ]' : '   ', STYLE.dim);
          continue;
        }
        const entry = lane.steps[step];
        const atPlayhead = step === trackPlayhead;
        if (!entry) {
          const style = atPlayhead ? STYLE.bright : isCursor ? STYLE.bright : STYLE.dim;
          screen.text(x, y, isCursor ? '[·]' : atPlayhead ? ' • ' : ' · ', style);
          continue;
        }
        const text = definition.melodic ? noteName(entry.note).padEnd(3) : DRUM_SHADES[entry.velocity];
        const style = definition.melodic
          ? entry.velocity === 3 || atPlayhead ? STYLE.brightInverse : entry.velocity === 2 ? STYLE.inverse : { dim: true, inverse: true }
          : atPlayhead || entry.velocity === 3 ? STYLE.bright : entry.velocity === 2 ? STYLE.normal : STYLE.dim;
        screen.text(x, y, text, isCursor ? { ...style, underline: true } : style);
      }
    });

    ui.region({ x: gridLeft, y: inner.y + 1, width: stepOffset(STEPS), height: TRACKS.length }, {
      down: (event) => {
        const step = cellAtColumn(event.column);
        const track = event.row - (inner.y + 1);
        if (step === -1) return;
        cursor.track = track;
        cursor.step = step;
        if (event.shift) {
          paintValue = null;
          engine.cycleVelocity(track, step);
          return;
        }
        paintValue = !engine.laneFor(track).steps[step];
        engine.toggleStep(track, step);
      },
      drag: (event) => {
        const step = cellAtColumn(event.column);
        const track = event.row - (inner.y + 1);
        if (step === -1 || paintValue === null || track < 0 || track >= TRACKS.length || step >= engine.laneFor(track).length) return;
        if (Boolean(engine.laneFor(track).steps[step]) !== paintValue) engine.toggleStep(track, step);
      },
      up: () => (paintValue = null),
      wheel: (event) => {
        const step = cellAtColumn(event.column);
        if (step !== -1) engine.nudgeNote(event.row - (inner.y + 1), step, -event.delta);
      },
    });
  }

  function drawParams(ui) {
    const track = cursor.track;
    const title = `TRACK ${String(track + 1).padStart(2, '0')} · ${TRACKS[track].name} · ${engine.voiceName(track)}`;
    const inner = ui.screen.box({ x: PANEL_LEFT, y: paramsTop, width: panelWidth, height: paramsHeight }, { title, titleStyle: STYLE.bright, border: 'rounded' });
    const columnWidth = Math.floor(inner.width / 2);
    PARAMS.forEach((param, index) => {
      const range = engine.paramRange(track, param);
      const value = engine.getParam(track, param);
      ui.slider(inner.x + 1 + (index % 2) * columnWidth, inner.y + Math.floor(index / 2), {
        label: param.label,
        labelWidth: 6,
        barWidth: Math.max(8, columnWidth - 22),
        value,
        min: range.min,
        max: range.max,
        step: range.step,
        format: param.key === 'voice' ? () => engine.voiceName(track) : param.format,
        selected: index === selectedParam,
        onChange: (next) => {
          selectedParam = index;
          engine.setParam(track, param, next);
        },
      });
    });
  }

  // One pad per track, labelled with its key; a pad lights while its track sounds. Click to play.
  function drawPads(ui) {
    const { screen } = ui;
    const inner = screen.box({ x: PANEL_LEFT, y: padsTop, width: panelWidth, height: padsHeight }, { title: 'PADS', titleStyle: STYLE.bright, border: 'rounded' });
    const padWidth = Math.floor((inner.width - 1) / TRACKS.length);
    TRACKS.forEach((definition, track) => {
      const x = inner.x + 1 + track * padWidth;
      const lit = engine.isFlashing(track);
      const keyLabel = PAD_KEYS[track].toUpperCase();
      screen.text(x, inner.y, ` ${keyLabel} `.padEnd(padWidth - 1), lit ? STYLE.brightInverse : STYLE.inverse);
      screen.text(x, inner.y + 1, definition.name.slice(0, padWidth - 1), lit ? STYLE.bright : STYLE.dim);
      ui.region({ x, y: inner.y, width: padWidth - 1, height: 2 }, { down: () => engine.playLive(track, definition.melodic ? engine.lastNoteOn(track) : undefined) });
    });
  }

  function drawHelp(ui) {
    const { screen } = ui;
    const lines = [
      ['space', 'play / stop'],
      ['n', 'record (live pads write to the nearest step)'],
      ['arrows', 'move cursor; shift+left/right rotates the track'],
      ['enter', 'toggle step'],
      ['/', 'cycle step velocity (also shift+click)'],
      [', .', 'note down/up a semitone; < > an octave'],
      ['backspace', 'delete step'],
      ['q w e r t y u i o p', 'play tracks 1-10 live'],
      ['a s d f g h j k l', 'notes for the selected track (step entry when stopped)'],
      ['tab / shift+tab', 'select parameter'],
      ['[ ]', 'adjust parameter; { } in bigger steps'],
      ['1-8', 'pattern (switches at the bar line while playing)'],
      ['! @ # $ % ^ & *', 'copy this pattern to slot 1-8'],
      ['z x', 'mute / solo track'],
      ['c C', 'clear track / clear pattern'],
      ['v', 'random fill'],
      ['b', 'chain patterns'],
      ['- = _ +', 'tempo'],
      ["; '", 'swing'],
      ['mouse', 'click buttons, paint steps, drag sliders, wheel notes'],
      ['E', 'export midi, mp3 or wav'],
      ['? / esc', 'close help / quit'],
    ];
    const width = 74;
    const height = lines.length + 4;
    const x = Math.floor((io.columns - width) / 2);
    const y = Math.max(1, Math.floor((io.rows - height) / 2));
    screen.fill({ x, y, width, height }, ' ');
    ui.region({ x: 0, y: 0, width: io.columns, height: io.rows }, { down: () => (showHelp = false), wheel: () => {} });
    const inner = screen.box({ x, y, width, height }, { title: 'KEYS', titleStyle: STYLE.bright, border: 'double' });
    lines.forEach(([keys, description], index) => {
      screen.text(inner.x + 2, inner.y + 1 + index, keys.padEnd(22), STYLE.bright);
      screen.text(inner.x + 24, inner.y + 1 + index, description, STYLE.normal, inner.width - 25);
    });
  }

  function onKey({ key, ctrl, shift }) {
    if (exportDialog) {
      onExportKey({ key });
      return;
    }
    if (showHelp) {
      if (key === '?' || key === 'Escape' || key === 'q') showHelp = false;
      return;
    }
    const pad = PAD_KEYS.indexOf(key);
    const note = NOTE_KEYS.indexOf(key);
    const copySlot = SHIFTED_DIGITS.indexOf(key);
    if (key === 'Escape' || (ctrl && key === 'c')) program.quit();
    else if (key === '?') showHelp = true;
    else if (key === 'E') openExport();
    else if (key === ' ') engine.togglePlayback();
    else if (key === 'Enter') engine.toggleStep(cursor.track, cursor.step);
    else if (key === '/') engine.cycleVelocity(cursor.track, cursor.step);
    else if (key === 'ArrowUp') cursor.track = (cursor.track + TRACKS.length - 1) % TRACKS.length;
    else if (key === 'ArrowDown') cursor.track = (cursor.track + 1) % TRACKS.length;
    else if (key === 'ArrowLeft') shift ? engine.rotateTrack(cursor.track, -1) : (cursor.step = (cursor.step + STEPS - 1) % STEPS);
    else if (key === 'ArrowRight') shift ? engine.rotateTrack(cursor.track, 1) : (cursor.step = (cursor.step + 1) % STEPS);
    else if (key === 'Tab') selectedParam = (selectedParam + (shift ? PARAMS.length - 1 : 1)) % PARAMS.length;
    else if (key === '[' || key === '{') nudgeSelectedParam(-1, key === '{');
    else if (key === ']' || key === '}') nudgeSelectedParam(1, key === '}');
    else if (key === ',' || key === '<') engine.nudgeNote(cursor.track, cursor.step, key === '<' ? -12 : -1);
    else if (key === '.' || key === '>') engine.nudgeNote(cursor.track, cursor.step, key === '>' ? 12 : 1);
    else if (key === '-' || key === '_') engine.changeTempo(key === '_' ? -10 : -2);
    else if (key === '=' || key === '+') engine.changeTempo(key === '+' ? 10 : 2);
    else if (key === ';') engine.changeSwing(-0.05);
    else if (key === "'") engine.changeSwing(0.05);
    else if (key === 'Backspace' || key === 'Delete') engine.deleteStep(cursor.track, cursor.step);
    else if (/^[1-8]$/.test(key)) engine.selectPattern(Number(key) - 1);
    else if (copySlot !== -1) engine.copyPatternTo(copySlot);
    else if (pad !== -1) engine.playLive(pad, TRACKS[pad].melodic ? engine.lastNoteOn(pad) : undefined);
    else if (note !== -1) cursor.step = engine.enterNote(cursor.track, cursor.step, note);
    else if (key === 'z') engine.toggleTrackFlag(cursor.track, 'mute');
    else if (key === 'x') engine.toggleTrackFlag(cursor.track, 'solo');
    else if (key === 'c') engine.clearTrack(cursor.track);
    else if (key === 'C') engine.clearPattern();
    else if (key === 'v') engine.randomizeTrack(cursor.track);
    else if (key === 'b') engine.toggleChain();
    else if (key === 'n') engine.toggleRecording();
  }

  engine.loadSamples();

  const program = runFullScreen(io, {
    animate: true,
    draw(ui, seconds) {
      const { state } = engine;
      const status = [`SEQ-16`, `pattern ${state.patternIndex + 1}`, engine.playing ? '▶ playing' : '■ stopped', engine.recording ? '● rec' : '', state.chain ? 'chain' : '']
        .filter(Boolean)
        .join('  ');
      ui.statusBar(0, status, `${state.bpm} bpm  swing ${Math.round(state.swing * 100)}%`);
      drawTransport(ui, seconds);
      drawTracks(ui);
      drawParams(ui);
      drawPads(ui);
      ui.keyHints(io.rows - 2, [
        ['space', 'play'],
        ['enter', 'step'],
        ['/', 'velocity'],
        [', .', 'note'],
        ['q-p', 'pads'],
        ['a-l', 'notes'],
        ['tab', 'param'],
        ['[ ]', 'adjust'],
        ['1-8', 'pattern'],
        ['n', 'rec'],
        ['E', 'export'],
        ['?', 'all keys'],
        ['esc', 'quit'],
      ], 2);
      if (showHelp) drawHelp(ui);
      if (exportDialog) drawExport(ui);
    },
    onKey,
  });
  return program;
}
