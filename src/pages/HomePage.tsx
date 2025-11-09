import React, { useState, useEffect } from 'react'
import WritingSection from '../WritingSection'

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <button 
      onClick={toggleTheme}
      className="theme-toggle"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}

const GitHubReadme: React.FC = () => {
  const [readme, setReadme] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReadme = async () => {
      try {
        // Try CORS proxy approach
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/'
        const githubUrl = 'https://raw.githubusercontent.com/roshbhatia/roshanbhatia/main/README.md'
        
        const response = await fetch(proxyUrl + githubUrl, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const content = await response.text()
        setReadme(content)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch README:', err)
        // Fallback to static content
        setReadme(`# Roshan Bhatia

Senior Software Engineer at Nike Inc. specializing in platform engineering and Kubernetes.

## Experience
- **Nike Inc** - Senior Software Engineer
  - Kubernetes controllers and platform engineering
  - Infrastructure automation and DevOps

## Skills
- Kubernetes & Containers
- Platform Engineering  
- Go, Python, TypeScript
- Cloud Infrastructure (AWS)
- DevOps & CI/CD

## Contact
- GitHub: roshbhatia
- LinkedIn: roshanbhatia`)
        setError(null)
      } finally {
        setLoading(false)
      }
    }

    fetchReadme()
  }, [])

  if (loading) {
    return (
      <div className="text-body text-text mono">
        [LOADING README...]
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-body text-text mono">
        [ERROR: {error}]
      </div>
    )
  }

  if (!readme) {
    return (
      <div className="text-body text-text mono">
        [NO README CONTENT]
      </div>
    )
  }

  return (
    <div className="mono text-sm leading-relaxed">
      <pre className="whitespace-pre-wrap">{readme}</pre>
    </div>
  )
}

const HeroSection: React.FC = () => {
  return (
    <section className="content-section">
      <div className="content-card">
        <div className="text-center">
          <h1 className="text-hero mb-4">ROSHAN BHATIA</h1>
          <div className="mb-6">
            <span className="text-section text-accent">[</span>
            <span className="text-section mx-2">SENIOR SOFTWARE ENGINEER</span>
            <span className="text-section text-accent">]</span>
          </div>
          <div className="mono text-body text-text mb-4">
            <span className="text-accent">{'{'}</span>
            <span> PLATFORM ENGINEERING & KUBERNETES SPECIALIST</span>
            <span className="text-accent">{'}'}</span>
          </div>
          <div className="mono text-sm text-text/70">
            <span className="text-accent">/*</span>
            <span> Nike Inc • Kubernetes Controllers</span>
            <span className="text-accent"> */</span>
          </div>
        </div>
      </div>
    </section>
  )
}

const HomePage: React.FC = () => {
  return (
    <>
      <ThemeToggle />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <HeroSection />
        
        <section className="content-section">
          <div className="content-card">
            <div className="mb-6">
              <span className="text-section text-accent">[</span>
              <span className="text-section mx-2">README.MD</span>
              <span className="text-section text-accent">]</span>
            </div>
            <GitHubReadme />
          </div>
        </section>
        
        <section className="content-section">
          <div className="content-card">
            <div className="mb-6">
              <span className="text-section text-accent">[</span>
              <span className="text-section mx-2">WRITING</span>
              <span className="text-section text-accent">]</span>
            </div>
            <WritingSection />
          </div>
        </section>
      </main>
    </>
  )
}

export default HomePage