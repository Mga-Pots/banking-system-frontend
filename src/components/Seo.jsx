import { useEffect } from 'react'

// Production address for canonical links. Falls back to the current origin locally.
const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')

// Per-page title and search engine rules.
// Private pages: <Seo title="…" />            -> noindex, no canonical
// Public pages:  <Seo title="…" path="/login" index />
export default function Seo({ title, path, index = false }) {
  useEffect(() => {
    document.title = title ? `${title} · sinop` : 'sinop'
  }, [title])

  return (
    <>
      <meta name="robots" content={index ? 'index, follow' : 'noindex, nofollow'} />
      {index && path && <link rel="canonical" href={`${SITE_URL}${path}`} />}
    </>
  )
}
