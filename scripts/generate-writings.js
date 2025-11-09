const fs = require('fs')
const path = require('path')

// Function to parse metadata from markdown frontmatter
function parseMetadata(content) {
  // Check if content has frontmatter metadata
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
  const match = content.match(frontmatterRegex)
  
  if (match) {
    const frontmatter = match[1]
    const markdownContent = content.slice(match[0].length)
    
    // Parse YAML-like frontmatter
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
  
  // Fallback: extract title from first H1 if no frontmatter
  const titleMatch = content.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1] : 'Untitled'
  
  return { 
    metadata: { title }, 
    content 
  }
}

// Function to load writings from writing folder
function loadWritingsFromFolder() {
  const writingsDir = path.join(__dirname, '../writing')
  const writings = []
  
  // Get all numbered folders (000, 001, 002, etc.)
  const folders = fs.readdirSync(writingsDir)
    .filter(item => {
      const itemPath = path.join(writingsDir, item)
      return fs.statSync(itemPath).isDirectory() && /^\d{3}$/.test(item)
    })
    .sort()
    .reverse() // newest first
  
  for (const folder of folders) {
    const folderPath = path.join(writingsDir, folder)
    const files = fs.readdirSync(folderPath)
    
    // Find post.md file
    const mdFile = files.find(file => file === 'post.md')
    if (!mdFile) continue
    
    const mdPath = path.join(folderPath, mdFile)
    const rawContent = fs.readFileSync(mdPath, 'utf8')
    
    // Parse metadata and content
    const { metadata, content } = parseMetadata(rawContent)
    
    // Create slug from folder name
    const slug = folder
    
    // Use date from metadata or fallback to folder modification time
    let date
    if (metadata.date) {
      date = metadata.date
    } else {
      const stats = fs.statSync(folderPath)
      date = stats.mtime.toISOString().split('T')[0]
    }
    
    // Estimate reading time (rough calculation: 200 words per minute)
    const wordCount = content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)
    
    // Get first paragraph as excerpt
    const lines = content.split('\n')
    let excerpt = ''
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line && !line.startsWith('#')) {
        excerpt = line.substring(0, 200) + (line.length > 200 ? '...' : '')
          break
      }
    }
    
    writings.push({
      slug,
      title: metadata.title || 'Untitled',
      date,
      excerpt,
      readingTime,
      content
    })
  }
  
  return writings
}

// Generate the writings array
const writings = loadWritingsFromFolder()

// Write to a TypeScript file that can be imported
const output = `// Auto-generated writings data
export interface Writing {
  slug: string
  title: string
  date: string
  content: string
  excerpt: string
  readingTime: number
}

export const writings: Writing[] = ${JSON.stringify(writings, null, 2)}
`

fs.writeFileSync(path.join(__dirname, '../src/writings.generated.ts'), output)
console.log(`Generated ${writings.length} writings`)