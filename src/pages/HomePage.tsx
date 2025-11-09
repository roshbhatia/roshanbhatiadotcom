import React, { useState, useEffect } from 'react'
import WritingSection from '../WritingSection'

const GitHubReadme: React.FC = () => {
  const [readme, setReadme] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://api.github.com/repos/roshbhatia/roshanbhatia/contents/README.md')
      .then(res => res.json())
      .then(data => {
        const content = atob(data.content)
        setReadme(content)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-body text-text">Loading README...</div>
  }

  if (!readme) {
    return <div className="text-body text-text">Unable to load README</div>
  }

  return (
    <div className="prose max-w-none">
      <pre className="mono text-sm whitespace-pre-wrap">{readme}</pre>
    </div>
  )
}

const HeroSection: React.FC = () => {
  return (
    <section className="content-section">
      <div className="content-card">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="hero-text">
            <h1 className="text-hero mb-4">ROSHAN BHATIA</h1>
            <p className="text-section mb-2">Senior Software Engineer</p>
            <p className="text-body text-text mb-4">Platform Engineering & Kubernetes Specialist</p>
            <div className="flex flex-wrap gap-4">
              <div className="mono text-sm">
                <span className="text-text">Nike Inc</span>
                <span className="mx-2">•</span>
                <span className="accent-text">Kubernetes Controllers</span>
              </div>
            </div>
          </div>
          <div className="hero-visual flex justify-center">
            <img 
              src="/the_cloud.png" 
              alt="Cloud Architecture Diagram" 
              className="w-full max-w-sm rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

const ExperienceSection: React.FC = () => {
  const experiences = [
    {
      company: "Nike Inc",
      role: "Senior Software Engineer",
      domain: "Kubernetes Controllers",
      current: true
    },
    {
      company: "Ping Inc",
      role: "Senior SWE",
      domain: "Identity & Access"
    },
    {
      company: "Virtual Instruments",
      role: "SRE",
      domain: "Observability"
    },
    {
      company: "Shipyard",
      role: "Senior SWE", 
      domain: "Container Platforms"
    },
    {
      company: "Dgraph Labs",
      role: "SRE",
      domain: "Graph Database"
    }
  ]

  return (
    <section className="content-section">
      <div className="content-card">
        <h2 className="text-section mb-6">Experience</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experiences.map((exp, index) => (
            <div key={index} className="card-hover border border-border rounded-lg p-4">
              {exp.current && (
                <div className="inline-block px-2 py-1 bg-accent/20 text-accent text-xs font-semibold rounded mb-2">
                  CURRENT
                </div>
              )}
              <h3 className="font-semibold text-text mb-1">{exp.company}</h3>
              <p className="text-body text-text mb-1">{exp.role}</p>
              <p className="text-sm text-text/70">{exp.domain}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const SkillsSection: React.FC = () => {
  const skills = [
    {
      category: "Kubernetes",
      items: ["Controllers", "Operators", "Custom Resources", "Cluster Management"]
    },
    {
      category: "Platform Engineering", 
      items: ["IaC", "CI/CD", "DevEx", "Automation"]
    },
    {
      category: "SRE",
      items: ["Monitoring", "Alerting", "Reliability", "Observability"]
    },
    {
      category: "Backend",
      items: ["REST APIs", "GraphQL", "Microservices", "SOA"]
    },
    {
      category: "Frontend",
      items: ["React", "TypeScript", "Design Systems", "Web Apps"]
    },
    {
      category: "Systems",
      items: ["Distributed", "Event-Driven", "Scalable", "Resilient"]
    }
  ]

  return (
    <section className="content-section">
      <div className="content-card">
        <h2 className="text-section mb-6">Technical Skills</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skillGroup, index) => (
            <div key={index} className="card-hover">
              <h3 className="font-semibold text-text mb-3 mono">{skillGroup.category}</h3>
              <ul className="space-y-2">
                {skillGroup.items.map((skill, skillIndex) => (
                  <li key={skillIndex} className="text-body text-text flex items-center">
                    <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const HomePage: React.FC = () => {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <HeroSection />
      <ExperienceSection />
      <SkillsSection />
      <section className="content-section">
        <div className="content-card">
          <h2 className="text-section mb-6">About & Projects</h2>
          <GitHubReadme />
        </div>
      </section>
      <section className="content-section">
        <div className="content-card">
          <h2 className="text-section mb-6">Writing</h2>
          <WritingSection />
        </div>
      </section>
    </main>
  )
}

export default HomePage