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
      <div className="flex justify-between items-center text-small">
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

  return (
    <div className="min-h-screen bg-bg text-text" data-theme={theme}>
      <div className="max-w-4xl mx-auto p-8">
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
