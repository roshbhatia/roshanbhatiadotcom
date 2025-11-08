import React from 'react'
import { Button } from './ui/button'
// import { useTheme } from '../contexts/ThemeContext'

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'design', label: 'Design System' },
    { id: 'demo', label: 'Demo' },
  ]

  return (
    <nav className="w-full mb-16">
      <div className="technical-border p-4 bg-bg/50">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-6">
            <div className="mono text-xl text-left">roshanbhatia.com</div>
            <div className="flex gap-2 mt-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onPageChange(item.id)}
                  className="mono text-xs"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="mono text-xs text-border">SYSTEM ONLINE</div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation