import { useState, useEffect, useMemo, useRef } from 'react'
import { codeToHtml } from 'shiki'
import { writings, Writing } from './writings.generated'
import { useTheme } from './contexts/ThemeContext'
import { Footer } from './App'
import { updateMetaTags, resetMetaTags } from './utils/metaTags'
import { useModals } from '@components/page/ModalContext'
import BlogPostModal from '@components/modals/BlogPostModal'

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
  const [html, setHtml] = useState<string>('')
  const { theme } = useTheme()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const getShikiTheme = () => {
      switch(theme) {
        case 'gruvbox-light':
          return 'gruvbox-light'
        case 'gruvbox-dark':
          return 'gruvbox-dark'
        case 'dark':
        case 'nord-dark':
          return 'nord'
        default:
          return 'github-light'
      }
    }

    const highlightCode = async () => {
      try {
        const highlighted = await codeToHtml(children, {
          lang: language || 'text',
          theme: getShikiTheme(),
        })
        setHtml(highlighted)
      } catch (error) {
        console.error('Failed to highlight code:', error)
        // Fallback to plain text
        setHtml(`<pre><code>${children}</code></pre>`)
      }
    }
    highlightCode()
  }, [children, language, theme])

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
      {html ? (
        <div
          className="shiki-wrapper"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            lineHeight: '1.5',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            lineHeight: '1.5',
            padding: '16px',
            overflow: 'auto',
          }}
        >
          <code>{children}</code>
        </pre>
      )}
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
            alt={alt || ''}
            className="w-full border-2 border-border"
            loading="lazy"
          />
          {alt && alt.trim() && (
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

function BlogCard({ post, onSelect, index, isHighlighted }: {
  post: Writing;
  onSelect: (slug: string) => void;
  index: number;
  isHighlighted: boolean;
}) {
  const dateStr = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-')

  return (
    <article
      className={`py-1 cursor-pointer mono text-small ${isHighlighted ? 'bg-code-bg accent-text' : 'hover:bg-code-bg'}`}
      data-test="blog-card"
      onClick={() => onSelect(post.slug)}
    >
      <div className="flex items-baseline gap-2">
        <span className="secondary-text whitespace-nowrap" data-test="blog-date" style={{ minWidth: '10ch' }}>
          {dateStr}
        </span>
        <h3 className="flex-1" data-test="blog-title">
          {post.title}
        </h3>
        <span className="muted-text whitespace-nowrap" data-test="reading-time" style={{ minWidth: '8ch', textAlign: 'right' }}>
          {post.readingTime} min
        </span>
      </div>
    </article>
  )
}

function WritingSection() {
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const { open, close } = useModals()
  const modalKeyRef = useRef<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Handle URL hash on mount and when it changes
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.slice(1) // Remove the #
      if (hash.startsWith('writing/')) {
        const slug = hash.replace('writing/', '')
        const writing = writings.find(w => w.slug === slug)
        if (writing) {
          setSelectedPost(slug)
        }
      } else if (hash === '') {
        setSelectedPost(null)
      }
    }

    // Check on mount
    checkHash()

    // Listen for hash changes (back/forward navigation)
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  // Update meta tags when post selection changes
  useEffect(() => {
    if (selectedPost) {
      const writing = writings.find(w => w.slug === selectedPost)
      if (writing) {
        updateMetaTags({
          title: `${writing.title} - Roshan Bhatia`,
          description: writing.excerpt,
          url: `https://roshanbhatia.com/#writing/${writing.slug}`,
          type: 'article'
        })
      }
    } else {
      resetMetaTags()
    }
  }, [selectedPost])

  // Open modal when selectedPost changes
  useEffect(() => {
    if (selectedPost) {
      const selectedWriting = writings.find(w => w.slug === selectedPost)
      if (selectedWriting) {
        // Only open a new modal if one isn't already open
        // This prevents flickering when clicking the same post
        if (!modalKeyRef.current) {
          // Get folder path from the selected writing slug
          const getImagePath = (imagePath: string) => {
            // Handle absolute paths
            if (imagePath.startsWith('/')) {
              return imagePath
            }
            // For relative paths, just prepend the writing folder
            return `/writing/${selectedWriting.slug}/${imagePath}`
          }

          const { elements, toc } = parseMarkdown(selectedWriting.content, getImagePath)

          const key = open(BlogPostModal, {
            writing: selectedWriting,
            elements,
            toc,
            onClose: closePost,
            Footer
          })
          modalKeyRef.current = key
        }
      }
    } else {
      // Close modal when selectedPost is null
      if (modalKeyRef.current) {
        close(modalKeyRef.current)
        modalKeyRef.current = null
      }
    }
  }, [selectedPost, open, close])

  // Update URL when post selection changes
  const openPost = (slug: string) => {
    window.location.hash = `writing/${slug}`
  }

  const closePost = () => {
    window.location.hash = ''
  }

  // Simple fuzzy filter
  const filteredWritings = useMemo(() => {
    if (!searchQuery.trim()) return writings

    const query = searchQuery.toLowerCase()
    return writings.filter(post =>
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Reset highlighted index when filter changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredWritings.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      // Only handle these keys when search is focused
      if (document.activeElement === searchInputRef.current) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setHighlightedIndex(prev => Math.min(prev + 1, filteredWritings.length - 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setHighlightedIndex(prev => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (filteredWritings[highlightedIndex]) {
            openPost(filteredWritings[highlightedIndex].slug)
          }
        } else if (e.key === 'Escape') {
          e.preventDefault()
          setSearchQuery('')
          searchInputRef.current?.blur()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredWritings, highlightedIndex])

  return (
    <div data-test="blog-list">
      {/* FZF-style search */}
      <div className="mb-4 border border-border p-2 bg-code-bg">
        <div className="flex items-center gap-2 mono text-small">
          <span className="accent-text">›</span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="fuzzy search..."
            className="flex-1 bg-transparent outline-none border-none text-text"
            style={{ caretColor: 'var(--accent)' }}
          />
          <span className="secondary-text text-small">
            {filteredWritings.length}/{writings.length}
          </span>
        </div>
      </div>

      {/* Post list */}
      <div className="space-y-0">
        {filteredWritings.map((post, index) => (
          <BlogCard
            key={post.slug}
            post={post}
            index={index}
            isHighlighted={index === highlightedIndex}
            onSelect={openPost}
          />
        ))}
      </div>

      {filteredWritings.length === 0 && (
        <div className="mono text-small secondary-text py-4 text-center">
          no matches found
        </div>
      )}
    </div>
  )
}

export default WritingSection