export interface MetaTagsConfig {
  title: string
  description: string
  url: string
  image?: string
  type?: 'website' | 'article'
}

export function updateMetaTags(config: MetaTagsConfig) {
  const {
    title,
    description,
    url,
    image = 'https://roshanbhatia.com/og-image.png',
    type = 'article'
  } = config

  // Update page title
  const pageTitle = document.getElementById('page-title')
  if (pageTitle) {
    pageTitle.textContent = title
  } else {
    document.title = title
  }

  // Update description
  const metaDescription = document.getElementById('meta-description')
  if (metaDescription) {
    metaDescription.setAttribute('content', description)
  }

  // Update Open Graph tags
  const ogType = document.getElementById('og-type')
  if (ogType) ogType.setAttribute('content', type)

  const ogUrl = document.getElementById('og-url')
  if (ogUrl) ogUrl.setAttribute('content', url)

  const ogTitle = document.getElementById('og-title')
  if (ogTitle) ogTitle.setAttribute('content', title)

  const ogDescription = document.getElementById('og-description')
  if (ogDescription) ogDescription.setAttribute('content', description)

  const ogImage = document.getElementById('og-image')
  if (ogImage) ogImage.setAttribute('content', image)

  // Update Twitter tags
  const twitterUrl = document.getElementById('twitter-url')
  if (twitterUrl) twitterUrl.setAttribute('content', url)

  const twitterTitle = document.getElementById('twitter-title')
  if (twitterTitle) twitterTitle.setAttribute('content', title)

  const twitterDescription = document.getElementById('twitter-description')
  if (twitterDescription) twitterDescription.setAttribute('content', description)

  const twitterImage = document.getElementById('twitter-image')
  if (twitterImage) twitterImage.setAttribute('content', image)
}

export function resetMetaTags() {
  updateMetaTags({
    title: 'Roshan Bhatia - Senior Software Engineer',
    description: 'Building scalable cloud infrastructure, distributed systems, and developer tooling with modern technologies.',
    url: 'https://roshanbhatia.com/',
    type: 'website'
  })
}
