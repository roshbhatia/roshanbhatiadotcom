import React from 'react'
import HomePage from '@/pages/HomePage.tsx'
import './styles/globals.css'

function AppContent() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="sheet-border m-1 p-2">
        <div className="border-box p-1">
          {/* Header */}
          <div className="border-box p-2 mb-2">
            <div className="flex justify-between">
              <div className="mono text-body">ROSHANBHATIA.COM</div>
              <div className="mono text-xs">VERSION: CED042D</div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="border-box p-2">
            <HomePage />
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