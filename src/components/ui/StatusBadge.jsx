const styles = {
  completed: 'bg-status-completed text-status-completed-text',
  pending: 'bg-status-pending text-status-pending-text',
  failed: 'bg-status-failed text-status-failed-text',
  cancelled: 'bg-status-cancelled text-status-cancelled-text',
  flagged: 'bg-status-flagged text-status-flagged-text',
}

const labels = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
  cancelled: 'Cancelled',
  flagged: 'Flagged',
}

// Transaction status pill.
export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[status] ?? styles.cancelled}`}
    >
      {labels[status] ?? status}
    </span>
  )
}
