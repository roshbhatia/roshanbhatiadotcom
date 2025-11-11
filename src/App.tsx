import React from 'react'
import HomePage from '@/pages/HomePage.tsx'
import { useTheme } from './contexts/ThemeContext'
import { useModals } from '@components/page/ModalContext'
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
    <footer className="sticky bottom-0 z-50 mt-12 pt-6 pb-4 border-t border-border bg-bg">
      <div className="flex justify-between items-center text-small max-w-6xl mx-auto px-8">
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
    </footer>
  )
}

function AppContent() {
  const { theme } = useTheme()
  const { modalStack } = useModals()
  const hasOpenModals = modalStack.length > 0

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col" data-theme={theme}>
      {/* Windows 95 style title bar - fixed at top, hidden when modal is open */}
      {!hasOpenModals && (
        <div className="sticky top-0 z-50 bg-code-bg border-b-2 border-border flex items-center justify-end px-2 py-1">
          <div className="flex items-center gap-1">
            <button className="mono text-small px-3 py-0 border border-border bg-cell-bg hover:bg-code-bg">_</button>
            <button className="mono text-small px-3 py-0 border border-border bg-cell-bg hover:bg-code-bg">□</button>
            <button className="mono text-small px-3 py-0 border border-border bg-cell-bg hover:bg-code-bg">×</button>
          </div>
        </div>
      )}
      <div className="flex-1 max-w-6xl mx-auto p-8 w-full">
        {/* Main Content */}
        <main>
          <HomePage />
        </main>

        {/* Footer - hidden when modal is open */}
        {!hasOpenModals && <Footer />}
      </div>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App
export { Footer }
