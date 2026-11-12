import { SCREEN_WIDTH, SCREEN_HEIGHT } from './computer-model.js';
import { createTerminalDevice } from './tty/device.js';
import { encodeKey, encodeMouse } from './tty/ansi.js';
import { createFileSystem } from './filesystem.js';
import { createShell } from './programs/shell.js';

const FONT_SIZE = 24;
const OVERSCAN_X = 44;
const OVERSCAN_Y = 30;
const BOOT_LINES = ['RB PERSONAL COMPUTER  BIOS v1.0', '640K OK', '', "type 'help' and press enter.", ''];
const LOADING_COLOR = '#8dffb7';
const BACKGROUND_COLOR = '#06140d';

// The computer's console: a Ghostty terminal device with a stack of programs attached to it like
// processes on a pty. Only the top program receives input; the shell sits at the bottom.
export function createTerminal({ resetScene = () => {} }) {
  const fileSystem = createFileSystem();
  let device = null;
  let failure = null;
  let stack = [];
  let shell = null;
  let mouseCell = null;

  const top = () => stack.at(-1);

  function createIo() {
    return {
      write: (data) => device.write(data),
      get columns() {
        return device.columns;
      },
      get rows() {
        return device.rows;
      },
      exit: () => {},
      // Runs a full-screen program until it exits, like a foreground job.
      spawn: (createProgram) =>
        new Promise((resolve) => {
          const childIo = createIo();
          const child = createProgram(childIo);
          childIo.exit = () => {
            stack = stack.filter((entry) => entry !== child);
            resolve();
          };
          stack.push(child);
          child.start();
        }),
    };
  }

  function boot() {
    device.reset();
    stack = [];
    shell = createShell(createIo(), { fileSystem, resetScene, bootLines: BOOT_LINES });
    stack.push(shell);
    shell.start();
  }

  createTerminalDevice({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, overscanX: OVERSCAN_X, overscanY: OVERSCAN_Y, fontSize: FONT_SIZE })
    .then((created) => {
      device = created;
      boot();
    })
    .catch((error) => {
      failure = error;
      console.error('terminal device failed to start', error);
    });

  return {
    // Called by the scene when the computer powers back on: the session starts over from the BIOS.
    reboot() {
      if (device) boot();
    },
    // Status lines from the desk, for example when a floppy is inserted.
    print(...messages) {
      shell?.notify(messages);
    },
    handleKey(event) {
      if (!device || !top()) return;
      const bytes = encodeKey(event, device.applicationCursorKeys());
      if (bytes) top().input(bytes);
    },
    // Clicks on the CRT reach a program as SGR mouse reports, and only once it has enabled mouse tracking.
    handlePointer(type, x, y, { shift = false } = {}) {
      if (!device || !top() || !device.mouseTracking()) return;
      if (type === 'down') {
        mouseCell = device.cellAt(x, y);
        top().input(encodeMouse({ button: 0, ...mouseCell, shift }));
      } else if (type === 'move' && mouseCell && x !== undefined) {
        if (!device.mouseMotion()) return;
        const cell = device.cellAt(x, y);
        if (cell.column === mouseCell.column && cell.row === mouseCell.row) return;
        mouseCell = cell;
        top().input(encodeMouse({ button: 32, ...cell, shift }));
      } else if (type === 'up' && mouseCell) {
        const cell = x === undefined ? mouseCell : device.cellAt(x, y);
        top().input(encodeMouse({ button: 0, ...cell, release: true, shift }));
        mouseCell = null;
      }
    },
    handleWheel(x, y, deltaY) {
      if (!device || !top()) return;
      if (device.mouseTracking()) top().input(encodeMouse({ button: deltaY < 0 ? 64 : 65, ...device.cellAt(x, y) }));
      else device.scrollLines(deltaY < 0 ? -3 : 3);
    },
    draw(context, seconds) {
      if (!device) {
        context.fillStyle = BACKGROUND_COLOR;
        context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        context.fillStyle = LOADING_COLOR;
        context.font = '28px VT323, monospace';
        context.fillText(failure ? `terminal failed to start: ${failure.message}` : 'starting terminal...', 40, 60);
        return;
      }
      top()?.frame?.(seconds);
      device.draw(context);
    },
  };
}
