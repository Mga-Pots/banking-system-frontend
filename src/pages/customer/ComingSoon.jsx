// Stand-in for customer pages that aren't built yet, so the sidebar links work.
export default function ComingSoon({ title }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-muted">This page is coming soon.</p>
    </div>
  )
}
