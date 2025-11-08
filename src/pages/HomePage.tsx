import React from 'react'
import WritingSection from '../WritingSection'

const HomePage: React.FC = () => {
  return (
    <div className="w-full space-y-16">
      {/* Hero Section */}
      <section className="space-y-8">
        <div className="technical-border p-8 bg-bg/40">
          <div className="technical-border p-6 bg-bg/30">
            <div className="space-y-4">
              <div className="technical-border p-4 bg-bg/20">
                <h1 className="mono text-4xl md:text-6xl font-bold text-left">Roshan Bhatia</h1>
              </div>
              <div className="technical-border p-3 bg-bg/20">
                <div className="mono text-lg md:text-xl text-border text-left">
                  Senior Software Engineer @ Nike-Inc
                </div>
              </div>
              <div className="technical-border p-2 bg-bg/20">
                <div className="mono text-sm text-accent">
                  Kubernetes Controllers • Platform Engineering
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="technical-border p-4 bg-bg/40">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="technical-border p-4 bg-bg/30">
              <div className="technical-border p-2 bg-bg/20">
                <h3 className="mono text-sm font-semibold mb-3 text-accent">Current Role</h3>
              </div>
              <div className="space-y-2 text-sm mt-3">
                <p className="text-text">Senior Software Engineer</p>
                <p className="text-border">Nike-Inc</p>
                <p className="text-border">Kubernetes Controllers Development</p>
              </div>
            </div>

            <div className="technical-border p-4 bg-bg/30">
              <div className="technical-border p-2 bg-bg/20">
                <h3 className="mono text-sm font-semibold mb-3 text-accent">Technical Focus</h3>
              </div>
              <div className="space-y-1 text-sm mt-3">
                <p className="text-text">• Distributed Systems</p>
                <p className="text-text">• Platform Engineering</p>
                <p className="text-text">• Infrastructure as Code</p>
                <p className="text-text">• System Design & Scale</p>
              </div>
            </div>
          </div>
        </div>

        <div className="technical-border p-6 bg-bg/40">
          <div className="technical-border p-3 bg-bg/30">
            <h3 className="mono text-sm font-semibold text-accent">Previous Experience</h3>
          </div>
          <div className="space-y-3 text-sm mt-4">
            <div className="technical-border p-3 bg-bg/20 border-l-4 border-l-accent">
              <p className="text-text">Senior Software Engineer @ Ping</p>
              <p className="text-border">Backend, Platform, SRE</p>
            </div>
            <div className="technical-border p-3 bg-bg/20 border-l-4 border-l-accent">
              <p className="text-text">SRE @ Virtual Instruments</p>
              <p className="text-border">Observability & Reliability</p>
            </div>
            <div className="technical-border p-3 bg-bg/20 border-l-4 border-l-accent">
              <p className="text-text">Senior Software Engineer @ Shipyard</p>
              <p className="text-border">K8s, Multi-cloud, React</p>
            </div>
            <div className="technical-border p-3 bg-bg/20 border-l-4 border-l-accent">
              <p className="text-text">SRE @ Dgraph Labs</p>
              <p className="text-border">Multi-cloud & Bare-metal K8s</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Expertise Section */}
      <section className="space-y-6">
        <div className="technical-border p-4 bg-bg/40">
          <div className="flex items-center gap-4 pb-4 border-b-2 border-b-border">
            <h2 className="mono text-2xl font-semibold text-left">Technical Expertise</h2>
            <div className="technical-border px-3 py-1 bg-bg/30">
              <div className="mono text-xs text-border">Core Competencies</div>
            </div>
          </div>
        </div>
        
        <div className="technical-border p-6 bg-bg/40">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="technical-border p-4 bg-bg/30">
              <div className="technical-border p-2 bg-bg/20">
                <h3 className="mono text-sm font-semibold text-accent">Kubernetes</h3>
              </div>
              <div className="mono text-xs text-border mt-2">Container orchestration</div>
              <p className="text-xs text-text mt-2">
                Controllers, operators, custom resources, cluster management
              </p>
            </div>

            <div className="technical-border p-4 bg-bg/30">
              <div className="technical-border p-2 bg-bg/20">
                <h3 className="mono text-sm font-semibold text-accent">Platform Engineering</h3>
              </div>
              <div className="mono text-xs text-border mt-2">Developer platforms</div>
              <p className="text-xs text-text mt-2">
                Infrastructure as code, CI/CD, developer experience
              </p>
            </div>

            <div className="technical-border p-4 bg-bg/30">
              <div className="technical-border p-2 bg-bg/20">
                <h3 className="mono text-sm font-semibold text-accent">Site Reliability</h3>
              </div>
              <div className="mono text-xs text-border mt-2">Reliability engineering</div>
              <p className="text-xs text-text mt-2">
                Monitoring, alerting, system reliability principles
              </p>
            </div>

            <div className="technical-border p-4 bg-bg/30">
              <div className="technical-border p-2 bg-bg/20">
                <h3 className="mono text-sm font-semibold text-accent">Distributed Systems</h3>
              </div>
              <div className="mono text-xs text-border mt-2">System architecture</div>
              <p className="text-xs text-text mt-2">
                Microservices, event-driven architecture, system design
              </p>
            </div>

            <div className="technical-border p-4 bg-bg/30">
              <div className="technical-border p-2 bg-bg/20">
                <h3 className="mono text-sm font-semibold text-accent">Backend Development</h3>
              </div>
              <div className="mono text-xs text-border mt-2">API & services</div>
              <p className="text-xs text-text mt-2">
                REST APIs, GraphQL, service-oriented architecture
              </p>
            </div>

            <div className="technical-border p-4 bg-bg/30">
              <div className="technical-border p-2 bg-bg/20">
                <h3 className="mono text-sm font-semibold text-accent">Frontend Development</h3>
              </div>
              <div className="mono text-xs text-border mt-2">Web applications</div>
              <p className="text-xs text-text mt-2">
                React, TypeScript, design system implementation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Writing Section */}
      <section className="technical-border p-6 bg-bg/40">
        <WritingSection />
      </section>
    </div>
  )
}

export default HomePage