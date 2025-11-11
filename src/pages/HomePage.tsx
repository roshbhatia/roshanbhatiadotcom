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
<a href="https://github.com/roshbhatia" target="_blank" rel="noopener noreferrer" style="color: var(--link); text-decoration: underline;">github: https://github.com/roshbhatia</a>
<a href="https://linkedin.com/in/roshanbhatia" target="_blank" rel="noopener noreferrer" style="color: var(--link); text-decoration: underline;">linkedin: https://linkedin.com/in/roshanbhatia</a>`)
        setError(null)
      } finally {
        setLoading(false)
      }
    }

    fetchReadme()
  }, [])

  if (loading) {
    return <div className="mono">loading...</div>
  }

  if (error) {
    return <div className="mono">error: {error}</div>
  }

  if (!readme) {
    return <div className="mono">no content</div>
  }

  return (
    <div className="mono whitespace-pre-wrap">
      <div dangerouslySetInnerHTML={{ __html: readme.replace(/\n/g, '<br>') }} />
    </div>
  )
}



const HomePage: React.FC = () => {
  return (
    <>
      <h1 className="sr-only" data-test="main-title">ROSHAN BHATIA</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section data-test="readme-section" className="content-card">
          <div className="flex items-center gap-2 mb-4">
            <span className="mono text-small secondary-text">$</span>
            <h2 className="text-section accent-text mono" data-test="readme-title">[README.MD]</h2>
          </div>
          <div className="mono text-small secondary-text mb-4">
            ┌{'─'.repeat(50)}┐
          </div>
          <div className="text-body">
            <GitHubReadme />
          </div>
          <div className="mono text-small secondary-text mt-4">
            └{'─'.repeat(50)}┘
          </div>
        </section>

        <section data-test="writing-section" className="content-card">
          <div className="flex items-center gap-2 mb-4">
            <span className="mono text-small secondary-text">$</span>
            <h2 className="text-section accent-text mono" data-test="writing-title">[WRITING]</h2>
          </div>
          <div className="mono text-small secondary-text mb-4">
            ┌{'─'.repeat(50)}┐
          </div>
          <div className="text-body">
            <WritingSection />
          </div>
          <div className="mono text-small secondary-text mt-4">
            └{'─'.repeat(50)}┘
          </div>
        </section>
      </div>
    </>
  )
}

export default HomePage
