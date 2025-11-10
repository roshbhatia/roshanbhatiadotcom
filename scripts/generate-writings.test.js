import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Helper to parse metadata (extracted from generate-writings.js)
function parseMetadata(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
  const match = content.match(frontmatterRegex)

  if (match) {
    const frontmatter = match[1]
    const markdownContent = content.slice(match[0].length)

    const metadata = {}
    frontmatter.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim()
        const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '')
        metadata[key] = value
      }
    })

    return { metadata, content: markdownContent }
  }

  const titleMatch = content.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1] : 'Untitled'

  return {
    metadata: { title },
    content
  }
}

describe('Build Script - Frontmatter Parsing', () => {
  it('should parse YAML frontmatter correctly', () => {
    const content = `---
title: "Test Post"
date: "2025-01-01"
description: "Test description"
---

# Test Post

This is test content.`

    const result = parseMetadata(content)

    expect(result.metadata.title).toBe('Test Post')
    expect(result.metadata.date).toBe('2025-01-01')
    expect(result.metadata.description).toBe('Test description')
    expect(result.content).toContain('# Test Post')
    expect(result.content).not.toContain('---')
  })

  it('should not modify original content after frontmatter', () => {
    const originalContent = `# Test Post

This is a test paragraph with **bold** and *italic* text.

\`\`\`python
print("Hello, world!")
\`\`\`

More content here.`

    const contentWithFrontmatter = `---
title: "Test Post"
---

${originalContent}`

    const result = parseMetadata(contentWithFrontmatter)

    expect(result.content).toBe(originalContent)
  })

  it('should handle content without frontmatter', () => {
    const content = `# My Title

Some content here.`

    const result = parseMetadata(content)

    expect(result.metadata.title).toBe('My Title')
    expect(result.content).toBe(content)
  })

  it('should not modify code blocks in content', () => {
    const codeContent = `\`\`\`python
from kmk.kmk_keyboard import KMKKeyboard
print("Test")
\`\`\``

    const fullContent = `---
title: "Code Test"
---

# Code Test

${codeContent}`

    const result = parseMetadata(fullContent)

    expect(result.content).toContain(codeContent)
  })

  it('should handle special characters in metadata values', () => {
    const content = `---
title: "Test: Special & Characters"
description: "A post with [brackets] and {braces}"
---

Content here.`

    const result = parseMetadata(content)

    expect(result.metadata.title).toBe('Test: Special & Characters')
    expect(result.metadata.description).toBe('A post with [brackets] and {braces}')
  })
})

describe('Build Script - File Safety', () => {
  const testWritingDir = path.join(__dirname, '../writing/000')
  const testPostPath = path.join(testWritingDir, 'post.md')
  let originalContent = ''
  let originalMtime = null

  beforeEach(() => {
    // Read original file before test
    if (fs.existsSync(testPostPath)) {
      originalContent = fs.readFileSync(testPostPath, 'utf8')
      const stats = fs.statSync(testPostPath)
      originalMtime = stats.mtimeMs
    }
  })

  afterEach(() => {
    // Verify file hasn't been modified
    if (fs.existsSync(testPostPath)) {
      const currentContent = fs.readFileSync(testPostPath, 'utf8')
      expect(currentContent).toBe(originalContent)
    }
  })

  it('should not modify source markdown files when reading', () => {
    if (!fs.existsSync(testPostPath)) {
      return
    }

    // Read the file (simulating what the build script does)
    const content = fs.readFileSync(testPostPath, 'utf8')

    // Parse it
    const result = parseMetadata(content)

    // Verify we got data
    expect(result.metadata).toBeDefined()
    expect(result.content).toBeDefined()
  })

  it('should find post.md file in writing/000 directory', () => {
    expect(fs.existsSync(testWritingDir)).toBe(true)
    expect(fs.existsSync(testPostPath)).toBe(true)
  })

  it('should have valid frontmatter in post.md', () => {
    if (!fs.existsSync(testPostPath)) {
      return
    }

    const content = fs.readFileSync(testPostPath, 'utf8')
    const result = parseMetadata(content)

    expect(result.metadata.title).toBeDefined()
    expect(result.metadata.title).toBe('Keyboard designing for the egotistical')
    expect(result.metadata.date).toBeDefined()
  })
})

describe('Build Script - Content Integrity', () => {
  it('should preserve image paths in markdown', () => {
    const content = `---
title: "Test"
---

# Test

![Alt text](assets/image.png)

![Another image](assets/subfolder/image2.jpg)`

    const result = parseMetadata(content)

    expect(result.content).toContain('![Alt text](assets/image.png)')
    expect(result.content).toContain('![Another image](assets/subfolder/image2.jpg)')
  })

  it('should preserve links in markdown', () => {
    const content = `---
title: "Test"
---

Check out [this link](https://example.com) and [another](https://test.com).`

    const result = parseMetadata(content)

    expect(result.content).toContain('[this link](https://example.com)')
    expect(result.content).toContain('[another](https://test.com)')
  })

  it('should preserve formatting (bold, italic, code)', () => {
    const content = `---
title: "Test"
---

This has **bold**, *italic*, and \`inline code\`.`

    const result = parseMetadata(content)

    expect(result.content).toContain('**bold**')
    expect(result.content).toContain('*italic*')
    expect(result.content).toContain('`inline code`')
  })
})
