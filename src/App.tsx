import React from 'react'
import HomePage from '@/pages/HomePage.tsx'
import './styles/globals.css'

function AppContent() {
  return (
    <div className="min-h-screen bg-bg text-text engineering-grid">
      <div className="sheet-border m-2 p-8">
        <div className="frame-border p-6">
          <div className="grid grid-cols-12 gap-1">
            {/* Header Row */}
            <div className="col-span-12 grid grid-cols-12 gap-1 mb-4">
              <div className="col-span-8 cell-border p-3">
                <div className="mono text-xl text-left">roshanbhatia.com</div>
              </div>
              <div className="col-span-4 cell-border p-3">
                <div className="text-xs text-border mono text-right">VERSION: b7fafca</div>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="col-span-12 grid grid-cols-12 gap-1">
              <div className="col-span-12 cell-border p-3">
                <div className="grid grid-cols-12 gap-1">
                  <div className="col-span-12">
                    <HomePage />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Row */}
            <div className="col-span-12 grid grid-cols-12 gap-1 mt-4">
              <div className="col-span-6 cell-border p-2">
                <a 
                  href="https://github.com/roshbhatia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-accent mono hover:text-text transition-colors"
                >
                  GITHUB
                </a>
              </div>
              <div className="col-span-6 cell-border p-2">
                <a 
                  href="https://linkedin.com/in/roshanbhatia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-accent mono hover:text-text transition-colors"
                >
                  LINKEDIN
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App