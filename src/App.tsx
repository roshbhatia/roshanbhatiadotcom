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
    <footer className="border-box p-6 mt-8 technical-border corner-markers">
      <div className="flex justify-between items-center">
        <div className="mono text-small secondary-text" data-test="version-info">
          VERSION: <span data-test="build-time">{COMMIT_SHA}</span>
        </div>
        <button
          onClick={cycleTheme}
          className="theme-toggle corner-markers measurement-indicators"
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

  return (
    <div className="min-h-screen bg-bg text-text engineering-grid" data-theme={theme}>
      <div className="sheet-border m-4 p-6 md:m-6 md:p-8 schematic-container measurement-indicators max-w-7xl mx-auto">
        {/* Main Content */}
        <main className="border-box p-6 md:p-8 technical-border">
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
