import { useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import Navigation from './components/Navigation.tsx'
import HomePage from './pages/HomePage.tsx'
import DesignSystem from './pages/DesignSystem.tsx'
import DemoPage from './pages/DemoPage.tsx'
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
      <div className="sheet-border m-2 p-8">
        <div className="frame-border p-6">
          <div className="grid grid-cols-12 gap-1">
            {/* Header Row */}
            <div className="col-span-12 grid grid-cols-12 gap-1 mb-4">
              <div className="col-span-8 cell-border p-3">
                <Navigation currentPage={currentPage} onPageChange={(page) => setCurrentPage(page as 'home' | 'design' | 'demo')} />
              </div>
              <div className="col-span-4 cell-border p-3">
                <div className="text-xs text-border mono">SYSTEM STATUS: ONLINE</div>
                <div className="text-xs text-border mono">VERSION: 1.0.0</div>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="col-span-12 grid grid-cols-12 gap-1">
              <div className="col-span-12 cell-border p-4">
                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-12">
                    {renderPage()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Row */}
            <div className="col-span-12 grid grid-cols-12 gap-1 mt-4">
              <div className="col-span-3 cell-border p-2">
                <div className="text-xs text-border mono">CONTACT</div>
              </div>
              <div className="col-span-3 cell-border p-2">
                <div className="text-xs text-border mono">GITHUB</div>
              </div>
              <div className="col-span-3 cell-border p-2">
                <div className="text-xs text-border mono">LINKEDIN</div>
              </div>
              <div className="col-span-3 cell-border p-2">
                <div className="text-xs text-border mono">EMAIL</div>
              </div>
            </div>
          </div>
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