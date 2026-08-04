import React, { useCallback, useEffect } from 'react'
import HomePage from '@/pages/HomePage'
import PostPage from '@/pages/PostPage'
import Footer from '@/components/Footer'
import { writings } from '@/writings.generated'
import { useWritingRoute } from '@/hooks/useHashRoute'
import { updateMetaTags, resetMetaTags } from '@/utils/metaTags'
import './styles/globals.css'

function App() {
  const isKnownSlug = useCallback((slug: string) => writings.some((w) => w.slug === slug), [])
  const slug = useWritingRoute(isKnownSlug)
  const post = slug ? writings.find((w) => w.slug === slug) : undefined

  useEffect(() => {
    if (post) {
      updateMetaTags({
        title: `${post.title} - Roshan Bhatia`,
        description: post.excerpt,
        url: `https://roshanbhatia.com/#writing/${post.slug}`,
        type: 'article',
      })
    } else {
      resetMetaTags()
    }
  }, [post])

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      {/* Window chrome. Purely ornamental, so it is hidden from assistive tech
          instead of announcing three unlabelled buttons that do nothing. */}
      <div
        className="sticky top-0 z-50 bg-surface border-b-2 border-border flex items-center justify-end px-2 py-1"
        aria-hidden="true"
      >
        <div className="flex items-center gap-1 mono text-small secondary-text">
          <span className="px-3 border border-border bg-cell-bg">_</span>
          <span className="px-3 border border-border bg-cell-bg">□</span>
          <span className="px-3 border border-border bg-cell-bg">×</span>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto p-8 w-full">
        {post ? <PostPage post={post} /> : <HomePage />}
      </main>

      {/* Outside the growing main column, so it lands at the bottom of the page
          instead of floating over the content. */}
      <div className="max-w-6xl mx-auto w-full px-8">
        <Footer />
      </div>
    </div>
  )
}

export default App
