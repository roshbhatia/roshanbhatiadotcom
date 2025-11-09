const fs = require('fs')
const path = require('path')

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
    
    // Find .md file
    const mdFile = files.find(file => file.endsWith('.md'))
    if (!mdFile) continue
    
    const mdPath = path.join(folderPath, mdFile)
    const content = fs.readFileSync(mdPath, 'utf8')
    
    // Extract metadata
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : mdFile.replace('.md', '')
    
    // Create slug from folder name and filename
    const slug = folder + '/' + mdFile.replace('.md', '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    // Estimate reading time (rough calculation: 200 words per minute)
    const wordCount = content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)
    
    // Get first paragraph as excerpt
    const lines = content.split('\n')
    let excerpt = ''
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line && !line.startsWith('#')) {
        excerpt = line.substring(0, 200) + (line.length > 200 ? '...' : '')
        break
      }
    }
    
    // Use folder modification time as date
    const stats = fs.statSync(folderPath)
    const date = stats.mtime.toISOString().split('T')[0]
    
    writings.push({
      slug,
      title,
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