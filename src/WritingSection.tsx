import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { writings, Writing } from './writings.generated'
import { useTheme } from './contexts/ThemeContext'

// Custom gruvbox syntax highlighting styles with better color contrast
const gruvboxLightStyle = {
  'pre[class*="language-"]': {
    color: '#3c3836',
    background: '#f2e5bc',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    lineHeight: '1.5',
    borderRadius: '0',
    border: 'none',
    padding: '16px',
    margin: '0',
  },
  'code[class*="language-"]': {
    color: '#3c3836',
    background: '#f2e5bc',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    lineHeight: '1.5',
    borderRadius: '0',
    border: 'none',
    padding: '16px',
    margin: '0',
  },
  'token.comment': {
    color: '#928374',
    fontStyle: 'italic'
  },
  'token.string': {
    color: '#b8bb26'
  },
  'token.number': {
    color: '#d3869b'
  },
  'token.keyword': {
    color: '#cc241d',
    fontWeight: 'bold'
  },
  'token.function': {
    color: '#458588'
  },
  'token.operator': {
    color: '#cc241d'
  },
  'token.variable': {
    color: '#076678'
  },
  'token.class-name': {
    color: '#b57614'
  },
  'token.tag': {
    color: '#cc241d'
  },
  'token.attr-name': {
    color: '#d3869b'
  },
  'token.attr-value': {
    color: '#b8bb26'
  },
  'token.punctuation': {
    color: '#928374'
  },
  'token.property': {
    color: '#076678'
  },
  'token.boolean': {
    color: '#d3869b'
  },
  'token.namespace': {
    color: '#b57614'
  }
}

const gruvboxDarkStyle = {
  'pre[class*="language-"]': {
    color: '#ebdbb2',
    background: '#1d2021',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    lineHeight: '1.5',
    borderRadius: '0',
    border: 'none',
    padding: '16px',
    margin: '0',
  },
  'code[class*="language-"]': {
    color: '#ebdbb2',
    background: '#1d2021',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    lineHeight: '1.5',
    borderRadius: '0',
    border: 'none',
    padding: '16px',
    margin: '0',
  },
  'token.comment': {
    color: '#928374',
    fontStyle: 'italic'
  },
  'token.string': {
    color: '#b8bb26'
  },
  'token.number': {
    color: '#d3869b'
  },
  'token.keyword': {
    color: '#fb4934',
    fontWeight: 'bold'
  },
  'token.function': {
    color: '#8ec07c'
  },
  'token.operator': {
    color: '#fb4934'
  },
  'token.variable': {
    color: '#83a598'
  },
  'token.class-name': {
    color: '#fabd2f'
  },
  'token.tag': {
    color: '#fb4934'
  },
  'token.attr-name': {
    color: '#d3869b'
  },
  'token.attr-value': {
    color: '#b8bb26'
  },
  'token.punctuation': {
    color: '#928374'
  },
  'token.property': {
    color: '#83a598'
  },
  'token.boolean': {
    color: '#d3869b'
  },
  'token.namespace': {
    color: '#fabd2f'
  }
}

interface CodeBlockProps {
  language: string | undefined
  children: string
  showCopy?: boolean
}

interface TOCItem {
  id: string
  title: string
  level: number
}

function CodeBlock({ language, children, showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Use appropriate syntax highlighting style for each theme
  let syntaxStyle
  if (theme === 'gruvbox-light') {
    syntaxStyle = gruvboxLightStyle
  } else if (theme === 'gruvbox-dark') {
    syntaxStyle = gruvboxDarkStyle
  } else {
    const isDarkTheme = theme === 'dark' || theme === 'nord-dark'
    syntaxStyle = isDarkTheme ? vs : vscDarkPlus
  }

  return (
    <div className="code-block my-8">
      <div className="border-box p-6 flex justify-between items-center technical-border">
        <span className="mono text-small accent-text">[{(language || 'text').toUpperCase()}]</span>
        {showCopy && (
          <button
            onClick={handleCopy}
            className="mono text-small theme-toggle"
          >
            [{copied ? 'COPIED' : 'COPY'}]
          </button>
        )}
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={syntaxStyle}
        customStyle={
          theme === 'gruvbox-light' || theme === 'gruvbox-dark' 
            ? {
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                lineHeight: '1.5',
                borderRadius: '0',
                border: 'none',
                padding: '16px',
                margin: '0',
              }
            : {
                backgroundColor: 'var(--code-bg-opposite)',
                color: 'var(--code-text-opposite)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                lineHeight: '1.5',
                borderRadius: '0',
                border: 'none',
                padding: '16px',
                margin: '0',
              }
        }
        showLineNumbers
        lineNumberStyle={{
          color: 'var(--border)',
          paddingRight: '10px',
          userSelect: 'none',
          minWidth: '20px',
          fontSize: '10px',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

function parseMarkdown(content: string, getImagePath: (path: string) => string): { elements: React.ReactNode[], toc: TOCItem[] } {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  const toc: TOCItem[] = []
  let currentParagraph: string[] = []
  let codeBlock: { language: string | undefined; content: string[] } | null = null

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join(' ').trim()
      if (paragraphText) {
        elements.push(
          <p key={elements.length} className="mb-6 text-body breathing-room">
            {paragraphText
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
              .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-link">$1</a>')
              .split(/(<strong>.*?<\/strong>|<em>.*?<\/em>|<code class="inline-code">.*?<\/code>|<a[^>]*>.*?<\/a>)/)
              .map((part, index) => {
                if (part.startsWith('<strong>')) {
                  return <strong key={index}>{part.replace(/<\/?strong>/g, '')}</strong>
                }
                if (part.startsWith('<em>')) {
                  return <em key={index}>{part.replace(/<\/?em>/g, '')}</em>
                }
                if (part.startsWith('<code class="inline-code">')) {
                  return <code key={index} className="inline-code">{part.replace(/<\/?code[^>]*>/g, '')}</code>
                }
                if (part.startsWith('<a')) {
                  const hrefMatch = part.match(/href="([^"]+)"/)
                  const textMatch = part.match(/>([^<]+)</)
                  const href = hrefMatch ? hrefMatch[1] : ''
                  const text = textMatch ? textMatch[1] : part
                  return (
                    <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="text-link">
                      {text}
                    </a>
                  )
                }
                return part
              })}
          </p>
        )
      }
      currentParagraph = []
    }
  }

  lines.forEach((line) => {
    if (line.startsWith('```')) {
      if (codeBlock) {
        elements.push(
          <CodeBlock
            key={elements.length}
            language={codeBlock.language || 'text'}
            showCopy={false}
          >
            {codeBlock.content.join('\n')}
          </CodeBlock>
        )
        codeBlock = null
      } else {
        flushParagraph()
        codeBlock = {
          language: line.slice(3).trim() || undefined,
          content: []
        }
      }
      return
    }

    if (codeBlock) {
      codeBlock.content.push(line)
      return
    }

    // Handle images: ![alt text](path)
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageMatch) {
      flushParagraph()
      const [alt, path] = imageMatch.slice(1)

      elements.push(
        <div key={elements.length} className="my-8 content-spacing technical-border">
          <img
            src={getImagePath(path || '')}
            alt={alt || 'PLACEHOLDER'}
            className="w-full border-2 border-border"
            loading="lazy"
          />
          {alt && (
            <div className="text-small mt-4 text-center secondary-text italic">
              {alt}
            </div>
          )}
        </div>
      )
      return
    }

    if (line.startsWith('# ')) {
      flushParagraph()
      elements.push(
        <h1 key={elements.length} className="text-hero mb-8 mt-12">
          {line.slice(2)}
        </h1>
      )
    } else if (line.startsWith('## ')) {
      flushParagraph()
      const title = line.slice(3)
      const id = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
      
      // Special styling for Background/Resources sections
      const isSpecialSection = title.toLowerCase().includes('background') || title.toLowerCase().includes('resources')
      
      toc.push({ id, title, level: 2 })
      elements.push(
        <h2 key={elements.length} id={id} className={`text-section mb-6 mt-8 ${isSpecialSection ? 'accent-text industrial-divider pb-2' : ''}`}>
          {isSpecialSection ? `[${title.toUpperCase()}]` : title}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      flushParagraph()
      const title = line.slice(4)
      const id = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
      
      // Special styling for Background/Resources sections
      const isSpecialSection = title.toLowerCase().includes('background') || title.toLowerCase().includes('resources')
      
      toc.push({ id, title, level: 3 })
      elements.push(
        <h3 key={elements.length} id={id} className={`text-body font-bold mb-4 mt-6 ${isSpecialSection ? 'accent-text industrial-divider pb-2' : ''}`}>
          {isSpecialSection ? `[${title.toUpperCase()}]` : title}
        </h3>
      )
    } else if (line.startsWith('- ')) {
      flushParagraph()
      // Check if this is a list item with a link
      const listItemText = line.slice(2)
      const processedText = listItemText
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-link">$1</a>')
        .split(/(<a[^>]*>.*?<\/a>)/)
        .map((part, index) => {
          if (part.startsWith('<a')) {
            const hrefMatch = part.match(/href="([^"]+)"/)
            const textMatch = part.match(/>([^<]+)</)
            const href = hrefMatch ? hrefMatch[1] : ''
            const text = textMatch ? textMatch[1] : part
            return (
              <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="text-link">
                {text}
              </a>
            )
          }
          return part
        })
      
      elements.push(
        <li key={elements.length} className="text-body mb-2 ml-6">
          {processedText}
        </li>
      )
    } else if (line.trim() === '---') {
      flushParagraph()
      elements.push(
        <hr key={elements.length} className="industrial-divider my-8" />
      )
    } else if (line.trim() === '') {
      flushParagraph()
    } else {
      currentParagraph.push(line)
    }
  })

  flushParagraph()
  return { elements, toc }
}

function TOC({ toc }: { toc: TOCItem[] }) {
  return (
    <div className="content-text mb-8">
      <div className="mb-4">
        <span className="text-section accent-text">[TABLE OF CONTENTS]</span>
      </div>
      <nav className="text-body">
        {toc.map((item, index) => (
          <a
            key={index}
            href={`#${item.id}`}
            className={`block mb-2 text-link hover:text-accent ${
              item.level === 3 ? 'ml-6' : ''
            }`}
          >
            {item.title}
          </a>
        ))}
      </nav>
    </div>
  )
}

function BlogCard({ post, onSelect }: { post: Writing; onSelect: (slug: string) => void }) {
  return (
    <article className="content-card cursor-pointer schematic-section" data-test="blog-card"     onClick={() => onSelect(post.slug)}>
      <div className="flex flex-col sm:flex-row sm:justify-between mb-4 gap-2 sm:gap-0">
        <div className="flex-1">
          <span className="text-small accent-text">[POST]</span>
          <h3 className="text-body mt-2 primary-text text-lg sm:text-base" data-test="blog-title">
            {post.title}
          </h3>
        </div>
        <span className="text-small secondary-text whitespace-nowrap" data-test="blog-date">
          {new Date(post.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
        <div className="text-small muted-text" data-test="reading-time">
          {post.readingTime} MIN READ
        </div>
        <div className="text-small accent-text">
          [READ_MORE]
        </div>
      </div>
      
      {/* Hardlink for direct access */}
      <div className="mt-4 pt-4 border-t border-border">
        <a 
          href={`#${post.slug}`}
          className="text-small text-link hover:text-accent transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          🔗 Direct link: /{post.slug}
        </a>
      </div>
    </article>
  )
}

function WritingSection() {
  const [selectedPost, setSelectedPost] = useState<string | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPost) {
        setSelectedPost(null)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [selectedPost])

  const selectedWriting = writings.find(w => w.slug === selectedPost)

  // Get folder path from the selected writing slug
  const getImagePath = (imagePath: string) => {
    if (!selectedWriting) return `/writing/${imagePath}`

    const slugParts = selectedWriting.slug.split('/')
    const folderPath = slugParts[0] || '' // Get "000" from "000/Keyboard designing..."
    const subfolderPath = slugParts[1] || '' // Get "Keyboard designing..." part

    // Handle different image path formats
    if (imagePath.startsWith('/')) {
      // Absolute path from root
      return imagePath
    }

    // Handle URL encoded paths (like %20 for spaces) - decode them first
    const decodedPath = decodeURIComponent(imagePath)
    
    // Also replace non-breaking spaces with regular spaces
    const normalizedPath = decodedPath.replace(/\u00A0/g, ' ')
    
    // Check if path already includes subfolder name
    if (normalizedPath.startsWith(subfolderPath + '/')) {
      // Path already includes subfolder, just add base folder
      return `/writing/${folderPath}/${normalizedPath}`
    } else {
      // Path is just filename, add both folder and subfolder
      return `/writing/${folderPath}/${subfolderPath}/${normalizedPath}`
    }
  }

  if (selectedWriting) {
    
    const { elements, toc } = parseMarkdown(selectedWriting.content, getImagePath)
    
    return (
      <div
        className="fixed inset-0 bg-bg z-50 overflow-y-auto engineering-grid"
        data-test="blog-modal"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedPost(null)
          }
        }}

      >
        <div className="min-h-screen p-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedPost(null)}
              className="theme-toggle mb-8"
              data-test="back-button"
            >
              [BACK]
            </button>

            <article className="content-card schematic-container">
              <header className="mb-8">
                <div className="flex justify-between mb-4">
                  <h1 className="text-hero" data-test="blog-title">
                    {selectedWriting.title}
                  </h1>
                </div>

                <div className="flex gap-8 text-small secondary-text">
                  <div data-test="blog-date">
                    {new Date(selectedWriting.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div data-test="reading-time">
                    {selectedWriting.readingTime} MIN READ
                  </div>
                </div>
                <div className="industrial-divider"></div>
              </header>

              {toc.length > 0 && <TOC toc={toc} />}

              <div className="prose" data-test="blog-content">
                {elements}
              </div>
            </article>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div data-test="blog-list">
      <div className="grid gap-4">
        {writings.map((post) => (
          <BlogCard
            key={post.slug}
            post={post}
            onSelect={setSelectedPost}
          />
        ))}
      </div>
    </div>
  )
}

export default WritingSection