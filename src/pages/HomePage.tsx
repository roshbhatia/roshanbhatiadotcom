import React from 'react'
import WritingSection from '../WritingSection'

const HomePage: React.FC = () => {
  return (
    <div className="w-full space-y-4">
      {/* Technical Data Sheet Header */}
      <section className="grid grid-cols-12 gap-1">
        <div className="col-span-12 cell-border p-4">
          <div className="grid grid-cols-12 gap-1">
            {/* Name Block */}
            <div className="col-span-8 grid-cell p-4">
              <div className="grid grid-cols-1 gap-1">
                <div className="cell-border p-3">
                  <div className="mono text-2xl font-bold text-text">ROSHAN BHATIA</div>
                  <div className="mono text-xs text-border">SUBJECT: SOFTWARE ENGINEER</div>
                </div>
                <div className="cell-border p-2">
                  <div className="mono text-sm text-text">SENIOR SOFTWARE ENGINEER</div>
                  <div className="mono text-xs text-border">NIKE INC • KUBERNETES CONTROLLERS</div>
                </div>
              </div>
            </div>
            
            {/* Status Panel */}
            <div className="col-span-4 grid-cell p-4">
              <div className="grid grid-cols-1 gap-1">
                <div className="cell-border p-2">
                  <div className="mono text-xs text-border">STATUS</div>
                  <div className="mono text-sm text-accent">ACTIVE</div>
                </div>
                <div className="cell-border p-2">
                  <div className="mono text-xs text-border">SPECIALIZATION</div>
                  <div className="mono text-sm text-text">PLATFORM ENG</div>
                </div>
                <div className="cell-border p-2">
                  <div className="mono text-xs text-border">CLEARANCE</div>
                  <div className="mono text-sm text-text">LEVEL 4</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Grid */}
      <section className="grid grid-cols-12 gap-1">
        <div className="col-span-12 cell-border p-4">
          <div className="grid grid-cols-12 gap-1">
            <div className="col-span-6 grid-cell p-3">
              <div className="mono text-sm font-semibold text-accent mb-2">CURRENT ASSIGNMENT</div>
              <div className="grid grid-cols-1 gap-1">
                <div className="cell-border p-2">
                  <div className="mono text-xs text-border">ORGANIZATION</div>
                  <div className="mono text-sm text-text">NIKE INC</div>
                </div>
                <div className="cell-border p-2">
                  <div className="mono text-xs text-border">ROLE</div>
                  <div className="mono text-sm text-text">SENIOR SOFTWARE ENGINEER</div>
                </div>
                <div className="cell-border p-2">
                  <div className="mono text-xs text-border">DOMAIN</div>
                  <div className="mono text-sm text-text">KUBERNETES CONTROLLERS</div>
                </div>
              </div>
            </div>
            
            <div className="col-span-6 grid-cell p-3">
              <div className="mono text-sm font-semibold text-accent mb-2">TECHNICAL MATRIX</div>
              <div className="grid grid-cols-2 gap-1">
                <div className="cell-border p-2">
                  <div className="mono text-xs text-border">DISTRIBUTED</div>
                  <div className="mono text-sm text-text">SYSTEMS</div>
                </div>
                <div className="cell-border p-2">
                  <div className="mono text-xs text-border">PLATFORM</div>
                  <div className="mono text-sm text-text">ENGINEERING</div>
                </div>
                <div className="cell-border p-2">
                  <div className="mono text-xs text-border">INFRASTRUCTURE</div>
                  <div className="mono text-sm text-text">AS CODE</div>
                </div>
                <div className="cell-border p-2">
                  <div className="mono text-xs text-border">SYSTEM</div>
                  <div className="mono text-sm text-text">DESIGN</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Previous Assignments */}
      <section className="grid grid-cols-12 gap-1">
        <div className="col-span-12 cell-border p-4">
          <div className="mono text-sm font-semibold text-accent mb-3">PREVIOUS ASSIGNMENTS</div>
          <div className="grid grid-cols-12 gap-1">
            <div className="col-span-3 cell-border p-2">
              <div className="mono text-xs text-border">ORGANIZATION</div>
              <div className="mono text-sm text-text">PING INC</div>
              <div className="mono text-xs text-border mt-1">ROLE</div>
              <div className="mono text-sm text-text">SENIOR SWE</div>
            </div>
            <div className="col-span-3 cell-border p-2">
              <div className="mono text-xs text-border">ORGANIZATION</div>
              <div className="mono text-sm text-text">VIRTUAL INSTRUMENTS</div>
              <div className="mono text-xs text-border mt-1">ROLE</div>
              <div className="mono text-sm text-text">SRE</div>
            </div>
            <div className="col-span-3 cell-border p-2">
              <div className="mono text-xs text-border">ORGANIZATION</div>
              <div className="mono text-sm text-text">SHIPYARD</div>
              <div className="mono text-xs text-border mt-1">ROLE</div>
              <div className="mono text-sm text-text">SENIOR SWE</div>
            </div>
            <div className="col-span-3 cell-border p-2">
              <div className="mono text-xs text-border">ORGANIZATION</div>
              <div className="mono text-sm text-text">DGRAPH LABS</div>
              <div className="mono text-xs text-border mt-1">ROLE</div>
              <div className="mono text-sm text-text">SRE</div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="grid grid-cols-12 gap-1">
        <div className="col-span-12 cell-border p-4">
          <div className="mono text-sm font-semibold text-accent mb-3">TECHNICAL SPECIFICATIONS</div>
          <div className="grid grid-cols-12 gap-1">
            <div className="col-span-4 cell-border p-2">
              <div className="mono text-xs text-border">KUBERNETES</div>
              <div className="mono text-xs text-text mt-1">• CONTROLLERS</div>
              <div className="mono text-xs text-text">• OPERATORS</div>
              <div className="mono text-xs text-text">• CUSTOM RESOURCES</div>
              <div className="mono text-xs text-text">• CLUSTER MGMT</div>
            </div>
            <div className="col-span-4 cell-border p-2">
              <div className="mono text-xs text-border">PLATFORM ENG</div>
              <div className="mono text-xs text-text mt-1">• IAC</div>
              <div className="mono text-xs text-text">• CI/CD</div>
              <div className="mono text-xs text-text">• DEVEX</div>
              <div className="mono text-xs text-text">• AUTOMATION</div>
            </div>
            <div className="col-span-4 cell-border p-2">
              <div className="mono text-xs text-border">SRE</div>
              <div className="mono text-xs text-text mt-1">• MONITORING</div>
              <div className="mono text-xs text-text">• ALERTING</div>
              <div className="mono text-xs text-text">• RELIABILITY</div>
              <div className="mono text-xs text-text">• OBSERVABILITY</div>
            </div>
            <div className="col-span-4 cell-border p-2">
              <div className="mono text-xs text-border">BACKEND</div>
              <div className="mono text-xs text-text mt-1">• REST APIS</div>
              <div className="mono text-xs text-text">• GRAPHQL</div>
              <div className="mono text-xs text-text">• MICROSERVICES</div>
              <div className="mono text-xs text-text">• SOA</div>
            </div>
            <div className="col-span-4 cell-border p-2">
              <div className="mono text-xs text-border">FRONTEND</div>
              <div className="mono text-xs text-text mt-1">• REACT</div>
              <div className="mono text-xs text-text">• TYPESCRIPT</div>
              <div className="mono text-xs text-text">• DESIGN SYSTEMS</div>
              <div className="mono text-xs text-text">• WEB APPS</div>
            </div>
            <div className="col-span-4 cell-border p-2">
              <div className="mono text-xs text-border">SYSTEMS</div>
              <div className="mono text-xs text-text mt-1">• DISTRIBUTED</div>
              <div className="mono text-xs text-text">• EVENT-DRIVEN</div>
              <div className="mono text-xs text-text">• SCALABLE</div>
              <div className="mono text-xs text-text">• RESILIENT</div>
            </div>
          </div>
        </div>
      </section>

      {/* Writing Section */}
      <section className="grid grid-cols-12 gap-1">
        <div className="col-span-12 cell-border p-4">
          <WritingSection />
        </div>
      </section>
    </div>
  )
}

export default HomePage