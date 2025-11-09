import React, { useState, useEffect } from 'react'
import WritingSection from '../WritingSection'

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
      <div className="text-body mono content-spacing technical-border">
        <div className="accent-text">[LOADING README...]</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-body mono content-spacing technical-border">
        <div className="accent-text">[ERROR: {error}]</div>
      </div>
    )
  }

  if (!readme) {
    return (
      <div className="text-body mono content-spacing technical-border">
        <div className="muted-text">[NO README CONTENT]</div>
      </div>
    )
  }

  return (
    <div className="mono text-body content-spacing grid-overlay">
      <pre className="whitespace-pre-wrap">{readme}</pre>
    </div>
  )
}



const HomePage: React.FC = () => {
  return (
    <>
      <main className="p-8">
        <div className="technical-grid gap-8">
          <section className="content-section">
            <div className="content-card schematic-section">
              <div className="mb-6 breathing-room">
                <span className="text-section accent-text">[README.MD]</span>
              </div>
              <div className="breathing-room">
                <GitHubReadme />
              </div>
            </div>
          </section>
          
          <section className="content-section">
            <div className="content-card schematic-section">
              <div className="mb-6 breathing-room">
                <span className="text-section accent-text">[WRITING]</span>
              </div>
              <div className="breathing-room">
                <WritingSection />
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default HomePage