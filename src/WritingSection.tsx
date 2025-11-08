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
    <div className="code-block my-6">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="mono text-xs text-border ml-2">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1 text-xs bg-bg/80 border border-border rounded hover:bg-accent/20 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
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
          fontFamily: "'Wumpus Mono', 'IBM Plex Mono', monospace",
          fontSize: '0.875rem',
          lineHeight: '1.6',
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
          <p key={elements.length} className="mb-4 leading-relaxed">
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
    // Handle code blocks
    if (line.startsWith('```')) {
      if (codeBlock) {
        // End of code block
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
        // Start of code block
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

    // Handle headers
    if (line.startsWith('# ')) {
      flushParagraph()
      elements.push(
        <h1 key={elements.length} className="mono text-2xl font-bold mb-6 text-text border-b-2 border-border pb-2">
          {line.slice(2)}
        </h1>
      )
    } else if (line.startsWith('## ')) {
      flushParagraph()
      elements.push(
        <h2 key={elements.length} className="mono text-xl font-semibold mb-4 text-text border-b border-border pb-2">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      flushParagraph()
      elements.push(
        <h3 key={elements.length} className="mono text-lg font-medium mb-3 text-text border-b border-border pb-1">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('- ')) {
      flushParagraph()
      elements.push(
        <li key={elements.length} className="mono text-sm mb-2 text-text list-disc ml-6 border-l border-border pl-2">
          {line.slice(2)}
        </li>
      )
    } else if (line.trim() === '---') {
      flushParagraph()
      elements.push(
        <hr key={elements.length} className="border-t-2 border-border my-8" />
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
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="technical-border p-4 bg-bg/30">
          <div className="flex items-center gap-4 pb-4 border-b-2 border-b-border">
            <h2 className="mono text-2xl font-bold text-left">Writing</h2>
            <div className="technical-border px-3 py-1 bg-bg/20">
              <div className="mono text-xs text-border">Technical Documentation</div>
            </div>
          </div>
        </div>
        
        <div className="technical-border p-4 bg-bg/30">
          <div className="grid gap-3">
            {writings.map(post => (
              <div key={post.slug} className="technical-border bg-bg/20 overflow-hidden">
                <button
                  onClick={() => setSelectedPost(post.slug)}
                  className="mono text-sm text-left w-full hover:bg-accent/20 transition-colors text-text p-4 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="technical-border p-2 bg-bg/10 font-medium group-hover:text-accent transition-colors">
                        {post.title}
                      </div>
                      <div className="text-xs text-border mt-2">
                        {post.date} • Technical Analysis
                      </div>
                    </div>
                    <div className="technical-border p-2 bg-bg/10 mono text-xs text-border ml-4">
                      →
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedWriting && (
        <div className="technical-border bg-bg/40 overflow-hidden">
          <div className="technical-border border-b border-border bg-bg/30 p-4">
            <div className="technical-border p-2 bg-bg/20">
              <button
                onClick={() => setSelectedPost(null)}
                className="mono text-xs border border-border px-3 py-1 hover:bg-accent/20 transition-colors flex items-center gap-2"
              >
                ← back to index
              </button>
            </div>
          </div>
          
          <div className="technical-border p-6 bg-bg/30">
            <div className="technical-border mb-6 pb-4 border-b-2 border-b-border bg-bg/20 p-4">
              <h1 className="mono text-3xl font-bold mb-2 text-text">
                {selectedWriting.title}
              </h1>
              <div className="technical-border p-2 bg-bg/10 mono text-xs text-border">
                Published: {selectedWriting.date} • Technical Documentation
              </div>
            </div>
            
            <article className="prose prose-invert max-w-none">
              <div className="technical-border p-4 bg-bg/20 mono text-sm leading-relaxed text-text">
                {parseMarkdown(selectedWriting.content)}
              </div>
            </article>
          </div>
        </div>
      )}
    </div>
  )
}

export default WritingSection