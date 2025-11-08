import { useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import Navigation from './components/Navigation'
import HomePage from './pages/HomePage'
import DesignSystem from './pages/DesignSystem'
import DemoPage from './pages/DemoPage'
import './styles/globals.css'

function AppContent() {
  const [currentPage, setCurrentPage] = useState<'home' | 'design' | 'demo'>('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'design':
        return <DesignSystem />
      case 'demo':
        return <DemoPage />
      case 'home':
      default:
        return <HomePage />
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text engineering-grid">
      <div className="technical-border m-4 p-6 bg-bg/80">
        <div className="technical-border p-4 bg-bg/60">
          <Navigation currentPage={currentPage} onPageChange={(page) => setCurrentPage(page as 'home' | 'design' | 'demo')} />
          
          <main className="w-full mt-6">
            <div className="technical-border p-6 bg-bg/50">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App