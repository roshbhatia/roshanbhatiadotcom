import { STYLE } from '../tty/widgets.js';
import { displayPath, normalizePath } from '../filesystem.js';
import { runFullScreen } from './full-screen.js';

const UNDO_LIMIT = 100;
const isWordCharacter = (character) => /\w/.test(character ?? '');

// A modal editor covering the commonly used subset of vi, drawn as a terminal program.
export function createVi(io, { path: initialPath, fileSystem }) {
  let path = initialPath;
  let lines = ['loading...'];
  let row = 0;
  let column = 0;
  let top = 0;
  let left = 0;
  let mode = 'normal';
  let commandText = '';
  let pending = '';
  let message = '';
  let dirty = false;
  let register = null;
  let lastSearch = '';
  const undoStack = [];
  const textRows = io.rows - 2;
  const textWidth = io.columns;

  const currentLine = () => lines[row];
  const maxColumn = () => Math.max(0, currentLine().length - (mode === 'insert' ? 0 : 1));
  const resolveName = (name) => normalizePath(path.slice(0, path.lastIndexOf('/')) || '/', name);

  function clamp() {
    row = Math.min(Math.max(0, row), lines.length - 1);
    column = Math.min(Math.max(0, column), maxColumn());
  }

  function snapshot() {
    undoStack.push({ lines: [...lines], row, column });
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  }

  function edit(change) {
    snapshot();
    change();
    dirty = true;
  }

  function enterInsert(prepare) {
    snapshot();
    prepare?.();
    mode = 'insert';
    clamp();
  }

  function moveWord(direction) {
    const text = currentLine();
    if (direction > 0) {
      let index = column;
      const startIsWord = isWordCharacter(text[index]);
      while (index < text.length && isWordCharacter(text[index]) === startIsWord && text[index] !== ' ') index += 1;
      while (index < text.length && text[index] === ' ') index += 1;
      if (index >= text.length && row < lines.length - 1) {
        row += 1;
        column = currentLine().search(/\S|$/);
      } else column = index;
    } else {
      let index = column - 1;
      while (index > 0 && text[index] === ' ') index -= 1;
      if (index < 0 && row > 0) {
        row -= 1;
        column = Math.max(0, currentLine().length - 1);
        return;
      }
      const isWord = isWordCharacter(text[index]);
      while (index > 0 && isWordCharacter(text[index - 1]) === isWord && text[index - 1] !== ' ') index -= 1;
      column = Math.max(0, index);
    }
  }

  function search(term) {
    if (!term) return;
    for (let offset = 0; offset <= lines.length; offset += 1) {
      const index = (row + offset) % lines.length;
      const found = lines[index].indexOf(term, offset === 0 ? column + 1 : 0);
      if (found !== -1) {
        row = index;
        column = found;
        message = `/${term}`;
        return;
      }
    }
    message = `E486: Pattern not found: ${term}`;
  }

  function writeFile(target) {
    if (!fileSystem.write(target, `${lines.join('\n')}\n`)) {
      message = `E212: Can't open file for writing: ${displayPath(target)}`;
      return false;
    }
    path = target;
    dirty = false;
    message = `"${displayPath(target)}" ${lines.length}L written`;
    return true;
  }

  function runCommand(text) {
    const [name, argument] = text.trim().split(/\s+/);
    const target = argument ? resolveName(argument) : path;
    if (/^\d+$/.test(name)) {
      row = Number(name) - 1;
      column = 0;
    } else if (name === 'w') writeFile(target);
    else if (name === 'wq' || name === 'x') {
      if (!dirty && name === 'x') program.quit();
      else if (writeFile(target)) program.quit();
    } else if (name === 'q') {
      if (dirty) message = 'E37: No write since last change (add ! to override)';
      else program.quit();
    } else if (name === 'q!') program.quit();
    else if (name) message = `E492: Not an editor command: ${text}`;
  }

  function handleNormal({ key, ctrl }) {
    if (ctrl) {
      if (key === 'f') row += textRows;
      else if (key === 'b') row -= textRows;
      else if (key === 'd') row += Math.floor(textRows / 2);
      else if (key === 'u') row -= Math.floor(textRows / 2);
      return;
    }
    const combined = pending + key;
    pending = '';
    if (combined === 'dd') {
      edit(() => {
        register = currentLine();
        lines.splice(row, 1);
        if (!lines.length) lines.push('');
      });
      return;
    }
    if (combined === 'yy') {
      register = currentLine();
      message = '1 line yanked';
      return;
    }
    if (combined === 'gg') {
      row = 0;
      column = 0;
      return;
    }
    switch (key) {
      case 'h':
      case 'ArrowLeft':
        column -= 1;
        break;
      case 'l':
      case 'ArrowRight':
        column += 1;
        break;
      case 'j':
      case 'ArrowDown':
        row += 1;
        break;
      case 'k':
      case 'ArrowUp':
        row -= 1;
        break;
      case '0':
      case 'Home':
        column = 0;
        break;
      case '$':
      case 'End':
        column = currentLine().length;
        break;
      case 'w':
        moveWord(1);
        break;
      case 'b':
        moveWord(-1);
        break;
      case 'G':
        row = lines.length - 1;
        break;
      case 'x':
        if (currentLine().length) edit(() => (lines[row] = currentLine().slice(0, column) + currentLine().slice(column + 1)));
        break;
      case 'p':
        if (register !== null) edit(() => lines.splice((row += 1), 0, register));
        break;
      case 'P':
        if (register !== null) edit(() => lines.splice(row, 0, register));
        break;
      case 'u': {
        const previous = undoStack.pop();
        if (previous) ({ lines, row, column } = previous);
        else message = 'Already at oldest change';
        break;
      }
      case 'i':
        enterInsert();
        break;
      case 'a':
        enterInsert(() => (column += currentLine().length ? 1 : 0));
        break;
      case 'I':
        enterInsert(() => (column = currentLine().search(/\S|$/)));
        break;
      case 'A':
        enterInsert(() => (column = currentLine().length));
        break;
      case 'o':
        enterInsert(() => {
          lines.splice((row += 1), 0, '');
          column = 0;
          dirty = true;
        });
        break;
      case 'O':
        enterInsert(() => {
          lines.splice(row, 0, '');
          column = 0;
          dirty = true;
        });
        break;
      case 'n':
        search(lastSearch);
        break;
      case ':':
      case '/':
        mode = key === ':' ? 'command' : 'search';
        commandText = '';
        message = '';
        break;
      case 'd':
      case 'y':
      case 'g':
        pending = key;
        break;
      default:
        break;
    }
  }

  function handleInsert({ key, ctrl }) {
    const text = currentLine();
    if (key === 'Escape' || (ctrl && key === 'c')) {
      mode = 'normal';
      column -= 1;
    } else if (key === 'Enter') {
      lines.splice(row, 1, text.slice(0, column), text.slice(column));
      row += 1;
      column = 0;
      dirty = true;
    } else if (key === 'Backspace') {
      if (column > 0) {
        lines[row] = text.slice(0, column - 1) + text.slice(column);
        column -= 1;
      } else if (row > 0) {
        column = lines[row - 1].length;
        lines.splice(row - 1, 2, lines[row - 1] + text);
        row -= 1;
      }
      dirty = true;
    } else if (key === 'Tab') {
      lines[row] = `${text.slice(0, column)}  ${text.slice(column)}`;
      column += 2;
      dirty = true;
    } else if (key === 'ArrowLeft') column -= 1;
    else if (key === 'ArrowRight') column += 1;
    else if (key === 'ArrowUp') row -= 1;
    else if (key === 'ArrowDown') row += 1;
    else if (key.length === 1 && !ctrl) {
      lines[row] = text.slice(0, column) + key + text.slice(column);
      column += 1;
      dirty = true;
    }
  }

  function handlePrompt({ key, ctrl }) {
    if (key === 'Escape' || (ctrl && key === 'c') || (key === 'Backspace' && !commandText)) mode = 'normal';
    else if (key === 'Enter') {
      const promptMode = mode;
      mode = 'normal';
      if (promptMode === 'command') runCommand(commandText);
      else {
        lastSearch = commandText;
        search(lastSearch);
      }
    } else if (key === 'Backspace') commandText = commandText.slice(0, -1);
    else if (key.length === 1 && !ctrl) commandText += key;
  }

  const program = runFullScreen(io, {
    draw(ui) {
      const { screen } = ui;
      if (row < top) top = row;
      if (row >= top + textRows) top = row - textRows + 1;
      if (column < left) left = column;
      if (column >= left + textWidth) left = column - textWidth + 1;
      for (let index = 0; index < textRows; index += 1) {
        const lineIndex = top + index;
        if (lineIndex >= lines.length) screen.text(0, index, '~', STYLE.dim);
        else screen.text(0, index, lines[lineIndex].slice(left, left + textWidth));
      }
      ui.statusBar(io.rows - 2, `${displayPath(path)}${dirty ? ' [+]' : ''}`, `${row + 1},${column + 1}  ${mode === 'insert' ? 'INSERT' : 'NORMAL'}`);
      const bottom = mode === 'insert' ? '-- INSERT --' : mode === 'command' ? `:${commandText}` : mode === 'search' ? `/${commandText}` : message;
      screen.text(0, io.rows - 1, bottom, mode === 'insert' ? STYLE.bright : STYLE.normal);
      if (mode === 'command' || mode === 'search') screen.setCursor(commandText.length + 1, io.rows - 1);
      else screen.setCursor(column - left, row - top);
    },
    onKey(event) {
      if (mode === 'insert') handleInsert(event);
      else if (mode === 'command' || mode === 'search') handlePrompt(event);
      else handleNormal(event);
      clamp();
    },
    onMouse(event) {
      if (event.action === 'wheel') row += event.delta * 3;
      else if (event.action === 'down' && event.row < textRows) {
        row = top + event.row;
        column = left + event.column;
      }
      clamp();
    },
  });

  const start = program.start;
  program.start = async () => {
    start();
    const node = fileSystem.stat(path);
    if (node?.type === 'dir') {
      lines = [''];
      message = `"${displayPath(path)}" is a directory`;
    } else if (!node) {
      lines = [''];
      message = `"${displayPath(path)}" [New]`;
    } else {
      try {
        lines = (await fileSystem.read(path)).replace(/\n$/, '').split('\n');
        message = `"${displayPath(path)}" ${lines.length}L`;
      } catch (error) {
        lines = [''];
        message = `"${displayPath(path)}" ${error.message}`;
      }
    }
    clamp();
    program.invalidate();
  };
  return program;
}
