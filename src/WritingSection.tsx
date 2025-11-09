import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { writings, Writing } from './writings.generated'

interface CodeBlockProps {
  language: string
  children: string
}

function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block my-4">
      <div className="border-box p-2 flex justify-between items-center">
        <span className="mono text-xs">[{language.toUpperCase()}]</span>
        <button
          onClick={handleCopy}
          className="mono text-xs"
        >
          [{copied ? 'COPIED' : 'COPY'}]
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          backgroundColor: 'var(--code-bg)',
          color: 'var(--code-text)',
          fontFamily: "'Courier New', monospace",
          fontSize: '12px',
          lineHeight: '1.2',
          borderRadius: '0',
          border: 'none',
          padding: '5px',
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
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let currentParagraph: string[] = []
  let codeBlock: { language: string; content: string[] } | null = null

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join(' ').trim()
      if (paragraphText) {
      elements.push(
        <p key={elements.length} className="mb-2 text-body">
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
            language={codeBlock.language}
          >
            {codeBlock.content.join('\n')}
          </CodeBlock>
        )
        codeBlock = null
      } else {
        flushParagraph()
        codeBlock = {
          language: line.slice(3).trim() || 'text',
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

      // Decode URL-encoded paths for the actual file system
      const decodedPath = decodeURIComponent(path || '')

      elements.push(
        <div key={elements.length} className="my-4">
          <img
            src={getImagePath(decodedPath)}
            alt={alt || ''}
            className="w-full border border-border"
            loading="lazy"
          />
          {alt && (
            <div className="text-xs mt-2 text-center italic">
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
        <h1 key={elements.length} className="text-hero mb-4 mt-6">
          {line.slice(2)}
        </h1>
      )
    } else if (line.startsWith('## ')) {
      flushParagraph()
      elements.push(
        <h2 key={elements.length} className="text-section mb-3 mt-4">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      flushParagraph()
      elements.push(
        <h3 key={elements.length} className="text-body font-bold mb-2 mt-3">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('- ')) {
      flushParagraph()
      elements.push(
        <li key={elements.length} className="text-body mb-1 ml-4">
          {line.slice(2)}
        </li>
      )
    } else if (line.trim() === '---') {
      flushParagraph()
      elements.push(
        <hr key={elements.length} className="border-border my-4" />
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
    <article className="content-card cursor-pointer" onClick={() => onSelect(post.slug)}>
      <div className="flex justify-between mb-2">
        <div>
          <span className="text-xs">[POST]</span>
          <h3 className="text-body mt-1">
            {post.title}
          </h3>
        </div>
        <span className="text-xs">
          {new Date(post.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      </div>

      <div className="flex justify-between">
        <div className="text-xs">
          {post.readingTime} MIN READ
        </div>
        <div className="text-xs">
          [READ_MORE]
        </div>
      </div>
    </article>
  )
}

function WritingSection() {
  const [selectedPost, setSelectedPost] = useState<string | null>(null)

  const selectedWriting = writings.find(w => w.slug === selectedPost)

  // Get the folder path from the selected writing slug
  const getImagePath = (imagePath: string) => {
    if (!selectedWriting) return imagePath
    const folderPath = selectedWriting.slug // Use full slug "000/Keyboard designing..."
    // imagePath is already URL-encoded in markdown, ensure it's properly encoded for browser
    const decodedPath = decodeURIComponent(imagePath)
    const properlyEncodedPath = encodeURIComponent(decodedPath)
    return `/writing/${folderPath}/${properlyEncodedPath}`
  }

  if (selectedWriting) {
    return (
      <div
        className="fixed inset-0 bg-bg z-50 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedPost(null)
          }
        }}
      >
        <div className="min-h-screen p-2">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedPost(null)}
              className="text-text mb-4"
            >
              [BACK]
            </button>

            <article className="content-card">
              <header className="mb-4">
                <div className="flex justify-between mb-2">
                  <h1 className="text-hero">
                    {selectedWriting.title}
                  </h1>
                  <span className="text-xs">
                    [TECHNICAL ANALYSIS]
                  </span>
                </div>

                <div className="flex gap-4 text-xs">
                  <div>
                    {new Date(selectedWriting.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div>
                    {selectedWriting.readingTime} MIN READ
                  </div>
                </div>
              </header>

              <div className="prose">
                {parseMarkdown(selectedWriting.content, getImagePath)}
              </div>
            </article>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="grid gap-2">
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
