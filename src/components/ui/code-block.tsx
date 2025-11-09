import * as React from "react"
import { cva } from "class-variance-authority"
import { Copy, Check } from "lucide-react"

import { cn } from "@/lib/utils"

const codeBlockVariants = cva(
  "relative rounded-lg border overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-border bg-bg",
        secondary: "border-border/50 bg-bg/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  language?: string
  showCopy?: boolean
  children: React.ReactNode
}

const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  ({ className, language, showCopy = true, children, ...props }, ref) => {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = async () => {
      if (typeof children === 'string') {
        await navigator.clipboard.writeText(children)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }

    return (
      <div
        ref={ref}
        className={cn(codeBlockVariants({ variant: "default" }), className)}
        {...props}
      >
        {showCopy && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 rounded-md border border-border/50 bg-bg/50 hover:bg-border/80 transition-colors"
            aria-label="Copy code"
          >
            <Copy className={cn("h-4 w-4", copied && "hidden")} />
            <Check className={cn("h-4 w-4 text-green-500", !copied && "hidden")} />
          </button>
        )}
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm">
            <code className={language && `language-${language}`}>
              {children}
            </code>
          </pre>
        </div>
      </div>
    )
  }
)
CodeBlock.displayName = "CodeBlock"

export { CodeBlock }