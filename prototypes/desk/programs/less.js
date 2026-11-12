import { STYLE } from '../tty/widgets.js';
import { runFullScreen } from './full-screen.js';
import { expandRows, markdownToRows, textToRows } from './document.js';

const MARGIN = 2;

// A pager: j/k or arrows scroll, space/b page, g/G jump, / searches, n repeats, q quits.
export function createLess(io, { title, text, markdown = false, baseUrl = new URL(location.href) }) {
  const width = io.columns - MARGIN * 2;
  let program = null;
  const sourceRows = markdown ? markdownToRows(text, width, baseUrl, () => program?.invalidate()) : textToRows(text, width);
  let top = 0;
  let prompt = null;
  let lastSearch = '';
  let message = '';
  const viewHeight = io.rows - 2;

  const rows = () => expandRows(sourceRows);
  const maxTop = () => Math.max(0, rows().length - viewHeight);
  const scrollBy = (amount) => (top = Math.min(maxTop(), Math.max(0, top + amount)));

  function search(term) {
    const all = rows();
    for (let offset = 1; offset <= all.length; offset += 1) {
      const index = (top + offset) % all.length;
      if (all[index].text?.toLowerCase().includes(term.toLowerCase())) {
        top = Math.min(index, maxTop());
        message = '';
        return;
      }
    }
    message = `Pattern not found: ${term}`;
  }

  program = runFullScreen(io, {
    draw(ui) {
      const { screen } = ui;
      const all = rows();
      for (let line = 0; line < viewHeight; line += 1) {
        const row = all[top + line];
        if (!row) {
          screen.text(0, line, '~', STYLE.dim);
          continue;
        }
        if (row.cells) row.cells.forEach((cell, x) => screen.put(MARGIN + x, line, '▀', { color: cell.top, background: cell.bottom }));
        else screen.text(MARGIN, line, row.text, row.style, width);
      }
      const percent = all.length <= viewHeight ? 100 : Math.round((top / maxTop()) * 100);
      ui.statusBar(io.rows - 2, title, `${top + 1}-${Math.min(all.length, top + viewHeight)}/${all.length}  ${percent}%`);
      if (prompt !== null) {
        screen.text(0, io.rows - 1, `/${prompt}`, STYLE.bright);
        screen.setCursor(prompt.length + 1, io.rows - 1);
      } else if (message) {
        screen.text(1, io.rows - 1, message, STYLE.bright);
      } else {
        ui.keyHints(io.rows - 1, [['j/k', 'scroll'], ['space/b', 'page'], ['g/G', 'top/end'], ['/', 'search'], ['n', 'next'], ['q', 'quit']]);
      }
    },
    onKey(event) {
      message = '';
      if (prompt !== null) {
        if (event.key === 'Enter') {
          lastSearch = prompt;
          prompt = null;
          if (lastSearch) search(lastSearch);
        } else if (event.key === 'Escape') prompt = null;
        else if (event.key === 'Backspace') prompt = prompt.slice(0, -1);
        else if (event.key.length === 1 && !event.ctrl) prompt += event.key;
        return;
      }
      const { key, ctrl } = event;
      if (key === 'q' || key === 'Escape' || (ctrl && key === 'c')) program.quit();
      else if (key === 'j' || key === 'ArrowDown' || key === 'Enter') scrollBy(1);
      else if (key === 'k' || key === 'ArrowUp') scrollBy(-1);
      else if (key === ' ' || key === 'f' || key === 'PageDown' || (ctrl && key === 'f')) scrollBy(viewHeight);
      else if (key === 'b' || key === 'PageUp' || (ctrl && key === 'b')) scrollBy(-viewHeight);
      else if (key === 'd' || (ctrl && key === 'd')) scrollBy(Math.floor(viewHeight / 2));
      else if (key === 'u' || (ctrl && key === 'u')) scrollBy(-Math.floor(viewHeight / 2));
      else if (key === 'g' || key === 'Home') top = 0;
      else if (key === 'G' || key === 'End') top = maxTop();
      else if (key === '/') prompt = '';
      else if (key === 'n' && lastSearch) search(lastSearch);
    },
    onMouse(event) {
      if (event.action === 'wheel') scrollBy(event.delta * 3);
    },
  });
  return program;
}
