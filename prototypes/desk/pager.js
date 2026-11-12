import { SCREEN_WIDTH, SCREEN_HEIGHT } from './computer-model.js';
import { PHOSPHOR, prepareText } from './phosphor.js';

const MARGIN_X = 48;
const TOP = 56;
const LINE_HEIGHT = 34;
const FONT_SIZE = 30;
const VISIBLE_ROWS = Math.floor((SCREEN_HEIGHT - TOP - 70) / LINE_HEIGHT);
const IMAGE_ROWS = 9;

const stripInline = (text) =>
  text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

// Markdown is reduced to blocks: headings, paragraphs, list items, code lines, rules and images.
function parseMarkdown(source, baseUrl) {
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, '');
  const blocks = [];
  let paragraph = [];
  let inCode = false;
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', text: stripInline(paragraph.join(' ')) });
    paragraph = [];
  };
  for (const line of body.split('\n')) {
    if (line.startsWith('```')) {
      flush();
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      blocks.push({ type: 'code', text: line });
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const image = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line.trim());
    if (heading) {
      flush();
      blocks.push({ type: 'heading', text: stripInline(heading[2]).toUpperCase() });
    } else if (image) {
      flush();
      const element = new Image();
      element.src = new URL(image[2], baseUrl).href;
      blocks.push({ type: 'image', image: element, alt: image[1] });
    } else if (/^\s*[-*]\s+/.test(line)) {
      flush();
      blocks.push({ type: 'item', text: stripInline(line.replace(/^\s*[-*]\s+/, '')) });
    } else if (/^---+\s*$/.test(line)) {
      flush();
      blocks.push({ type: 'rule' });
    } else if (line.trim() === '') {
      flush();
    } else {
      paragraph.push(line.trim());
    }
  }
  flush();
  return blocks;
}

function wrap(context, text, width) {
  const rows = [];
  let current = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width > width && current) {
      rows.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) rows.push(current);
  return rows.length ? rows : [''];
}

function layout(context, blocks) {
  context.font = PHOSPHOR.font(FONT_SIZE);
  const width = SCREEN_WIDTH - MARGIN_X * 2;
  const rows = [];
  const blank = () => rows.push({ text: '' });
  for (const block of blocks) {
    if (block.type === 'heading') {
      blank();
      wrap(context, block.text, width).forEach((text) => rows.push({ text, color: '#e8fff0' }));
      blank();
    } else if (block.type === 'paragraph') {
      wrap(context, block.text, width).forEach((text) => rows.push({ text }));
      blank();
    } else if (block.type === 'item') {
      wrap(context, block.text, width - 32).forEach((text, index) => rows.push({ text: `${index === 0 ? '* ' : '  '}${text}` }));
    } else if (block.type === 'plain') {
      if (!block.text.trim()) blank();
      else {
        const indent = block.text.match(/^\s*/)[0];
        wrap(context, block.text, width).forEach((text, index) => rows.push({ text: index === 0 ? indent + text : `${indent}  ${text}` }));
      }
    } else if (block.type === 'code') {
      rows.push({ text: `  ${block.text}`, color: PHOSPHOR.dim });
    } else if (block.type === 'rule') {
      rows.push({ text: '-'.repeat(48), color: PHOSPHOR.dim });
    } else if (block.type === 'image') {
      rows.push({ image: block.image });
      for (let index = 1; index < IMAGE_ROWS; index += 1) rows.push({ imageContinuation: true });
      if (block.alt) wrap(context, `[${stripInline(block.alt)}]`, width).forEach((text) => rows.push({ text, color: PHOSPHOR.dim }));
      blank();
    }
  }
  return rows;
}

function drawTintedImage(context, image, x, y, maxWidth, maxHeight) {
  if (!image.complete || !image.naturalWidth) {
    prepareText(context, FONT_SIZE, PHOSPHOR.dim);
    context.fillText('[loading image]', x, y + LINE_HEIGHT);
    return;
  }
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.save();
  context.shadowBlur = 0;
  context.filter = 'grayscale(1) contrast(1.2)';
  context.drawImage(image, x, y, width, height);
  context.filter = 'none';
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = PHOSPHOR.foreground;
  context.fillRect(x, y, width, height);
  context.restore();
}

export function createPager({ close }) {
  let title = '';
  let blocks = [];
  let rows = null;
  let top = 0;
  let status = '';

  const maxTop = () => Math.max(0, (rows?.length ?? 0) - VISIBLE_ROWS);
  const scrollBy = (amount) => (top = Math.min(maxTop(), Math.max(0, top + amount)));

  return {
    async open(post) {
      title = post.title;
      blocks = [];
      rows = null;
      top = 0;
      status = 'loading...';
      try {
        const response = await fetch(post.path);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        blocks = parseMarkdown(await response.text(), new URL(post.path, location.href));
        status = '';
      } catch (error) {
        status = `could not load post: ${error.message}`;
      }
    },
    // Shows text that is already loaded; markdown is rendered, anything else is shown line by line.
    openDocument({ title: documentTitle, text, markdown = false, baseUrl = new URL(location.href) }) {
      title = documentTitle;
      rows = null;
      top = 0;
      status = '';
      blocks = markdown ? parseMarkdown(text, baseUrl) : text.replace(/\n$/, '').split('\n').map((line) => ({ type: 'plain', text: line }));
      if (!blocks.length) blocks = [{ type: 'plain', text: '' }];
    },
    handleKey({ key, code, shift }) {
      if (key === 'q' || code === 'Escape') close();
      else if (code === 'ArrowDown' || key === 'j' || code === 'Enter') scrollBy(1);
      else if (code === 'ArrowUp' || key === 'k') scrollBy(-1);
      else if (code === 'Space' || code === 'PageDown' || key === 'f') scrollBy(shift ? -VISIBLE_ROWS : VISIBLE_ROWS);
      else if (code === 'PageUp' || key === 'b') scrollBy(-VISIBLE_ROWS);
      else if (key === 'g') top = 0;
      else if (key === 'G') top = maxTop();
    },
    handleWheel(_x, _y, deltaY) {
      scrollBy(deltaY > 0 ? 3 : -3);
    },
    draw(context) {
      context.fillStyle = PHOSPHOR.background;
      context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      if (!rows && blocks.length) rows = layout(context, blocks);
      if (status || !rows) {
        prepareText(context, FONT_SIZE);
        context.fillText(status || 'loading...', MARGIN_X, TOP + LINE_HEIGHT);
        return;
      }
      for (let index = 0; index < VISIBLE_ROWS; index += 1) {
        const row = rows[top + index];
        if (!row) break;
        const y = TOP + index * LINE_HEIGHT;
        if (row.image) {
          drawTintedImage(context, row.image, MARGIN_X, y, SCREEN_WIDTH - MARGIN_X * 2, IMAGE_ROWS * LINE_HEIGHT - 8);
        } else if (row.text) {
          prepareText(context, FONT_SIZE, row.color ?? PHOSPHOR.foreground);
          context.fillText(row.text, MARGIN_X, y + LINE_HEIGHT - 8);
        }
      }
      // An image that starts above the viewport is redrawn from its first row, clipped, so it scrolls smoothly.
      if (rows[top]?.imageContinuation) {
        let index = top;
        while (index > 0 && !rows[index].image) index -= 1;
        if (rows[index].image) {
          context.save();
          context.beginPath();
          context.rect(0, TOP, SCREEN_WIDTH, VISIBLE_ROWS * LINE_HEIGHT);
          context.clip();
          drawTintedImage(context, rows[index].image, MARGIN_X, TOP + (index - top) * LINE_HEIGHT, SCREEN_WIDTH - MARGIN_X * 2, IMAGE_ROWS * LINE_HEIGHT - 8);
          context.restore();
        }
      }
      const percent = Math.round((top / Math.max(1, maxTop())) * 100);
      context.shadowBlur = 0;
      context.fillStyle = PHOSPHOR.foreground;
      context.fillRect(0, SCREEN_HEIGHT - 52, SCREEN_WIDTH, 40);
      prepareText(context, 26, PHOSPHOR.background);
      context.shadowBlur = 0;
      context.fillText(`${title}  ${percent}%   j/k scroll  space page  g/G top/end  q quit`, MARGIN_X, SCREEN_HEIGHT - 24);
    },
  };
}
