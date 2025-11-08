import { useState } from 'react'
import './styles/globals.css'

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <div className="min-h-screen bg-bg text-text p-8">
      <header className="max-w-4xl mx-auto mb-16">
        <nav className="flex justify-between items-center">
          <div className="mono text-xl">roshanbhatia.com</div>
          <button 
            onClick={toggleTheme}
            className="mono text-sm border border-border px-3 py-1 hover:bg-accent/20"
          >
            {theme === 'dark' ? 'light' : 'dark'}
          </button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto space-y-16">
        <section className="text-center space-y-4">
          <h1 className="mono text-4xl font-bold">Roshan Bhatia</h1>
          <p className="mono text-lg text-border">kubernetes controllers @Nike-Inc (Senior Software Engineer)</p>
          <div className="max-w-2xl mx-auto space-y-2 text-sm">
            <p className="text-border">formerly:</p>
            <p>backend, platform, and site reliability @pinginc (Senior Software Engineer)</p>
            <p>observability integrations and site reliabililty @VirtualInstruments (Software Engineer, Site Reliability Engineer)</p>
            <p className="text-border">also formerly (but short lived):</p>
            <p>kubernetes controllers, multicloud k8s, react @shipyard (Senior Software Engineer)</p>
            <p>site reliability working on multicloud and baremetal Kubernetes @dgraph-io (Site Reliability Engineer)</p>
            <p className="text-border">i like:</p>
            <p>distributed systems</p>
            <p>platform and infrastructure</p>
            <p>designing for scale</p>
          </div>
        </section>

        <section>
          <h2 className="mono text-2xl font-bold mb-8">The Cloud</h2>
          <div className="flex justify-center">
            <img src="/the_cloud.png" alt="The Cloud" className="max-w-md border border-border" />
          </div>
        </section>

        <section>
          <h2 className="mono text-2xl font-bold mb-8">Writing</h2>
          <div className="space-y-4 text-sm">
            <p>Static site generated from markdown commits in this repository.</p>
          </div>
        </section>

        <section>
          <h2 className="mono text-2xl font-bold mb-8">Contact</h2>
          <div className="flex gap-6">
            <a href="https://github.com/roshbhatia" className="mono text-sm border border-border px-3 py-1 hover:bg-accent/20">
              GitHub
            </a>
            <a href="https://linkedin.com/in/roshan-bhatia-2b1970a7/" className="mono text-sm border border-border px-3 py-1 hover:bg-accent/20">
              LinkedIn
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App