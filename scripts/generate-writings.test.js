import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Imports the real implementation. The previous version of this file pasted a
// copy of parseMetadata inline and asserted against the copy, so the actual
// build script could break with every test still green.
import {
  parseFrontmatter,
  readingTimeFrom,
  excerptFrom,
  optimizedName,
  renderPost,
} from './generate-writings.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const POST_000 = path.join(__dirname, '../writing/000/post.md')

describe('parseFrontmatter', () => {
  it('splits frontmatter from content', () => {
    const { metadata, content } = parseFrontmatter(
      '---\ntitle: "Test Post"\ndate: "2025-01-01"\n---\n\n# Test Post\n\nBody.'
    )
    expect(metadata.title).toBe('Test Post')
    expect(metadata.date).toBe('2025-01-01')
    expect(content).toContain('# Test Post')
    expect(content.startsWith('---')).toBe(false)
  })

  it('keeps a --- separator that appears in the body', () => {
    const { content } = parseFrontmatter('---\ntitle: "T"\n---\n\nBefore\n\n---\n\nAfter')
    expect(content).toContain('---')
    expect(content).toContain('After')
  })

  it('falls back to the first heading when there is no frontmatter', () => {
    const { metadata } = parseFrontmatter('# My Title\n\nSome content.')
    expect(metadata.title).toBe('My Title')
  })

  it('keeps colons and brackets in values', () => {
    const { metadata } = parseFrontmatter(
      '---\ntitle: "Test: Special & Characters"\ndescription: "[brackets] and {braces}"\n---\n\nx'
    )
    expect(metadata.title).toBe('Test: Special & Characters')
    expect(metadata.description).toBe('[brackets] and {braces}')
  })
})

describe('readingTimeFrom', () => {
  it('is at least one minute', () => {
    expect(readingTimeFrom('a few words')).toBe(1)
  })

  it('ignores fenced code so a long snippet cannot inflate the estimate', () => {
    const prose = 'word '.repeat(400)
    const withCode = `${prose}\n\n\`\`\`python\n${'x = 1\n'.repeat(500)}\`\`\``
    expect(readingTimeFrom(withCode)).toBe(readingTimeFrom(prose))
  })
})

describe('excerptFrom', () => {
  it('strips markdown syntax', () => {
    const excerpt = excerptFrom('See [this link](https://example.com) and `code` and **bold**.')
    expect(excerpt).toBe('See this link and code and bold.')
    expect(excerpt).not.toContain('](')
    expect(excerpt).not.toContain('**')
  })

  it('skips headings, images, and separators', () => {
    expect(excerptFrom('# Title\n\n![alt](a.png)\n\n---\n\nThe real opening line.')).toBe(
      'The real opening line.'
    )
  })

  it('cuts on a word boundary, not mid-word', () => {
    const excerpt = excerptFrom(`${'alpha '.repeat(60)}omega`, 50)
    expect(excerpt.endsWith('…')).toBe(true)
    expect(excerpt).not.toMatch(/alph…$/)
  })
})

describe('optimizedName', () => {
  it('maps raster sources onto the generated webp', () => {
    expect(optimizedName('a.png')).toBe('a.webp')
    expect(optimizedName('b.JPG')).toBe('b.webp')
    expect(optimizedName('c.jpeg')).toBe('c.webp')
  })

  it('leaves other files alone', () => {
    expect(optimizedName('d.svg')).toBe('d.svg')
    expect(optimizedName('e.gif')).toBe('e.gif')
  })
})

describe('renderPost', () => {
  it('wraps list items in a list', async () => {
    const { html } = await renderPost({ markdown: '- one\n- two\n', slug: '000' })
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>one</li>')
  })

  it('renders constructs the old runtime parser dropped', async () => {
    const { html } = await renderPost({
      markdown: '> quoted\n\n1. first\n2. second\n\n#### deep heading\n',
      slug: '000',
    })
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<ol>')
    expect(html).toContain('<h4')
  })

  it('links bare URLs', async () => {
    const { html } = await renderPost({ markdown: 'see https://example.com now', slug: '000' })
    expect(html).toContain('href="https://example.com"')
  })

  it('resolves relative images against the post folder and points at the webp', async () => {
    const { html } = await renderPost({ markdown: '![A caption](assets/x.png)', slug: '007' })
    expect(html).toContain('src="/writing/007/assets/x.webp"')
    expect(html).toContain('<figcaption>A caption</figcaption>')
    // Caption and alt would otherwise duplicate for screen reader users.
    expect(html).toContain('alt=""')
  })

  it('gives colliding headings distinct ids', async () => {
    const { html, toc } = await renderPost({ markdown: '## Setup\n\n## Setup\n', slug: '000' })
    const ids = toc.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(html).toContain('id="setup"')
    expect(html).toContain('id="setup-1"')
  })

  it('builds a table of contents from h2 and h3 only', async () => {
    const { toc } = await renderPost({
      markdown: '# One\n\n## Two\n\n### Three\n\n#### Four\n',
      slug: '000',
    })
    expect(toc.map((item) => item.level)).toEqual([2, 3])
  })

  it('marks external links safe and does not emit raw HTML from a post', async () => {
    const { html } = await renderPost({
      markdown: '[x](https://example.com)\n\n<script>alert(1)</script>\n',
      slug: '000',
    })
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).not.toContain('<script>')
  })
})

describe('the real post', () => {
  it('still parses and renders', async () => {
    const raw = fs.readFileSync(POST_000, 'utf8')
    const { metadata, content } = parseFrontmatter(raw)
    expect(metadata.title).toBe('Keyboard designing for the egotistical')
    expect(metadata.date).toBeDefined()

    const { html, toc } = await renderPost({ markdown: content, slug: '000' })
    expect(html).toContain('<figure class="post-figure">')
    expect(html).toContain('class="shiki')
    expect(toc.length).toBeGreaterThan(0)
  })

  it('is not modified by reading it', () => {
    const before = fs.readFileSync(POST_000, 'utf8')
    parseFrontmatter(before)
    expect(fs.readFileSync(POST_000, 'utf8')).toBe(before)
  })
})
