import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { writings, Writing } from './writings.generated'

interface CodeBlockProps {
  language: string | undefined
  children: string
  showCopy?: boolean
}

function CodeBlock({ language, children, showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        style={vscDarkPlus}
        customStyle={{
          backgroundColor: 'var(--code-bg)',
          color: 'var(--code-text)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          lineHeight: '1.5',
          borderRadius: '0',
          border: 'none',
          padding: '16px',
          margin: '0',
        }}
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

function parseMarkdown(content: string, getImagePath: (path: string) => string): React.ReactNode[] {
  console.log('parseMarkdown called with content length:', content.length)
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
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
                  return <code key={index} className="inline-code">{part.replace(/<\/?code class="inline-code">/g, '')}</code>
                }
                if (part.startsWith('<a')) {
                  return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />
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
      elements.push(
        <h2 key={elements.length} className="text-section mb-6 mt-8">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      flushParagraph()
      elements.push(
        <h3 key={elements.length} className="text-body font-bold mb-4 mt-6">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('- ')) {
      flushParagraph()
      elements.push(
        <li key={elements.length} className="text-body mb-2 ml-6">
          {line.slice(2)}
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
  return elements
}

function BlogCard({ post, onSelect }: { post: Writing; onSelect: (slug: string) => void }) {
  return (
    <article className="content-card cursor-pointer schematic-section" data-test="blog-card" onClick={() => {
      console.log('Blog card clicked, slug:', post.slug)
      onSelect(post.slug)
    }}>
      <div className="flex justify-between mb-4">
        <div>
          <span className="text-small accent-text">[POST]</span>
          <h3 className="text-body mt-2 primary-text" data-test="blog-title">
            {post.title}
          </h3>
        </div>
        <span className="text-small secondary-text" data-test="blog-date">
          {new Date(post.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      </div>

      <div className="flex justify-between">
        <div className="text-small muted-text" data-test="reading-time">
          {post.readingTime} MIN READ
        </div>
        <div className="text-small accent-text">
          [READ_MORE]
        </div>
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

  // Get the folder path from the selected writing slug
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

    // Return the correct path - images are in the subfolder, encode spaces for URLs
    return `/writing/${folderPath}/${encodeURIComponent(subfolderPath)}/${encodeURIComponent(imagePath)}`
  }

  if (selectedWriting) {
    console.log('Selected writing found:', selectedWriting.title)
    console.log('Content length:', selectedWriting.content?.length)
    console.log('First 100 chars:', selectedWriting.content?.substring(0, 100))
    
    return (
      <div
        className="fixed inset-0 bg-bg z-50 overflow-y-auto engineering-grid"
        data-test="blog-modal"
        onClick={(e) => {
          console.log('Modal clicked, target:', e.target, 'currentTarget:', e.currentTarget)
          if (e.target === e.currentTarget) {
            console.log('Closing modal - clicked on overlay')
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

              <div className="prose" data-test="blog-content">
                {parseMarkdown(selectedWriting.content, getImagePath)}
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
