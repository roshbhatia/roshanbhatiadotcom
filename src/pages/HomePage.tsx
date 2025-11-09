import React from 'react'
import WritingSection from '../WritingSection'

const HomePage: React.FC = () => {
  return (
    <div className="w-full section-spacing">
      {/* Technical Data Sheet Header */}
      <section className="grid grid-cols-12 gap-2">
        <div className="col-span-12 cell-border content-spacing">
          <div className="grid grid-cols-12 gap-2">
            {/* Name Block */}
            <div className="col-span-8 grid-cell content-spacing">
              <div className="space-y-3">
                <div>
                  <div className="mono text-3xl font-bold primary-text">ROSHAN BHATIA</div>
                  <div className="mono text-sm secondary-text mt-1">SUBJECT: SOFTWARE ENGINEER</div>
                </div>
                <div>
                  <div className="mono text-lg primary-text">SENIOR SOFTWARE ENGINEER</div>
                  <div className="mono text-sm secondary-text mt-1">NIKE INC • KUBERNETES CONTROLLERS</div>
                </div>
              </div>
            </div>
            
            {/* Status Panel */}
            <div className="col-span-4 grid-cell content-spacing">
              <div className="space-y-4">
                <div>
                  <div className="mono text-sm secondary-text">STATUS</div>
                  <div className="mono text-base accent-text mt-1">ACTIVE</div>
                </div>
                <div>
                  <div className="mono text-sm secondary-text">SPECIALIZATION</div>
                  <div className="mono text-base primary-text mt-1">PLATFORM ENG</div>
                </div>
                <div>
                  <div className="mono text-sm secondary-text">CLEARANCE</div>
                  <div className="mono text-base primary-text mt-1">LEVEL 4</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Grid */}
      <section className="grid grid-cols-12 gap-2">
        <div className="col-span-12 cell-border content-spacing">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-6 grid-cell content-spacing">
              <div className="mono text-lg font-semibold accent-text mb-4">CURRENT ASSIGNMENT</div>
              <div className="space-y-3">
                <div className="tight-spacing border-l-2 border-accent pl-3">
                  <div className="mono text-sm secondary-text">ORGANIZATION</div>
                  <div className="mono text-base primary-text mt-1">NIKE INC</div>
                </div>
                <div className="tight-spacing border-l-2 border-accent pl-3">
                  <div className="mono text-sm secondary-text">ROLE</div>
                  <div className="mono text-base primary-text mt-1">SENIOR SOFTWARE ENGINEER</div>
                </div>
                <div className="tight-spacing border-l-2 border-accent pl-3">
                  <div className="mono text-sm secondary-text">DOMAIN</div>
                  <div className="mono text-base primary-text mt-1">KUBERNETES CONTROLLERS</div>
                </div>
              </div>
            </div>
            
            <div className="col-span-6 grid-cell content-spacing">
              <div className="mono text-lg font-semibold accent-text mb-4">TECHNICAL MATRIX</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="tight-spacing">
                  <div className="mono text-sm secondary-text">DISTRIBUTED</div>
                  <div className="mono text-base primary-text mt-1">SYSTEMS</div>
                </div>
                <div className="tight-spacing">
                  <div className="mono text-sm secondary-text">PLATFORM</div>
                  <div className="mono text-base primary-text mt-1">ENGINEERING</div>
                </div>
                <div className="tight-spacing">
                  <div className="mono text-sm secondary-text">INFRASTRUCTURE</div>
                  <div className="mono text-base primary-text mt-1">AS CODE</div>
                </div>
                <div className="tight-spacing">
                  <div className="mono text-sm secondary-text">SYSTEM</div>
                  <div className="mono text-base primary-text mt-1">DESIGN</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Previous Assignments */}
      <section className="grid grid-cols-12 gap-2">
        <div className="col-span-12 cell-border content-spacing">
          <div className="mono text-lg font-semibold accent-text mb-4">PREVIOUS ASSIGNMENTS</div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3 tight-spacing">
              <div className="mono text-sm secondary-text">ORGANIZATION</div>
              <div className="mono text-base primary-text mt-1">PING INC</div>
              <div className="mono text-sm secondary-text mt-2">ROLE</div>
              <div className="mono text-base primary-text mt-1">SENIOR SWE</div>
            </div>
            <div className="col-span-3 tight-spacing">
              <div className="mono text-sm secondary-text">ORGANIZATION</div>
              <div className="mono text-base primary-text mt-1">VIRTUAL INSTRUMENTS</div>
              <div className="mono text-sm secondary-text mt-2">ROLE</div>
              <div className="mono text-base primary-text mt-1">SRE</div>
            </div>
            <div className="col-span-3 tight-spacing">
              <div className="mono text-sm secondary-text">ORGANIZATION</div>
              <div className="mono text-base primary-text mt-1">SHIPYARD</div>
              <div className="mono text-sm secondary-text mt-2">ROLE</div>
              <div className="mono text-base primary-text mt-1">SENIOR SWE</div>
            </div>
            <div className="col-span-3 tight-spacing">
              <div className="mono text-sm secondary-text">ORGANIZATION</div>
              <div className="mono text-base primary-text mt-1">DGRAPH LABS</div>
              <div className="mono text-sm secondary-text mt-2">ROLE</div>
              <div className="mono text-base primary-text mt-1">SRE</div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="grid grid-cols-12 gap-2">
        <div className="col-span-12 cell-border content-spacing">
          <div className="mono text-lg font-semibold accent-text mb-4">TECHNICAL SPECIFICATIONS</div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4 tight-spacing">
              <div className="mono text-sm secondary-text mb-2">KUBERNETES</div>
              <div className="space-y-1">
                <div className="mono text-sm primary-text">• CONTROLLERS</div>
                <div className="mono text-sm primary-text">• OPERATORS</div>
                <div className="mono text-sm primary-text">• CUSTOM RESOURCES</div>
                <div className="mono text-sm primary-text">• CLUSTER MGMT</div>
              </div>
            </div>
            <div className="col-span-4 tight-spacing">
              <div className="mono text-sm secondary-text mb-2">PLATFORM ENG</div>
              <div className="space-y-1">
                <div className="mono text-sm primary-text">• IAC</div>
                <div className="mono text-sm primary-text">• CI/CD</div>
                <div className="mono text-sm primary-text">• DEVEX</div>
                <div className="mono text-sm primary-text">• AUTOMATION</div>
              </div>
            </div>
            <div className="col-span-4 tight-spacing">
              <div className="mono text-sm secondary-text mb-2">SRE</div>
              <div className="space-y-1">
                <div className="mono text-sm primary-text">• MONITORING</div>
                <div className="mono text-sm primary-text">• ALERTING</div>
                <div className="mono text-sm primary-text">• RELIABILITY</div>
                <div className="mono text-sm primary-text">• OBSERVABILITY</div>
              </div>
            </div>
            <div className="col-span-4 tight-spacing">
              <div className="mono text-sm secondary-text mb-2">BACKEND</div>
              <div className="space-y-1">
                <div className="mono text-sm primary-text">• REST APIS</div>
                <div className="mono text-sm primary-text">• GRAPHQL</div>
                <div className="mono text-sm primary-text">• MICROSERVICES</div>
                <div className="mono text-sm primary-text">• SOA</div>
              </div>
            </div>
            <div className="col-span-4 tight-spacing">
              <div className="mono text-sm secondary-text mb-2">FRONTEND</div>
              <div className="space-y-1">
                <div className="mono text-sm primary-text">• REACT</div>
                <div className="mono text-sm primary-text">• TYPESCRIPT</div>
                <div className="mono text-sm primary-text">• DESIGN SYSTEMS</div>
                <div className="mono text-sm primary-text">• WEB APPS</div>
              </div>
            </div>
            <div className="col-span-4 tight-spacing">
              <div className="mono text-sm secondary-text mb-2">SYSTEMS</div>
              <div className="space-y-1">
                <div className="mono text-sm primary-text">• DISTRIBUTED</div>
                <div className="mono text-sm primary-text">• EVENT-DRIVEN</div>
                <div className="mono text-sm primary-text">• SCALABLE</div>
                <div className="mono text-sm primary-text">• RESILIENT</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Writing Section */}
      <section className="grid grid-cols-12 gap-2">
        <div className="col-span-12 cell-border content-spacing">
          <WritingSection />
        </div>
      </section>
    </div>
  )
}

export default HomePage