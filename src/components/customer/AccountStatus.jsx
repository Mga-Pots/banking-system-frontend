const labels = { active: 'Active', frozen: 'Frozen', closed: 'Closed' }

const light = {
  active: 'bg-status-completed text-status-completed-text',
  frozen: 'bg-status-flagged text-status-flagged-text',
  closed: 'bg-status-cancelled text-status-cancelled-text',
}

// Bank account status pill. `onDark` is for the green account card, where an
// active account gets a lime outline instead of a filled pill.
export default function AccountStatus({ status, onDark = false }) {
  const style =
    onDark && status === 'active' ? 'border border-accent text-accent' : (light[status] ?? light.closed)
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase ${style}`}>
      {labels[status] ?? status}
    </span>
  )
}
