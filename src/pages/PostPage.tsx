import React, { useEffect, useRef } from 'react'
import { Writing } from '../writings.generated'
import { goToIndex } from '../hooks/useHashRoute'

function TableOfContents({ toc }: { toc: Writing['toc'] }) {
  if (toc.length === 0) return null

  return (
    <nav className="mb-8 content-text" aria-labelledby="toc-heading">
      <h2 id="toc-heading" className="text-section mb-4">
        [TABLE OF CONTENTS]
      </h2>
      <ul className="mono text-small list-none p-0 m-0">
        {toc.map((item, index) => {
          const isLast = index === toc.length - 1 || (toc[index + 1]?.level ?? 2) < item.level
          const prefix = '│   '.repeat(Math.max(item.level - 2, 0)) + (isLast ? '└── ' : '├── ')

          return (
            <li key={item.id}>
              <span className="secondary-text whitespace-pre" aria-hidden="true">
                {prefix}
              </span>
              <a href={`#${item.id}`} className="text-link hover:accent-text">
                {item.title}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const PostPage: React.FC<{ post: Writing }> = ({ post }) => {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Send focus to the title so a keyboard or screen-reader user lands on the
  // post rather than back at the top of the document, and start at the top.
  useEffect(() => {
    headingRef.current?.focus()
    window.scrollTo(0, 0)
  }, [post.slug])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') goToIndex()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <article className="content-card">
      <button
        type="button"
        onClick={goToIndex}
        className="theme-toggle mb-8"
        data-test="back-button"
      >
        [BACK]
      </button>

      <header className="mb-8">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-hero"
          data-test="blog-title"
        >
          {post.title}
        </h1>

        <div className="flex gap-8 text-small secondary-text mt-4">
          <span data-test="blog-date">{post.date}</span>
          <span data-test="reading-time">{post.readingTime} MIN READ</span>
        </div>
        <div className="industrial-divider" />
      </header>

      <TableOfContents toc={post.toc} />

      {/* Rendered from markdown at build time by scripts/generate-writings.mjs.
          The input is this repo's own post.md files, not user input. */}
      <div
        className="prose"
        data-test="blog-content"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </article>
  )
}

export default PostPage
