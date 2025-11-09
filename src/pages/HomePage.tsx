import React, { useState, useEffect } from 'react'
import WritingSection from '../WritingSection'

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'light'
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
        setReadme(`kubernetes controllers @Nike-Inc (Senior Software Engineer)

formerly:

backend, platform, and site reliability @pinginc (Senior Software Engineer)
observability integrations and site reliabililty @VirtualInstruments (Software Engineer, Site Reliability Engineer)

also formerly (but short lived):

kubernetes controllers, multicloud k8s, react @shipyard (Senior Software Engineer)
site reliability working on multicloud and baremetal Kubernetes @dgraph-io (Site Reliability Engineer)

i like:

distributed systems
platform and infrastructure
designing for scale

connect:
github: https://github.com/roshbhatia
linkedin: https://linkedin.com/in/roshanbhatia`)
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



const HomePage: React.FC = () => {
  return (
    <>
      <ThemeToggle />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="content-section">
            <div className="content-card">
              <div className="mb-4">
                <span className="text-section text-accent">[</span>
                <span className="text-section mx-2">README.MD</span>
                <span className="text-section text-accent">]</span>
              </div>
              <GitHubReadme />
            </div>
          </section>
          
          <section className="content-section">
            <div className="content-card">
              <div className="mb-4">
                <span className="text-section text-accent">[</span>
                <span className="text-section mx-2">WRITING</span>
                <span className="text-section text-accent">]</span>
              </div>
              <WritingSection />
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default HomePage