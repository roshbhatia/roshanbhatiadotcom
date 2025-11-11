import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'gruvbox-light' | 'gruvbox-dark' | 'nord-dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    // Return default theme for SSR/static generation
    return {
      theme: 'light',
      toggleTheme: () => {},
      cycleTheme: () => {}
    }
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme
    return savedTheme || 'light'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const cycleTheme = () => {
    const themes: Theme[] = ['dark', 'light', 'gruvbox-light', 'gruvbox-dark', 'nord-dark']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % themes.length : 0
    setTheme(themes[nextIndex] as Theme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}