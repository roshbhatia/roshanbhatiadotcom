// Escape sequences shared by the terminal programs, and the encoding of key presses into the
// bytes a terminal sends to the program on the other end of its pty.
export const ESC = '\x1b';
export const CSI = `${ESC}[`;

export const ansi = {
  clearScreen: `${CSI}2J${CSI}H`,
  clearLine: `${CSI}2K`,
  clearToEnd: `${CSI}K`,
  home: `${CSI}H`,
  moveTo: (row, column) => `${CSI}${row + 1};${column + 1}H`,
  hideCursor: `${CSI}?25l`,
  showCursor: `${CSI}?25h`,
  enterAlternateScreen: `${CSI}?1049h`,
  exitAlternateScreen: `${CSI}?1049l`,
  // Button presses, drags while pressed, and SGR coordinates (DECSET 1000, 1002, 1006).
  enableMouse: `${CSI}?1000h${CSI}?1002h${CSI}?1006h`,
  disableMouse: `${CSI}?1006l${CSI}?1002l${CSI}?1000l`,
  reset: `${CSI}0m`,
  bold: (text) => `${CSI}1m${text}${CSI}22m`,
  dim: (text) => `${CSI}2m${text}${CSI}22m`,
  inverse: (text) => `${CSI}7m${text}${CSI}27m`,
  underline: (text) => `${CSI}4m${text}${CSI}24m`,
};

// SGR parameters for a cell style; `color` is an [r, g, b] truecolor foreground.
export function styleToSgr(style) {
  const codes = ['0'];
  if (style.bold) codes.push('1');
  if (style.dim) codes.push('2');
  if (style.underline) codes.push('4');
  if (style.inverse) codes.push('7');
  if (style.color) codes.push(`38;2;${style.color.join(';')}`);
  if (style.background) codes.push(`48;2;${style.background.join(';')}`);
  return `${CSI}${codes.join(';')}m`;
}

const ARROW_FINAL = { ArrowUp: 'A', ArrowDown: 'B', ArrowRight: 'C', ArrowLeft: 'D' };
const TILDE_KEYS = { Insert: 2, Delete: 3, PageUp: 5, PageDown: 6 };
const NAMED_KEYS = { Enter: '\r', Backspace: '\x7f', Escape: ESC };

// Encodes a key press the way a VT220/xterm-compatible terminal would.
export function encodeKey({ key, ctrl = false, alt = false, shift = false }, applicationCursorKeys = false) {
  if (ARROW_FINAL[key]) {
    if (shift || ctrl || alt) return `${CSI}1;${1 + (shift ? 1 : 0) + (alt ? 2 : 0) + (ctrl ? 4 : 0)}${ARROW_FINAL[key]}`;
    return `${ESC}${applicationCursorKeys ? 'O' : '['}${ARROW_FINAL[key]}`;
  }
  if (key === 'Home') return `${CSI}H`;
  if (key === 'End') return `${CSI}F`;
  if (TILDE_KEYS[key]) return `${CSI}${TILDE_KEYS[key]}~`;
  if (key === 'Tab') return shift ? `${CSI}Z` : '\t';
  if (NAMED_KEYS[key]) return (alt ? ESC : '') + NAMED_KEYS[key];
  if (key.length !== 1) return '';
  if (ctrl) {
    const upper = key.toUpperCase();
    if (upper >= 'A' && upper <= 'Z') return (alt ? ESC : '') + String.fromCharCode(upper.charCodeAt(0) - 64);
    if (key === ' ' || key === '@') return '\x00';
    if (key === '[') return ESC;
    return '';
  }
  return alt ? ESC + key : key;
}

// SGR (1006) mouse report. Button 0 is the primary button, +32 marks motion, 64/65 are wheel.
export function encodeMouse({ button, column, row, release = false, shift = false }) {
  return `${CSI}<${button + (shift ? 4 : 0)};${column + 1};${row + 1}${release ? 'm' : 'M'}`;
}
