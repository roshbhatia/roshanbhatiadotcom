// Turns writing/NNN/post.md into src/writings.generated.ts at build time.
//
// Markdown is rendered to HTML here, in Node, rather than by a hand-rolled
// parser in the browser. The old runtime parser emitted <li> with no <ul>,
// dropped blockquotes / tables / ordered lists / nested lists / h4+, only
// matched an image when it was the entire line, and ignored bare URLs. It also
// pulled Shiki into the client bundle, which shipped every language grammar:
// 301 JS chunks and 15 MB of JavaScript for two blog posts.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import GithubSlugger from 'github-slugger';
import { codeToHtml } from 'shiki';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WRITING_DIR = path.join(__dirname, '../writing');
const OUT_FILE = path.join(__dirname, '../src/writings.generated.ts');
const PUBLIC_WRITING_DIR = path.join(__dirname, '../public/writing');

const CODE_THEMES = { light: 'github-light', dark: 'github-dark' };
const WORDS_PER_MINUTE = 200;

// Posts render in a column about 900px wide, so 1600px covers a 2x display.
// The sources are phone photos and retina screenshots up to 2960px and 4.5MB;
// one post shipped 18MB of images before this.
const MAX_IMAGE_WIDTH = 1600;
const RASTER = /\.(png|jpe?g)$/i;

/** Source extensions are rewritten to .webp to match the optimised output. */
export function optimizedName(file) {
  return file.replace(RASTER, '.webp');
}

/** Splits `---` frontmatter off the top of a post. */
export function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) {
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    return { metadata: { title: titleMatch ? titleMatch[1].trim() : 'Untitled' }, content: raw };
  }

  const metadata = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon > 0) {
      const key = line.slice(0, colon).trim();
      metadata[key] = line
        .slice(colon + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  }
  return { metadata, content: raw.slice(match[0].length) };
}

/** Prose word count, excluding fenced code so a long snippet cannot inflate it. */
export function readingTimeFrom(markdown) {
  const prose = markdown.replace(/```[\s\S]*?```/g, ' ');
  const words = prose.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/**
 * First real paragraph as plain text, cut on a word boundary.
 * The old version sliced mid-word and left raw markdown in the excerpt, which
 * then went out as the social preview description.
 */
export function excerptFrom(markdown, limit = 200) {
  const lines = markdown.split('\n');
  let paragraph = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!') || trimmed === '---') {
      continue;
    }
    paragraph = trimmed;
    break;
  }

  const plain = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= limit) return plain;
  const cut = plain.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.]$/, '')}…`;
}

function createRenderer(slug, toc) {
  const md = new MarkdownIt({
    // Posts are trusted input, but there is no reason to allow raw HTML.
    html: false,
    linkify: true,
    breaks: false,
  });

  const slugger = new GithubSlugger();

  // Headings get stable, de-duplicated ids and feed the table of contents.
  // The old id scheme collided whenever two headings shared a name.
  md.renderer.rules.heading_open = (tokens, idx) => {
    const token = tokens[idx];
    const level = Number(token.tag.slice(1));
    const inline = tokens[idx + 1];
    const title = inline && inline.type === 'inline' ? inline.content : '';
    const id = slugger.slug(title || `section-${idx}`);
    token.attrSet('id', id);
    if (level === 2 || level === 3) {
      toc.push({ id, title, level });
    }
    return `<${token.tag} id="${id}">`;
  };

  md.renderer.rules.code_inline = (tokens, idx) =>
    `<code class="inline-code">${md.utils.escapeHtml(tokens[idx].content)}</code>`;

  const defaultLinkOpen =
    md.renderer.rules.link_open ||
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx].attrGet('href') || '';
    tokens[idx].attrJoin('class', 'text-link');
    if (/^https?:\/\//.test(href)) {
      tokens[idx].attrSet('target', '_blank');
      tokens[idx].attrSet('rel', 'noopener noreferrer');
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  // Images become figures. The caption text is also the alt text in these
  // posts, so alt is emptied when a caption is rendered: a screen reader
  // should hear that sentence once, from the caption, not twice.
  md.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx];
    const rawSrc = token.attrGet('src') || '';
    const src = rawSrc.startsWith('/') || /^https?:\/\//.test(rawSrc)
      ? rawSrc
      : `/writing/${slug}/${optimizedName(decodeURI(rawSrc))}`;
    const caption = (token.content || token.attrGet('title') || '').trim();

    const img =
      `<img src="${md.utils.escapeHtml(src)}" alt="${md.utils.escapeHtml(caption ? '' : token.content)}" loading="lazy" decoding="async" />`;

    if (!caption) return `<figure class="post-figure">${img}</figure>`;
    return (
      `<figure class="post-figure">${img}` +
      `<figcaption>${md.utils.escapeHtml(caption)}</figcaption></figure>`
    );
  };

  // Wide tables scroll inside their own box instead of widening the page.
  md.renderer.rules.table_open = () => '<div class="table-scroll"><table>';
  md.renderer.rules.table_close = () => '</table></div>';

  return md;
}

/** Replaces fenced blocks with Shiki output carrying both themes' colours. */
async function highlightFences(html) {
  const fences = [...html.matchAll(/<pre><code(?: class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/g)];
  let result = html;

  for (const fence of fences) {
    const [full, lang, escaped] = fence;
    const code = escaped
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');

    let highlighted;
    try {
      highlighted = await codeToHtml(code, {
        lang: lang || 'text',
        themes: CODE_THEMES,
        defaultColor: false,
      });
    } catch {
      // An unknown language must not fail the build; render it as plain text.
      highlighted = await codeToHtml(code, {
        lang: 'text',
        themes: CODE_THEMES,
        defaultColor: false,
      });
    }

    const label = (lang || 'text').toUpperCase();
    result = result.replace(
      full,
      `<div class="code-block"><div class="code-block-label mono">[${label}]</div>${highlighted}</div>`
    );
  }

  return result;
}

export async function renderPost({ markdown, slug }) {
  const toc = [];
  const md = createRenderer(slug, toc);
  const html = await highlightFences(md.render(markdown));
  return { html, toc };
}

function listPostFolders() {
  return fs
    .readdirSync(WRITING_DIR)
    .filter((entry) => /^\d{3}$/.test(entry) && fs.statSync(path.join(WRITING_DIR, entry)).isDirectory())
    .sort()
    .reverse();
}

async function loadWritings() {
  const writings = [];

  for (const slug of listPostFolders()) {
    const postPath = path.join(WRITING_DIR, slug, 'post.md');
    if (!fs.existsSync(postPath)) continue;

    const { metadata, content } = parseFrontmatter(fs.readFileSync(postPath, 'utf8'));
    if (metadata.draft === 'true') {
      console.log(`Skipping ${slug} (draft)`);
      continue;
    }

    const { html, toc } = await renderPost({ markdown: content, slug });

    writings.push({
      slug,
      title: metadata.title || 'Untitled',
      date: metadata.date || fs.statSync(postPath).mtime.toISOString().slice(0, 10),
      excerpt: excerptFrom(content),
      readingTime: readingTimeFrom(content),
      html,
      toc,
    });
  }

  return writings;
}

async function buildAssets() {
  fs.mkdirSync(PUBLIC_WRITING_DIR, { recursive: true });

  for (const slug of listPostFolders()) {
    const from = path.join(WRITING_DIR, slug, 'assets');
    if (!fs.existsSync(from)) continue;

    const to = path.join(PUBLIC_WRITING_DIR, slug, 'assets');
    fs.rmSync(to, { recursive: true, force: true });
    fs.mkdirSync(to, { recursive: true });

    let sourceBytes = 0;
    let outputBytes = 0;

    for (const file of fs.readdirSync(from)) {
      const source = path.join(from, file);
      if (!fs.statSync(source).isFile()) continue;
      sourceBytes += fs.statSync(source).size;

      if (RASTER.test(file)) {
        const target = path.join(to, optimizedName(file));
        await sharp(source)
          .rotate() // honour EXIF orientation before dropping the metadata
          .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(target);
        outputBytes += fs.statSync(target).size;
      } else {
        fs.copyFileSync(source, path.join(to, file));
        outputBytes += fs.statSync(source).size;
      }
    }

    const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
    console.log(`Assets for ${slug}: ${mb(sourceBytes)}MB source -> ${mb(outputBytes)}MB served`);
  }
}

async function main() {
  const writings = await loadWritings();

  const output = `// Auto-generated by scripts/generate-writings.mjs. Do not edit.
export interface TOCItem {
  id: string
  title: string
  level: number
}

export interface Writing {
  slug: string
  title: string
  date: string
  excerpt: string
  readingTime: number
  /** Rendered at build time; safe to inject. */
  html: string
  toc: TOCItem[]
}

export const writings: Writing[] = ${JSON.stringify(writings, null, 2)}
`;

  fs.writeFileSync(OUT_FILE, output);
  console.log(`Generated ${writings.length} writings`);
  await buildAssets();
}

// Only run when invoked directly, so the tests can import the helpers.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
