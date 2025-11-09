import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'

interface Writing {
  slug: string
  title: string
  date: string
  content: string
  excerpt: string
  readingTime: number
}

const writings: Writing[] = [
  {
    slug: 'keyboard-designing-for-fools-by-an-idiot',
    title: 'Keyboard Designing for Fools by an Idiot',
    date: '2025-01-08',
    excerpt: 'A brutally honest take on keyboard design, why most enthusiasts are wrong, and what actually matters for comfortable typing.',
    readingTime: 5,
    content: `# keyboard designing for fools by an idiot

i'm an idiot and here's how i design keyboards:

## why i'm wrong about everything

- i use cherry mx switches because they sound cool
- i think 65% is "perfect" layout but my hands disagree
- i buy keycaps with legends that wear off in 2 weeks
- i spend $200 on a custom keyboard that types worse than my $10 one

## truth about keyboard design

- layout doesn't matter if you can't type comfortably
- switches are personal preference not objective superiority
- keycaps are consumables, not investments
- best keyboard is one you don't think about

## what actually works

- split ergo layout for shoulder health
- linear switches for reliability (box jades, gaterons)
- pbt keycaps that last years
- typing practice beats hardware every time

## conclusion

i'm still an idiot, but at least i'm a comfortable idiot with a keyboard that works.

---

\`\`\`typescript
// Example of proper keyboard configuration
interface KeyboardConfig {
  layout: 'split' | 'standard'
  switches: 'linear' | 'tactile' | 'clicky'
  keycaps: 'pbt' | 'abs'
  size: '60%' | '65%' | '75%' | 'full'
}

const optimalConfig: KeyboardConfig = {
  layout: 'split',
  switches: 'linear',
  keycaps: 'pbt',
  size: '65%'
}
\`\`\`

*this post demonstrates static markdown to blog conversion with syntax highlighting*`
  }
]

interface CodeBlockProps {
  language: string
  children: string
}

function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Check current theme
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme')
      setIsDarkMode(theme !== 'light')
    }
    checkTheme()
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['data-theme'] 
    })
    
    return () => observer.disconnect()
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Use opposite theme colors for code block
  const codeBgColor = isDarkMode ? '#1e1e1e' : '#f8f8f8'
  const codeTextColor = isDarkMode ? '#d4d4d4' : '#000000'

  return (
    <div className="content-card my-6" style={{ backgroundColor: codeBgColor }}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: isDarkMode ? '#404040' : '#e0e0e0' }}>
        <div className="flex items-center gap-3">
          <span className="text-accent mono text-xs">[</span>
          <span className="mono text-sm" style={{ color: codeTextColor }}>{language.toUpperCase()}</span>
          <span className="text-accent mono text-xs">]</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1 text-xs mono border transition-all hover:border-accent"
          style={{ 
            color: codeTextColor, 
            borderColor: isDarkMode ? '#404040' : '#e0e0e0',
            backgroundColor: 'transparent'
          }}
        >
          {copied ? (
            <>
              <span className="text-accent">✓</span>
              COPIED
            </>
          ) : (
            <>
              <span>[</span>
              COPY
              <span>]</span>
            </>
          )}
        </button>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center text-xs mono" style={{ color: isDarkMode ? '#666' : '#999' }}>
          <span className="text-accent">│</span>
        </div>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            backgroundColor: 'transparent',
            color: codeTextColor,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.875rem',
            lineHeight: '1.6',
            borderRadius: '0',
            border: 'none',
            padding: '1rem 1rem 1rem 2.5rem',
            margin: '0',
          }}
          showLineNumbers={false}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

function parseMarkdown(content: string): React.ReactNode[] {
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
              .split(/(<strong>.*?<\/strong>|<em>.*?<\/em>|<code class="inline-code">.*?<\/code>)/)
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
      
      <p className="mono text-sm text-text/80 mb-4 leading-relaxed">
        {post.excerpt}
      </p>
      
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

  if (selectedWriting) {
    return (
      <div className="max-w-4xl mx-auto">
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
            {parseMarkdown(selectedWriting.content)}
          </div>
        </article>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text mb-2">Technical Writing</h2>
        <p className="text-body text-text/70">
          Thoughts on keyboard design, software engineering, and technical topics from a practitioner's perspective.
        </p>
      </div>
      
      <div className="grid gap-6">
        {writings.map(post => (
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