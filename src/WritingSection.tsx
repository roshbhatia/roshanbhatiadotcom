import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Copy, Check, Calendar, Clock, ArrowLeft } from 'lucide-react'
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
    <div className="bg-bg/50 border border-border rounded-lg overflow-hidden my-6">
      <div className="flex items-center justify-between px-4 py-2 bg-bg/80 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="mono text-sm text-text">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1 text-sm text-text hover:text-accent transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          backgroundColor: 'transparent',
          color: 'var(--text)',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.875rem',
          lineHeight: '1.5',
          borderRadius: '0',
          border: 'none',
          padding: '1rem',
          margin: '0',
        }}
        showLineNumbers
        lineNumberStyle={{
          color: 'var(--border)',
          paddingRight: '1rem',
          userSelect: 'none',
          minWidth: '2rem',
          fontSize: '0.75rem',
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
          <p key={elements.length} className="mb-4 leading-relaxed text-body">
            {paragraphText
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
              .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent hover:text-text transition-colors underline">$1</a>')
              .split(/(<strong>.*?<\/strong>|<em>.*?<\/em>|<code class="inline-code">.*?<\/code>|<a[^>]*>.*?<\/a>)/)
              .map((part, index) => {
                if (part.startsWith('<strong>')) {
                  return <strong key={index}>{part.replace(/<\/?strong>/g, '')}</strong>
                }
                if (part.startsWith('<em>')) {
                  return <em key={index}>{part.replace(/<\/?em>/g, '')}</em>
                }
                if (part.startsWith('<code class="inline-code">')) {
                  return <code key={index} className="inline-code font-mono">{part.replace(/<\/?code class="inline-code">/g, '')}</code>
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
        <div key={elements.length} className="my-8">
          <div className="relative group">
            <img 
              src={getImagePath(decodedPath)}
              alt={alt || ''}
              className="w-full rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200"
              loading="lazy"
            />
          </div>
          {alt && (
            <figcaption className="text-sm text-text/60 mt-3 text-center italic font-light leading-relaxed">
              {alt}
            </figcaption>
          )}
        </div>
      )
      return
    }

    if (line.startsWith('# ')) {
      flushParagraph()
      elements.push(
        <h1 key={elements.length} className="text-2xl font-bold text-text mb-6 mt-8">
          {line.slice(2)}
        </h1>
      )
    } else if (line.startsWith('## ')) {
      flushParagraph()
      elements.push(
        <h2 key={elements.length} className="text-xl font-semibold text-text mb-4 mt-6">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      flushParagraph()
      elements.push(
        <h3 key={elements.length} className="text-lg font-medium text-text mb-3 mt-4">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('- ')) {
      flushParagraph()
      elements.push(
        <li key={elements.length} className="text-body text-text mb-2 ml-6 list-disc">
          {line.slice(2)}
        </li>
      )
    } else if (line.trim() === '---') {
      flushParagraph()
      elements.push(
        <hr key={elements.length} className="border-border my-8" />
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
    <article className="card-hover content-card cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <span className="text-accent mono text-xs">[POST]</span>
          <h3 className="text-body text-text mt-1 group-hover:text-accent transition-colors">
            {post.title}
          </h3>
        </div>
        <span className="mono text-xs text-accent">
          {new Date(post.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </span>
      </div>
      

      
      <div className="flex items-center justify-between">
        <div className="mono text-xs text-text/60">
          <Clock className="inline w-3 h-3 mr-1" />
          {post.readingTime} min read
        </div>
        <button 
          onClick={() => onSelect(post.slug)}
          className="mono text-xs text-accent hover:text-text transition-colors"
        >
          [READ_MORE] →
        </button>
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
        className="fixed inset-0 bg-bg/95 backdrop-blur-sm z-50 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedPost(null)
          }
        }}
      >
        <div className="min-h-screen p-8">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 text-text hover:text-accent transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all posts
            </button>
            
            <article className="content-card">
              <header className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-3xl font-bold text-text">
                    {selectedWriting.title}
                  </h1>
                  <span className="px-3 py-1 bg-accent/20 text-accent text-sm rounded-full">
                    TECHNICAL ANALYSIS
                  </span>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-text/70">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedWriting.date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {selectedWriting.readingTime} minute read
                  </div>
                </div>
              </header>
              
              <div className="prose max-w-none">
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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text mb-2">[WRITING]</h2>
      </div>
      
      <div className="grid gap-6">
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