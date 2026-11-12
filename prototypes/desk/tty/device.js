// The terminal hardware: Ghostty's VT emulator (libghostty-vt compiled to WebAssembly, via ghostty-web)
// rendering into an off-screen canvas that the CRT texture copies every frame.
const GHOSTTY_MODULE_URL = 'https://cdn.jsdelivr.net/npm/ghostty-web@0.4.0/dist/ghostty-web.js';
const FONT_FAMILY = 'VT323';

// A green-phosphor monitor shows every color as a brightness of the same phosphor.
const PHOSPHOR_THEME = {
  background: '#06140d',
  foreground: '#8dffb7',
  cursor: '#8dffb7',
  cursorAccent: '#06140d',
  selectionBackground: '#2f6b48',
  black: '#06140d',
  red: '#3d8a5e',
  green: '#6fdc98',
  yellow: '#8dffb7',
  blue: '#3d8a5e',
  magenta: '#5cbf86',
  cyan: '#7aeea8',
  white: '#a8ffc9',
  brightBlack: '#2f6b48',
  brightRed: '#5cbf86',
  brightGreen: '#a8ffc9',
  brightYellow: '#c8ffdc',
  brightBlue: '#5cbf86',
  brightMagenta: '#8dffb7',
  brightCyan: '#b5ffd2',
  brightWhite: '#e8fff0',
};

// DEC private modes queried to encode input the way the running program asked for.
const MODE_APPLICATION_CURSOR_KEYS = 1;
const MODE_MOUSE_BUTTON_MOTION = 1002;
const MODE_MOUSE_ANY_MOTION = 1003;

// `overscan` is the blank border left around the grid, as on a CRT, so the curved glass and bezel don't clip text.
export async function createTerminalDevice({ width, height, overscanX = 0, overscanY = 0, fontSize = 24, scrollback = 1000 }) {
  const [{ init, Terminal }] = await Promise.all([import(GHOSTTY_MODULE_URL), document.fonts.load(`${fontSize}px ${FONT_FAMILY}`)]);
  await init();

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, { position: 'fixed', left: '-20000px', top: '0', width: `${width}px`, height: `${height}px`, pointerEvents: 'none' });
  document.body.appendChild(host);

  const terminal = new Terminal({ fontFamily: FONT_FAMILY, fontSize, cursorBlink: true, cursorStyle: 'block', scrollback, theme: PHOSPHOR_THEME });
  // Keys reach the programs through the desk keyboard, never through Ghostty's own focus handling.
  terminal.attachCustomKeyEventHandler(() => false);
  terminal.open(host);
  terminal.blur();
  const textarea = host.querySelector('textarea');
  if (textarea) {
    textarea.tabIndex = -1;
    textarea.disabled = true;
  }
  const canvas = host.querySelector('canvas');

  const pixelRatio = canvas.width / canvas.clientWidth || 1;
  const cellWidth = canvas.width / pixelRatio / terminal.cols;
  const cellHeight = canvas.height / pixelRatio / terminal.rows;
  terminal.resize(Math.floor((width - overscanX * 2) / cellWidth), Math.floor((height - overscanY * 2) / cellHeight));
  const offsetX = Math.floor((width - terminal.cols * cellWidth) / 2);
  const offsetY = Math.floor((height - terminal.rows * cellHeight) / 2);

  return {
    get columns() {
      return terminal.cols;
    },
    get rows() {
      return terminal.rows;
    },
    write(data) {
      terminal.write(data);
    },
    reset() {
      terminal.reset();
    },
    scrollLines(amount) {
      terminal.scrollLines(amount);
    },
    scrollToBottom() {
      terminal.scrollToBottom();
    },
    applicationCursorKeys: () => terminal.getMode(MODE_APPLICATION_CURSOR_KEYS),
    mouseTracking: () => terminal.hasMouseTracking(),
    mouseMotion: () => terminal.getMode(MODE_MOUSE_BUTTON_MOTION) || terminal.getMode(MODE_MOUSE_ANY_MOTION),
    // Maps a point on the CRT canvas to a terminal cell, clamped to the grid.
    cellAt(x, y) {
      return {
        column: Math.min(terminal.cols - 1, Math.max(0, Math.floor((x - offsetX) / cellWidth))),
        row: Math.min(terminal.rows - 1, Math.max(0, Math.floor((y - offsetY) / cellHeight))),
      };
    },
    draw(context) {
      context.fillStyle = PHOSPHOR_THEME.background;
      context.fillRect(0, 0, width, height);
      context.drawImage(canvas, offsetX, offsetY, terminal.cols * cellWidth, terminal.rows * cellHeight);
    },
  };
}
