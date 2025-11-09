import * as React from "react"
import { cva } from "class-variance-authority"
import { Copy, Check } from "lucide-react"

import { cn } from "@/lib/utils"

const terminalVariants = cva(
  "relative rounded-lg border overflow-hidden bg-black text-green-400 font-mono",
  {
    variants: {
      variant: {
        default: "border-border",
        secondary: "border-border/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TerminalProps extends React.HTMLAttributes<HTMLDivElement> {
  showCopy?: boolean
  children: React.ReactNode
}

const Terminal = React.forwardRef<HTMLDivElement, TerminalProps>(
  ({ className, showCopy = true, children, ...props }, ref) => {
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
        className={cn(terminalVariants({ variant: "default" }), className)}
        {...props}
      >
        {showCopy && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 rounded-md border border-border/50 bg-bg/50 hover:bg-border/80 transition-colors text-green-400"
            aria-label="Copy terminal output"
          >
            <Copy className={cn("h-4 w-4", copied && "hidden")} />
            <Check className={cn("h-4 w-4 text-green-500", !copied && "hidden")} />
          </button>
        )}
        <div className="p-4 overflow-x-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="text-xs text-green-400">$</div>
          </div>
          <pre className="text-sm font-mono">
            {children}
          </pre>
        </div>
      </div>
    )
  }
)
Terminal.displayName = "Terminal"

export { Terminal }