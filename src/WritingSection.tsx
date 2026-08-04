import { useState, useEffect, useMemo, useRef } from 'react'
import { writings, Writing } from './writings.generated'
import { goToWriting } from './hooks/useHashRoute'

function BlogCard({
  post,
  isHighlighted,
}: {
  post: Writing
  isHighlighted: boolean
}) {
  return (
    // A button, not a div with onClick: the row has to be reachable by Tab and
    // activated by Enter or Space. The selected state lives in CSS keyed on
    // aria-current, so the cue and the announcement cannot drift apart.
    <button
      type="button"
      className="post-row mono text-small"
      aria-current={isHighlighted ? 'true' : undefined}
      data-test="blog-card"
      onClick={() => goToWriting(post.slug)}
    >
      <span
        className="post-row-date secondary-text whitespace-nowrap shrink-0"
        data-test="blog-date"
        style={{ minWidth: '10ch' }}
      >
        {post.date}
      </span>
      <span className="post-row-title flex-1 text-link" data-test="blog-title">
        {post.title}
      </span>
      <span
        className="post-row-time muted-text whitespace-nowrap shrink-0"
        data-test="reading-time"
        style={{ minWidth: '8ch', textAlign: 'right' }}
      >
        {post.readingTime} min
      </span>
    </button>
  )
}

function WritingSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filteredWritings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return writings
    return writings.filter(
      (post) =>
        post.title.toLowerCase().includes(query) || post.excerpt.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Clamp on every change to the result set. Keying this to length alone left a
  // stale index whenever a query returned a different set of the same size.
  useEffect(() => {
    setHighlightedIndex((prev) =>
      Math.min(Math.max(prev, 0), Math.max(filteredWritings.length - 1, 0))
    )
  }, [filteredWritings])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      const withinList =
        document.activeElement === searchInputRef.current ||
        (listRef.current?.contains(document.activeElement) ?? false)
      if (!withinList) return

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredWritings.length - 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlightedIndex((prev) => Math.max(prev - 1, 0))
      } else if (event.key === 'Enter' && document.activeElement === searchInputRef.current) {
        event.preventDefault()
        const target = filteredWritings[highlightedIndex]
        if (target) goToWriting(target.slug)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        setSearchQuery('')
        searchInputRef.current?.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredWritings, highlightedIndex])

  return (
    <div data-test="blog-list">
      <div className="mb-4 border border-border p-2 bg-surface">
        <div className="flex items-center gap-2 mono text-small">
          <span className="accent-text" aria-hidden="true">
            ›
          </span>
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="filter posts…"
            aria-label="Filter posts"
            className="flex-1 bg-transparent outline-none border-none text-text"
            style={{ caretColor: 'var(--accent)' }}
          />
          <span className="secondary-text" aria-live="polite">
            {filteredWritings.length}/{writings.length}
          </span>
        </div>
      </div>

      <div ref={listRef}>
        {filteredWritings.map((post, index) => (
          <BlogCard key={post.slug} post={post} isHighlighted={index === highlightedIndex} />
        ))}
      </div>

      {filteredWritings.length === 0 && (
        <div className="mono text-small secondary-text py-4 text-center">no matches found</div>
      )}
    </div>
  )
}

export default WritingSection
