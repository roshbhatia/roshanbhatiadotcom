import { ansi } from '../tty/ansi.js';
import { decodeInput } from '../tty/input.js';
import { createScreen } from '../tty/screen.js';
import { createUi } from '../tty/widgets.js';

// Runs a full-screen TUI on the alternate screen, the way curses programs do: it enables mouse
// reporting, redraws through a diffing screen buffer, and restores the shell's screen on exit.
export function runFullScreen(io, { mouse = true, animate = false, draw, onKey, onMouse }) {
  const screen = createScreen(io.columns, io.rows);
  const ui = createUi(screen);
  let dirty = true;
  let running = true;

  const program = {
    ui,
    screen,
    invalidate() {
      dirty = true;
    },
    quit() {
      if (!running) return;
      running = false;
      io.write(`${mouse ? ansi.disableMouse : ''}${ansi.reset}${ansi.exitAlternateScreen}${ansi.showCursor}`);
      io.exit();
    },
    start() {
      io.write(`${ansi.enterAlternateScreen}${mouse ? ansi.enableMouse : ''}${ansi.hideCursor}`);
      screen.invalidate();
    },
    input(data) {
      for (const event of decodeInput(data)) {
        if (!running) return;
        if (event.type === 'mouse') {
          const handled = ui.handleMouse(event);
          if (!handled) onMouse?.(event);
        } else onKey(event);
        dirty = true;
      }
    },
    frame(seconds) {
      if (!running || (!dirty && !animate)) return;
      ui.begin();
      draw(ui, seconds);
      io.write(screen.render());
      dirty = false;
    },
  };
  return program;
}
