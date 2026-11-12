import { SCREEN_WIDTH, SCREEN_HEIGHT } from './computer-model.js';
import { PHOSPHOR, prepareText } from './phosphor.js';
import { displayPath, normalizePath } from './filesystem.js';

const MARGIN_X = 40;
const TOP = 34;
const LINE_HEIGHT = 34;
const FONT_SIZE = 30;
const TEXT_ROWS = Math.floor((SCREEN_HEIGHT - TOP - 2 * LINE_HEIGHT - 16) / LINE_HEIGHT);
const UNDO_LIMIT = 100;

const isWordCharacter = (character) => /\w/.test(character ?? '');

// A small modal editor covering the commonly used subset of vi.
export function createVi({ close, fileSystem }) {
  let path = '';
  let lines = [''];
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
  let characterWidth = 0;
  const undoStack = [];

  const currentLine = () => lines[row];
  const maxColumn = () => Math.max(0, currentLine().length - (mode === 'insert' ? 0 : 1));

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

  function search(term, fromNext = true) {
    if (!term) return;
    for (let offset = 0; offset <= lines.length; offset += 1) {
      const index = (row + offset) % lines.length;
      const start = offset === 0 ? column + (fromNext ? 1 : 0) : 0;
      const found = lines[index].indexOf(term, start);
      if (found !== -1) {
        row = index;
        column = found;
        message = `/${term}`;
        return;
      }
    }
    message = `E486: Pattern not found: ${term}`;
  }

  function writeFile(target = path) {
    const resolved = target;
    const ok = fileSystem.write(resolved, `${lines.join('\n')}\n`);
    if (!ok) {
      message = `E212: Can't open file for writing: ${displayPath(resolved)}`;
      return false;
    }
    path = resolved;
    dirty = false;
    message = `"${displayPath(resolved)}" ${lines.length}L written`;
    return true;
  }

  const resolveName = (name) => normalizePath(path.slice(0, path.lastIndexOf('/')) || '/', name);

  function runCommand(text) {
    const [name, argument] = text.trim().split(/\s+/);
    if (/^\d+$/.test(name)) {
      row = Number(name) - 1;
      column = 0;
    } else if (name === 'w') writeFile(argument ? resolveName(argument) : path);
    else if (name === 'wq' || name === 'x') {
      if (!dirty && name === 'x') close();
      else if (writeFile(argument ? resolveName(argument) : path)) close();
    } else if (name === 'q') {
      if (dirty) message = 'E37: No write since last change (add ! to override)';
      else close();
    } else if (name === 'q!') close();
    else if (name) message = `E492: Not an editor command: ${text}`;
  }

  function handleNormal(key) {
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
        if (previous) ({ lines, row, column } = { ...previous, lines: previous.lines });
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

  function handleInsert(key) {
    const text = currentLine();
    if (key === 'Escape') {
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
    else if (key.length === 1) {
      lines[row] = text.slice(0, column) + key + text.slice(column);
      column += 1;
      dirty = true;
    }
  }

  function handlePrompt(key) {
    if (key === 'Escape' || (key === 'Backspace' && !commandText)) {
      mode = 'normal';
    } else if (key === 'Enter') {
      const promptMode = mode;
      mode = 'normal';
      if (promptMode === 'command') runCommand(commandText);
      else {
        lastSearch = commandText;
        search(lastSearch);
      }
    } else if (key === 'Backspace') {
      commandText = commandText.slice(0, -1);
    } else if (key.length === 1) {
      commandText += key;
    }
  }

  function scrollIntoView(columns) {
    if (row < top) top = row;
    if (row >= top + TEXT_ROWS) top = row - TEXT_ROWS + 1;
    if (column < left) left = column;
    if (column >= left + columns) left = column - columns + 1;
  }

  return {
    async open(targetPath) {
      path = targetPath;
      mode = 'normal';
      row = column = top = left = 0;
      pending = commandText = '';
      undoStack.length = 0;
      dirty = false;
      const node = fileSystem.stat(path);
      if (node?.type === 'dir') {
        lines = [''];
        message = `"${displayPath(path)}" is a directory`;
        return;
      }
      if (!node) {
        lines = [''];
        message = `"${displayPath(path)}" [New]`;
        return;
      }
      lines = ['loading...'];
      try {
        const content = await fileSystem.read(path);
        lines = content.replace(/\n$/, '').split('\n');
        message = `"${displayPath(path)}" ${lines.length}L`;
      } catch (error) {
        lines = [''];
        message = `"${displayPath(path)}" ${error.message}`;
      }
    },
    handleKey({ key }) {
      if (mode === 'insert') handleInsert(key);
      else if (mode === 'command' || mode === 'search') handlePrompt(key);
      else handleNormal(key);
      clamp();
    },
    handleWheel(_x, _y, deltaY) {
      row += deltaY > 0 ? 3 : -3;
      clamp();
    },
    draw(context, seconds) {
      context.fillStyle = PHOSPHOR.background;
      context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      prepareText(context, FONT_SIZE);
      characterWidth ||= context.measureText('M').width;
      const columns = Math.floor((SCREEN_WIDTH - MARGIN_X * 2) / characterWidth);
      scrollIntoView(columns);

      for (let index = 0; index < TEXT_ROWS; index += 1) {
        const lineIndex = top + index;
        const y = TOP + (index + 1) * LINE_HEIGHT - 8;
        if (lineIndex >= lines.length) {
          prepareText(context, FONT_SIZE, PHOSPHOR.dim);
          context.fillText('~', MARGIN_X, y);
          continue;
        }
        prepareText(context, FONT_SIZE);
        context.fillText(lines[lineIndex].slice(left, left + columns), MARGIN_X, y);
      }

      if (mode === 'normal' || mode === 'insert') {
        const cursorX = MARGIN_X + (column - left) * characterWidth;
        const cursorY = TOP + (row - top) * LINE_HEIGHT + 4;
        const blink = Math.floor(seconds * 2) % 2 === 0;
        context.shadowBlur = 0;
        context.fillStyle = PHOSPHOR.foreground;
        if (mode === 'insert') context.fillRect(cursorX, cursorY, 3, LINE_HEIGHT - 4);
        else if (blink) {
          context.fillRect(cursorX, cursorY, characterWidth, LINE_HEIGHT - 4);
          context.fillStyle = PHOSPHOR.background;
          context.font = PHOSPHOR.font(FONT_SIZE);
          context.fillText(currentLine()[column] ?? '', cursorX, TOP + (row - top + 1) * LINE_HEIGHT - 8);
        }
      }

      const statusY = SCREEN_HEIGHT - 2 * LINE_HEIGHT - 12;
      context.shadowBlur = 0;
      context.fillStyle = PHOSPHOR.foreground;
      context.fillRect(0, statusY, SCREEN_WIDTH, LINE_HEIGHT);
      prepareText(context, 26, PHOSPHOR.background);
      context.shadowBlur = 0;
      context.fillText(`${displayPath(path) || '[No Name]'}${dirty ? ' [+]' : ''}`, MARGIN_X, statusY + 25);
      context.textAlign = 'right';
      context.fillText(`${row + 1},${column + 1}`, SCREEN_WIDTH - MARGIN_X, statusY + 25);

      prepareText(context, FONT_SIZE);
      const bottomLine =
        mode === 'insert' ? '-- INSERT --' : mode === 'command' ? `:${commandText}` : mode === 'search' ? `/${commandText}` : message;
      context.fillText(bottomLine, MARGIN_X, SCREEN_HEIGHT - 26);
    },
  };
}
