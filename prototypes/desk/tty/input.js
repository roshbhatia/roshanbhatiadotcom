// Decodes the bytes a terminal sends to a program into key and mouse events.
const CSI_FINAL_KEYS = { A: 'ArrowUp', B: 'ArrowDown', C: 'ArrowRight', D: 'ArrowLeft', H: 'Home', F: 'End', Z: 'Tab' };
const TILDE_KEYS = { 1: 'Home', 2: 'Insert', 3: 'Delete', 4: 'End', 5: 'PageUp', 6: 'PageDown', 7: 'Home', 8: 'End' };

function modifiersFrom(parameter) {
  const value = Math.max(0, Number(parameter ?? 1) - 1);
  return { shift: Boolean(value & 1), alt: Boolean(value & 2), ctrl: Boolean(value & 4) };
}

function decodeMouse(parameters, final) {
  const [code, column, row] = parameters.split(';').map(Number);
  const event = { type: 'mouse', column: column - 1, row: row - 1, shift: Boolean(code & 4), alt: Boolean(code & 8), ctrl: Boolean(code & 16) };
  const base = code & ~(4 | 8 | 16);
  if (base >= 64) return { ...event, action: 'wheel', delta: base === 64 ? -1 : 1 };
  if (base & 32) return { ...event, action: 'drag', button: base & 3 };
  return { ...event, action: final === 'm' ? 'up' : 'down', button: base & 3 };
}

function decodeCsi(body, final) {
  if (body.startsWith('<') && (final === 'M' || final === 'm')) return decodeMouse(body.slice(1), final);
  const [first, second] = body.split(';');
  if (final === '~') return { type: 'key', key: TILDE_KEYS[first] ?? 'Unknown', ...modifiersFrom(second) };
  if (CSI_FINAL_KEYS[final]) {
    const modifiers = modifiersFrom(second);
    return { type: 'key', key: CSI_FINAL_KEYS[final], ...modifiers, shift: modifiers.shift || final === 'Z' };
  }
  return { type: 'key', key: 'Unknown' };
}

function decodeControl(character) {
  const code = character.charCodeAt(0);
  if (character === '\r' || character === '\n') return { type: 'key', key: 'Enter' };
  if (character === '\t') return { type: 'key', key: 'Tab' };
  if (code === 0x7f || code === 0x08) return { type: 'key', key: 'Backspace' };
  if (code === 0) return { type: 'key', key: ' ', ctrl: true };
  if (code < 0x20) return { type: 'key', key: String.fromCharCode(code + 96), ctrl: true };
  return { type: 'key', key: character };
}

// Each write from the terminal is one key press or mouse report, so a lone ESC is the Escape key.
export function decodeInput(data) {
  const events = [];
  let index = 0;
  while (index < data.length) {
    const character = data[index];
    if (character !== '\x1b') {
      events.push(decodeControl(character));
      index += 1;
      continue;
    }
    const next = data[index + 1];
    if (next === undefined) {
      events.push({ type: 'key', key: 'Escape' });
      index += 1;
    } else if (next === '[') {
      let end = index + 2;
      while (end < data.length && !/[A-Za-z~]/.test(data[end])) end += 1;
      events.push(decodeCsi(data.slice(index + 2, end), data[end]));
      index = end + 1;
    } else if (next === 'O') {
      events.push({ type: 'key', key: CSI_FINAL_KEYS[data[index + 2]] ?? 'Unknown' });
      index += 3;
    } else {
      const [event] = decodeInput(next);
      events.push({ ...event, alt: true });
      index += 2;
    }
  }
  return events;
}
