// Immediate-mode TUI widgets. A program redraws its widgets every frame into a screen; each widget
// registers the cells it occupies so mouse reports from the terminal reach the right handler.
export const STYLE = {
  normal: {},
  dim: { dim: true },
  bold: { bold: true },
  inverse: { inverse: true },
  bright: { bold: true, color: [232, 255, 240] },
  brightInverse: { bold: true, inverse: true },
  underline: { underline: true },
};

const SLIDER_FILL = '█';
const SLIDER_EMPTY = '░';

export function createUi(screen) {
  let regions = [];
  let captured = null;

  const regionAt = (column, row) => {
    for (let index = regions.length - 1; index >= 0; index -= 1) {
      const region = regions[index];
      if (column >= region.x && column < region.x + region.width && row >= region.y && row < region.y + region.height) return region;
    }
    return null;
  };

  const ui = {
    screen,
    begin() {
      screen.clear();
      regions = [];
    },
    region(rect, handlers) {
      regions.push({ ...rect, ...handlers });
    },
    // Routes a decoded mouse event; a region that receives a press keeps the drag until release.
    handleMouse(event) {
      if (event.action === 'down') {
        captured = regionAt(event.column, event.row);
        captured?.down?.(event);
        return Boolean(captured);
      }
      if (event.action === 'drag') {
        captured?.drag?.(event);
        return Boolean(captured);
      }
      if (event.action === 'up') {
        captured?.up?.(event);
        captured = null;
        return true;
      }
      const target = regionAt(event.column, event.row);
      target?.wheel?.(event);
      return Boolean(target);
    },

    // [ LABEL ], drawn in inverse video when active. Returns the width used.
    button(x, y, label, { active = false, onPress, style = STYLE.normal } = {}) {
      const text = `[ ${label} ]`;
      screen.text(x, y, text, active ? STYLE.brightInverse : style);
      if (onPress) ui.region({ x, y, width: text.length, height: 1 }, { down: onPress });
      return text.length;
    },

    // [x] label
    toggle(x, y, label, on, onToggle, { style = STYLE.normal } = {}) {
      const text = `[${on ? 'x' : ' '}] ${label}`;
      screen.text(x, y, text, on ? STYLE.bright : style);
      if (onToggle) ui.region({ x, y, width: text.length, height: 1 }, { down: onToggle });
      return text.length;
    },

    // LABEL ▕█████░░░░░▏ value — click or drag on the bar sets the value; the wheel steps it.
    slider(x, y, { label, labelWidth = 7, barWidth = 20, value, min, max, step = 1, format = String, selected = false, onChange }) {
      const fraction = max === min ? 0 : (value - min) / (max - min);
      const filled = Math.round(fraction * barWidth);
      screen.text(x, y, `${selected ? '▸' : ' '}${label}`.padEnd(labelWidth + 1), selected ? STYLE.bright : STYLE.dim);
      const barX = x + labelWidth + 2;
      screen.put(barX - 1, y, '▕', STYLE.dim);
      for (let index = 0; index < barWidth; index += 1) {
        screen.put(barX + index, y, index < filled ? SLIDER_FILL : SLIDER_EMPTY, index < filled ? (selected ? STYLE.bright : STYLE.normal) : STYLE.dim);
      }
      screen.put(barX + barWidth, y, '▏', STYLE.dim);
      screen.text(barX + barWidth + 2, y, format(value), selected ? STYLE.bright : STYLE.normal);
      if (onChange) {
        const setFromColumn = (event) => onChange(min + Math.min(1, Math.max(0, (event.column - barX + 0.5) / barWidth)) * (max - min));
        ui.region({ x, y, width: labelWidth + barWidth + 3, height: 1 }, {
          down: setFromColumn,
          drag: setFromColumn,
          wheel: (event) => onChange(value - event.delta * step),
        });
      }
      return labelWidth + barWidth + 14;
    },

    // A full-width inverse bar with left and right aligned text.
    statusBar(y, left, right = '') {
      screen.fill({ x: 0, y, width: screen.columns, height: 1 }, ' ', STYLE.inverse);
      screen.text(1, y, left, STYLE.brightInverse, screen.columns - right.length - 3);
      if (right) screen.text(screen.columns - right.length - 1, y, right, STYLE.inverse);
    },

    // Key hints such as "q quit  j/k scroll", wrapped over as many rows as given.
    keyHints(y, hints, rows = 1) {
      let x = 1;
      let row = y;
      for (const [key, label] of hints) {
        const width = key.length + label.length + 3;
        if (x + width > screen.columns - 1) {
          row += 1;
          x = 1;
          if (row >= y + rows) return;
        }
        screen.text(x, row, key, STYLE.inverse);
        screen.text(x + key.length + 1, row, label, STYLE.dim);
        x += width;
      }
    },

    // A selectable, scrollable list. Click selects, wheel scrolls; returns the scroll offset used.
    list({ x, y, width, height }, items, { selected = 0, scroll = 0, onSelect, onScroll, format = String } = {}) {
      let first = Math.max(0, Math.min(scroll, items.length - height));
      if (selected < first) first = selected;
      if (selected >= first + height) first = selected - height + 1;
      for (let row = 0; row < height; row += 1) {
        const index = first + row;
        if (index >= items.length) break;
        const isSelected = index === selected;
        const text = format(items[index], index).padEnd(width);
        screen.text(x, y + row, text, isSelected ? STYLE.brightInverse : STYLE.normal, width);
      }
      if (items.length > height) {
        const thumb = Math.floor((first / Math.max(1, items.length - height)) * (height - 1));
        for (let row = 0; row < height; row += 1) screen.put(x + width, y + row, row === thumb ? '█' : '│', STYLE.dim);
      }
      ui.region({ x, y, width, height }, {
        down: (event) => {
          const index = first + event.row - y;
          if (index < items.length) onSelect?.(index);
        },
        wheel: (event) => onScroll?.(event.delta * 3),
      });
      return first;
    },

    // Columns of text with a bold header row and a rule under it.
    table(x, y, columns, rows) {
      let column = x;
      for (const { title, width } of columns) {
        screen.text(column, y, title.padEnd(width), STYLE.bold, width);
        column += width + 2;
      }
      const totalWidth = columns.reduce((sum, entry) => sum + entry.width + 2, -2);
      screen.text(x, y + 1, '─'.repeat(totalWidth), STYLE.dim);
      rows.forEach((cells, index) => {
        let cellX = x;
        cells.forEach((cell, cellIndex) => {
          screen.text(cellX, y + 2 + index, String(cell), cellIndex === 0 ? STYLE.bright : STYLE.normal, columns[cellIndex].width);
          cellX += columns[cellIndex].width + 2;
        });
      });
      return rows.length + 2;
    },
  };
  return ui;
}
