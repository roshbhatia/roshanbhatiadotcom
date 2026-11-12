import { STYLE } from '../tty/widgets.js';

const PHOSPHOR_DARK = [6, 20, 13];
const PHOSPHOR_LIGHT = [168, 255, 201];
const MAX_IMAGE_ROWS = 14;

const stripInline = (text) =>
  text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

function wrap(text, width) {
  const rows = [];
  let current = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > width && current) {
      rows.push(current);
      current = word;
    } else current = candidate;
    while (current.length > width) {
      rows.push(current.slice(0, width));
      current = current.slice(width);
    }
  }
  if (current) rows.push(current);
  return rows.length ? rows : [''];
}

// Converts an image into rows of upper-half-block cells: each cell shows two vertical pixels,
// the top as the foreground color and the bottom as the background, tinted to the phosphor.
function createImageBlock(url, width, onReady) {
  const block = { rows: 0, cells: null };
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    const pixelRows = Math.min(MAX_IMAGE_ROWS * 2, Math.round((width * image.naturalHeight) / image.naturalWidth));
    const columns = Math.max(1, Math.round((pixelRows * image.naturalWidth) / image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = columns;
    canvas.height = pixelRows;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, columns, pixelRows);
    const pixels = context.getImageData(0, 0, columns, pixelRows).data;
    const tint = (x, y) => {
      if (y >= pixelRows) return PHOSPHOR_DARK;
      const index = (y * columns + x) * 4;
      const luminance = (0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2]) / 255;
      return PHOSPHOR_DARK.map((dark, channel) => Math.round(dark + (PHOSPHOR_LIGHT[channel] - dark) * luminance));
    };
    block.cells = [];
    for (let y = 0; y < pixelRows; y += 2) {
      block.cells.push(Array.from({ length: columns }, (_, x) => ({ top: tint(x, y), bottom: tint(x, y + 1) })));
    }
    block.rows = block.cells.length;
    onReady();
  };
  image.onerror = () => {
    block.failed = true;
    onReady();
  };
  image.src = url;
  return block;
}

// A document is a list of rows; each row is text with one style, or one row of an image block.
export function markdownToRows(source, width, baseUrl, onImageReady) {
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, '');
  const rows = [];
  const blank = () => rows.push({ text: '', style: STYLE.normal });
  let paragraph = [];
  let inCode = false;
  const flush = () => {
    if (paragraph.length) {
      wrap(stripInline(paragraph.join(' ')), width).forEach((text) => rows.push({ text, style: STYLE.normal }));
      blank();
    }
    paragraph = [];
  };
  for (const line of body.split('\n')) {
    if (line.startsWith('```')) {
      flush();
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      rows.push({ text: `│ ${line}`.slice(0, width), style: STYLE.dim });
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const image = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line.trim());
    if (heading) {
      flush();
      const text = stripInline(heading[2]);
      rows.push({ text: heading[1].length === 1 ? text.toUpperCase() : text, style: STYLE.bright });
      rows.push({ text: (heading[1].length === 1 ? '═' : '─').repeat(Math.min(width, text.length)), style: STYLE.dim });
    } else if (image) {
      flush();
      const block = createImageBlock(new URL(image[2], baseUrl).href, width, onImageReady);
      rows.push({ image: block });
      if (image[1]) wrap(`[${stripInline(image[1])}]`, width).forEach((text) => rows.push({ text, style: STYLE.dim }));
      blank();
    } else if (/^\s*[-*]\s+/.test(line)) {
      flush();
      wrap(stripInline(line.replace(/^\s*[-*]\s+/, '')), width - 2).forEach((text, index) => rows.push({ text: `${index === 0 ? '•' : ' '} ${text}`, style: STYLE.normal }));
    } else if (/^---+\s*$/.test(line)) {
      flush();
      rows.push({ text: '─'.repeat(width), style: STYLE.dim });
    } else if (line.trim() === '') {
      flush();
    } else paragraph.push(line.trim());
  }
  flush();
  return rows;
}

export function textToRows(text, width) {
  return text
    .replace(/\n$/, '')
    .split('\n')
    .flatMap((line) => (line.length <= width ? [line] : wrap(line, width)))
    .map((line) => ({ text: line, style: STYLE.normal }));
}

// Expands image rows into one entry per terminal row, so scrolling works in rows.
export function expandRows(rows) {
  const expanded = [];
  for (const row of rows) {
    if (!row.image) expanded.push(row);
    else if (row.image.failed) expanded.push({ text: '[image could not be loaded]', style: STYLE.dim });
    else if (!row.image.cells) expanded.push({ text: '[loading image...]', style: STYLE.dim });
    else row.image.cells.forEach((cells) => expanded.push({ cells }));
  }
  return expanded;
}
