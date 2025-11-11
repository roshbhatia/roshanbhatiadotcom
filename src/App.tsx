import React from 'react'
import HomePage from '@/pages/HomePage.tsx'
import { useTheme } from './contexts/ThemeContext'
import { COMMIT_SHA } from './version'
import './styles/globals.css'

const Footer: React.FC = () => {
  const { theme, cycleTheme } = useTheme()

  const getThemeDisplay = (theme: string) => {
    switch (theme) {
      case 'dark': return 'MONO'
      case 'light': return 'PAPER'
      case 'gruvbox-light': return 'GRUV-L'
      case 'gruvbox-dark': return 'GRUV-D'
      case 'nord-dark': return 'NORD'
      default: return 'PAPER'
    }
  }

  return (
    <footer className="mt-12 pt-6 border-t border-border">
      <div className="flex justify-between items-center text-small mb-4">
        <div className="mono secondary-text" data-test="version-info">
          [v{COMMIT_SHA}]
        </div>
        <button
          onClick={cycleTheme}
          className="mono accent-text hover:text-text"
          data-test="theme-toggle"
        >
          [{getThemeDisplay(theme)}]
        </button>
      </div>
      <div className="mono text-small">
        <span className="accent-text">visitor@roshanbhatia.com</span>
        <span className="secondary-text">:</span>
        <span className="text-text">~</span>
        <span className="secondary-text">$</span>
        <span className="cursor-blink ml-1"></span>
      </div>
    </footer>
  )
}

function AppContent() {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen bg-bg text-text" data-theme={theme}>
      {/* Windows 95 style title bar */}
      <div className="bg-code-bg border-b-2 border-border flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          <span className="mono text-small">Terminal - visitor@roshanbhatia.com</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="mono text-small px-3 py-0 border border-border bg-cell-bg hover:bg-code-bg">_</button>
          <button className="mono text-small px-3 py-0 border border-border bg-cell-bg hover:bg-code-bg">□</button>
          <button className="mono text-small px-3 py-0 border border-border bg-cell-bg hover:bg-code-bg">×</button>
        </div>
      </div>
      <div className="max-w-5xl p-8 pl-12">
        {/* Version echo command */}
        <div className="mono text-small mb-2">
          <span className="accent-text">visitor@roshanbhatia.com</span>
          <span className="secondary-text">:</span>
          <span className="text-text">~</span>
          <span className="secondary-text">$ echo WebsiteVersion:$(git rev-parse HEAD)</span>
        </div>
        <div className="mono text-small mb-8">
          WebsiteVersion:{COMMIT_SHA}
        </div>

        {/* Main Content */}
        <main>
          <HomePage />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App
export { Footer }
