import { ansi, styleToSgr } from './ansi.js';

const EMPTY_STYLE = Object.freeze({});
const BORDERS = {
  single: { topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘', horizontal: '─', vertical: '│' },
  double: { topLeft: '╔', topRight: '╗', bottomLeft: '╚', bottomRight: '╝', horizontal: '═', vertical: '║' },
  rounded: { topLeft: '╭', topRight: '╮', bottomLeft: '╰', bottomRight: '╯', horizontal: '─', vertical: '│' },
};

const styleKey = (style) =>
  `${style.bold ? 'b' : ''}${style.dim ? 'd' : ''}${style.underline ? 'u' : ''}${style.inverse ? 'i' : ''}${style.color ?? ''}|${style.background ?? ''}`;

// An off-screen grid of cells. Programs draw into it, then render() emits only the escape sequences
// needed to turn the terminal's current contents into the new frame.
export function createScreen(columns, rows) {
  const size = columns * rows;
  const characters = new Array(size).fill(' ');
  const styles = new Array(size).fill(EMPTY_STYLE);
  let previousCharacters = null;
  let previousStyleKeys = null;
  let cursor = null;

  const inBounds = (x, y) => x >= 0 && y >= 0 && x < columns && y < rows;

  const screen = {
    columns,
    rows,
    clear() {
      characters.fill(' ');
      styles.fill(EMPTY_STYLE);
      cursor = null;
    },
    put(x, y, character, style = EMPTY_STYLE) {
      if (!inBounds(x, y)) return;
      characters[y * columns + x] = character;
      styles[y * columns + x] = style;
    },
    // Writes text clipped to maxWidth columns and returns the number of columns used.
    text(x, y, value, style = EMPTY_STYLE, maxWidth = columns - x) {
      const glyphs = [...String(value)].slice(0, Math.max(0, maxWidth));
      glyphs.forEach((glyph, offset) => screen.put(x + offset, y, glyph, style));
      return glyphs.length;
    },
    fill({ x, y, width, height }, character = ' ', style = EMPTY_STYLE) {
      for (let row = y; row < y + height; row += 1) {
        for (let column = x; column < x + width; column += 1) screen.put(column, row, character, style);
      }
    },
    box({ x, y, width, height }, { title = '', style = EMPTY_STYLE, titleStyle = style, border = 'single' } = {}) {
      const glyphs = BORDERS[border];
      for (let column = x + 1; column < x + width - 1; column += 1) {
        screen.put(column, y, glyphs.horizontal, style);
        screen.put(column, y + height - 1, glyphs.horizontal, style);
      }
      for (let row = y + 1; row < y + height - 1; row += 1) {
        screen.put(x, row, glyphs.vertical, style);
        screen.put(x + width - 1, row, glyphs.vertical, style);
      }
      screen.put(x, y, glyphs.topLeft, style);
      screen.put(x + width - 1, y, glyphs.topRight, style);
      screen.put(x, y + height - 1, glyphs.bottomLeft, style);
      screen.put(x + width - 1, y + height - 1, glyphs.bottomRight, style);
      if (title) screen.text(x + 2, y, ` ${title} `, titleStyle, width - 4);
      return { x: x + 1, y: y + 1, width: width - 2, height: height - 2 };
    },
    setCursor(x, y) {
      cursor = { x, y };
    },
    invalidate() {
      previousCharacters = null;
      previousStyleKeys = null;
    },
    render() {
      const keys = styles.map(styleKey);
      let output = previousCharacters ? '' : ansi.clearScreen;
      let cursorX = -1;
      let cursorY = -1;
      let activeKey = null;
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
          const index = y * columns + x;
          if (previousCharacters && previousCharacters[index] === characters[index] && previousStyleKeys[index] === keys[index]) continue;
          if (cursorX !== x || cursorY !== y) output += ansi.moveTo(y, x);
          if (activeKey !== keys[index]) {
            output += styleToSgr(styles[index]);
            activeKey = keys[index];
          }
          output += characters[index];
          cursorX = x + 1;
          cursorY = y;
        }
      }
      if (activeKey !== null) output += ansi.reset;
      output += cursor ? ansi.moveTo(cursor.y, cursor.x) + ansi.showCursor : ansi.hideCursor;
      previousCharacters = [...characters];
      previousStyleKeys = keys;
      return output;
    },
    // The frame as standalone lines, for printing a component inline in the shell's scrolling output.
    toLines() {
      const lines = [];
      for (let y = 0; y < rows; y += 1) {
        let line = '';
        let activeKey = '';
        for (let x = 0; x < columns; x += 1) {
          const index = y * columns + x;
          const key = styleKey(styles[index]);
          if (key !== activeKey) {
            line += styleToSgr(styles[index]);
            activeKey = key;
          }
          line += characters[index];
        }
        lines.push(`${line.replace(/\s+$/, '')}${ansi.reset}`);
      }
      return lines;
    },
  };
  return screen;
}
