import React from 'react'
import WritingSection from '../WritingSection'
import { aboutLines } from '../content/about'

const Prompt: React.FC<{ command?: string; cursor?: boolean; testId?: string }> = ({
  command,
  cursor,
  testId,
}) => (
  <div className="mono text-small">
    <span className="accent-text">visitor@roshanbhatia.com</span>
    <span className="secondary-text">:</span>
    <span className="text-text">~</span>
    <span className="secondary-text" data-test={testId}>
      ${command ? ` ${command}` : ''}
    </span>
    {cursor && <span className="cursor-blink ml-1" aria-hidden="true" />}
  </div>
)

const About: React.FC = () => (
  <div className="mono text-small">
    {aboutLines.map((line, index) => (
      <div key={index} className="flex">
        <span
          className="secondary-text mr-4 shrink-0"
          style={{ minWidth: '2ch', textAlign: 'right' }}
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <span className={line.label ? 'muted-text' : undefined}>
          {line.link ? (
            <a
              href={line.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              {line.link.text}
            </a>
          ) : (
            line.text ?? ' '
          )}
        </span>
      </div>
    ))}
  </div>
)

const HomePage: React.FC = () => {
  return (
    <>
      <h1 className="sr-only" data-test="main-title">Roshan Bhatia</h1>

      <section data-test="readme-section" className="content-card">
        <div className="mb-4">
          <Prompt command="prettyprint README.md" testId="readme-title" />
        </div>
        <About />
        <div className="mt-4">
          <Prompt cursor />
        </div>
      </section>

      <section data-test="writing-section" className="content-card">
        <div className="mb-4">
          <Prompt command="ls -t ./writing | fzf" testId="writing-title" />
        </div>
        <WritingSection />
      </section>
    </>
  )
}

export default HomePage
