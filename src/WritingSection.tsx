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

function BlogCard({ post, onSelect }: { post: Writing; onSelect: (slug: string) => void }) {
  const dateStr = new Date(post.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <article
      className="py-3 cursor-pointer hover:bg-code-bg transition-colors border-l-2 border-transparent hover:border-accent pl-4 mono"
      data-test="blog-card"
      onClick={() => onSelect(post.slug)}
    >
      <div className="flex items-baseline gap-4">
        <span className="text-small secondary-text whitespace-nowrap" data-test="blog-date">
          {dateStr}
        </span>
        <h3 className="text-body flex-1" data-test="blog-title">
          {post.title}
        </h3>
        <span className="text-small muted-text whitespace-nowrap" data-test="reading-time">
          {post.readingTime}min
        </span>
      </div>
    </article>
  )
}

function WritingSection() {
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const { open, close } = useModals()
  const modalKeyRef = useRef<string | null>(null)

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

  return (
    <div data-test="blog-list" className="space-y-1">
      {writings.map((post) => (
        <BlogCard
          key={post.slug}
          post={post}
          onSelect={openPost}
        />
      ))}
    </div>
  )
}

export default WritingSection