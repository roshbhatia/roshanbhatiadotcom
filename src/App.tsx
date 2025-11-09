import React from 'react'
import HomePage from '@/pages/HomePage.tsx'
import { useTheme } from './contexts/ThemeContext'
import './styles/globals.css'

const ThemeToggle: React.FC = () => {
  const { theme, cycleTheme } = useTheme()

  const getThemeDisplay = (theme: string) => {
    switch (theme) {
      case 'dark': return 'MONO'
      case 'light': return 'PAPER'
      case 'gruvbox-light': return 'GRUV-L'
      case 'gruvbox-dark': return 'GRUV-D'
      case 'nord-dark': return 'NORD'
      default: return 'MONO'
    }
  }

  return (
    <button 
      onClick={cycleTheme}
      className="theme-toggle corner-markers measurement-indicators"
      style={{
        position: 'fixed',
        top: 'var(--space-lg)',
        right: 'var(--space-lg)',
        zIndex: 50
      }}
    >
      [{getThemeDisplay(theme)}]
    </button>
  )
}

function AppContent() {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen bg-bg text-text engineering-grid" data-theme={theme}>
      <ThemeToggle />
      <div className="sheet-border m-8 p-8 schematic-container measurement-indicators">
        {/* Header */}
        <header className="border-box p-8 mb-8 technical-border corner-markers">
          <div className="flex justify-between items-center">
            <div className="mono text-hero primary-text">ROSHANBHATIA.COM</div>
            <div className="mono text-small secondary-text">VERSION: CED042D</div>
          </div>
          <div className="industrial-divider mt-6"></div>
        </header>
        
        {/* Main Content */}
        <main className="border-box p-8 technical-border">
          <HomePage />
        </main>
      </div>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App