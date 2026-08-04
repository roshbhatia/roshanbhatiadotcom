import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { COMMIT_SHA } from '../version'

// Lives in its own module because both App and the blog post modal render it.
// It used to be exported from App.tsx, which WritingSection imported back —
// a cycle of App -> HomePage -> WritingSection -> App.
const Footer: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    // Not sticky. As a sticky element it sat over the bottom of the page and
    // hid the whole writing list behind itself on first load.
    <footer className="mt-12 pt-6 pb-4 border-t border-border bg-bg">
      <div className="flex justify-between items-center text-small max-w-6xl mx-auto px-8">
        <div className="mono secondary-text" data-test="version-info">
          [v{COMMIT_SHA}]
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="mono accent-text hover:text-text"
          data-test="theme-toggle"
          aria-pressed={theme === 'light'}
        >
          [{theme === 'dark' ? 'LIGHT' : 'DARK'} MODE]
        </button>
      </div>
    </footer>
  )
}

export default Footer
