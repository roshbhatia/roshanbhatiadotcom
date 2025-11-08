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
          <p className="mono text-lg text-border">Senior Software Engineer</p>
          <p className="max-w-2xl mx-auto">
            Building scalable cloud infrastructure and distributed systems.
          </p>
        </section>

        <section>
          <h2 className="mono text-2xl font-bold mb-8">Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border p-6 space-y-4">
              <h3 className="mono font-bold">kubanana</h3>
              <p className="text-sm">Kubernetes management tool</p>
              <div className="flex gap-2">
                <span className="mono text-xs border border-border px-2 py-1">TypeScript</span>
                <span className="mono text-xs border border-border px-2 py-1">Kubernetes</span>
              </div>
            </div>
            <div className="border border-border p-6 space-y-4">
              <h3 className="mono font-bold">grugnvim</h3>
              <p className="text-sm">Neovim configuration</p>
              <div className="flex gap-2">
                <span className="mono text-xs border border-border px-2 py-1">Lua</span>
                <span className="mono text-xs border border-border px-2 py-1">Neovim</span>
              </div>
            </div>
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