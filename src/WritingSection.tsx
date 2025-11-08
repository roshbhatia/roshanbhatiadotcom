import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Copy, Check } from 'lucide-react'

interface Writing {
  slug: string
  title: string
  date: string
  content: string
}

const writings: Writing[] = [
  {
    slug: 'keyboard-designing-for-fools-by-an-idiot',
    title: 'keyboard designing for fools by an idiot',
    date: '2025-01-08',
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="cell-border my-4">
      <div className="grid grid-cols-12 gap-1 border-b border-border bg-bg/50">
        <div className="col-span-8 flex items-center gap-2 p-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="mono text-xs text-border">{language}</span>
        </div>
        <div className="col-span-4 p-2">
          <button
            onClick={handleCopy}
            className="cell-border w-full text-xs bg-bg/80 hover:bg-accent/20 transition-colors flex items-center justify-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                COPIED
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                COPY
              </>
            )}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          backgroundColor: 'transparent',
          color: 'var(--text)',
          fontFamily: "'Wumpus Mono', 'IBM Plex Mono', monospace",
          fontSize: '0.75rem',
          lineHeight: '1.4',
          borderRadius: '0',
          border: 'none',
          padding: '0.75rem',
          margin: '0',
        }}
        showLineNumbers
        lineNumberStyle={{
          color: 'var(--border)',
          paddingRight: '0.75rem',
          userSelect: 'none',
          minWidth: '1.5rem',
          fontSize: '0.7rem',
        }}
        codeTagProps={{
          style: {
            fontFamily: "'Wumpus Mono', 'IBM Plex Mono', monospace",
          }
        }}
      >
        {children}
      </SyntaxHighlighter>
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
          <p key={elements.length} className="mb-3 leading-relaxed text-xs">
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
        <div key={elements.length} className="cell-border p-3 mb-4">
          <h1 className="mono text-lg font-bold text-text">DOCUMENT: {line.slice(2)}</h1>
        </div>
      )
    } else if (line.startsWith('## ')) {
      flushParagraph()
      elements.push(
        <div key={elements.length} className="cell-border p-2 mb-3">
          <h2 className="mono text-base font-semibold text-text">SECTION: {line.slice(3)}</h2>
        </div>
      )
    } else if (line.startsWith('### ')) {
      flushParagraph()
      elements.push(
        <div key={elements.length} className="cell-border p-2 mb-2">
          <h3 className="mono text-sm font-medium text-text">SUBSECTION: {line.slice(4)}</h3>
        </div>
      )
    } else if (line.startsWith('- ')) {
      flushParagraph()
      elements.push(
        <div key={elements.length} className="cell-border p-2 mb-2 ml-4">
          <div className="mono text-xs text-text">• {line.slice(2)}</div>
        </div>
      )
    } else if (line.trim() === '---') {
      flushParagraph()
      elements.push(
        <div key={elements.length} className="grid grid-cols-12 gap-1 my-4">
          <div className="col-span-12 cell-border p-1">
            <div className="text-xs text-border text-center">DOCUMENT SEPARATOR</div>
          </div>
        </div>
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

function WritingSection() {
  const [selectedPost, setSelectedPost] = useState<string | null>(null)

  const selectedWriting = writings.find(w => w.slug === selectedPost)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-1">
        <div className="col-span-12 cell-border p-3">
          <div className="grid grid-cols-12 gap-1">
            <div className="col-span-8">
              <div className="mono text-sm font-semibold text-accent">TECHNICAL DOCUMENTATION</div>
            </div>
            <div className="col-span-4">
              <div className="mono text-xs text-border text-right">RECORDS: {writings.length}</div>
            </div>
          </div>
        </div>
      </div>
      
      {!selectedWriting && (
        <div className="grid grid-cols-12 gap-1">
          {writings.map(post => (
            <div key={post.slug} className="col-span-12">
              <div className="cell-border">
                <button
                  onClick={() => setSelectedPost(post.slug)}
                  className="w-full text-left hover:bg-accent/20 transition-colors p-3 group"
                >
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-8">
                      <div className="cell-border p-2">
                        <div className="mono text-xs font-medium text-text group-hover:text-accent transition-colors">
                          {post.title}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="cell-border p-2">
                        <div className="mono text-xs text-border">{post.date}</div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="cell-border p-2">
                        <div className="mono text-xs text-accent">VIEW →</div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedWriting && (
        <div className="grid grid-cols-12 gap-1">
          <div className="col-span-12 cell-border">
            <div className="grid grid-cols-12 gap-1">
              <div className="col-span-12 cell-border p-2">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="cell-border text-xs bg-bg/80 hover:bg-accent/20 transition-colors px-3 py-1"
                >
                  ← BACK TO INDEX
                </button>
              </div>
              
              <div className="col-span-12 cell-border p-4">
                <div className="grid grid-cols-12 gap-1 mb-4">
                  <div className="col-span-8 cell-border p-3">
                    <div className="mono text-sm font-bold text-text">{selectedWriting.title}</div>
                  </div>
                  <div className="col-span-4 cell-border p-3">
                    <div className="mono text-xs text-border">PUBLISHED: {selectedWriting.date}</div>
                    <div className="mono text-xs text-border">TYPE: TECHNICAL ANALYSIS</div>
                  </div>
                </div>
                
                <div className="cell-border p-4">
                  <div className="mono text-xs leading-relaxed text-text">
                    {parseMarkdown(selectedWriting.content)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WritingSection