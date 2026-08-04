import { useEffect, useState } from 'react'

const HASH_PREFIX = 'writing/'

/**
 * The URL hash is the single source of truth for which post is open.
 * Returns the slug in `#writing/<slug>`, or null for the index.
 */
export function useWritingRoute(isKnownSlug: (slug: string) => boolean) {
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    const read = () => {
      const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''))
      if (!hash.startsWith(HASH_PREFIX)) {
        setSlug(null)
        return
      }
      const next = hash.slice(HASH_PREFIX.length)
      setSlug(isKnownSlug(next) ? next : null)
    }

    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [isKnownSlug])

  return slug
}

export function writingHref(slug: string) {
  return `#${HASH_PREFIX}${slug}`
}

export function goToWriting(slug: string) {
  window.location.hash = `${HASH_PREFIX}${slug}`
}

export function goToIndex() {
  // Assigning '' would leave a bare '#' and an extra history entry.
  history.pushState(null, '', window.location.pathname + window.location.search)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}
