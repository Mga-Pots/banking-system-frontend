const pill = 'inline-flex rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap'

const statusStyles = {
  active: ['Active', 'bg-status-completed text-status-completed-text'],
  deactivated: ['Deactivated', 'bg-status-cancelled text-status-cancelled-text'],
  closed: ['Closed', 'bg-status-cancelled text-status-cancelled-text'],
}

// User account standing: active, deactivated (by the customer), or closed (staff by an admin,
// customers by staff when their bank account is closed).
export function UserStatus({ status }) {
  const [text, style] = statusStyles[status] ?? [status, statusStyles.closed[1]]
  return <span className={`${pill} ${style}`}>{text}</span>
}

// Whether staff have checked the customer's ID. Staff and admins don't need it.
export function IdCheck({ user }) {
  if (user.role !== 'customer') return <span className="text-sm text-muted">Not needed</span>
  return user.isVerified ? (
    <span className={`${pill} bg-status-completed text-status-completed-text`}>Verified</span>
  ) : (
    <span className={`${pill} bg-status-pending text-status-pending-text`}>Unverified</span>
  )
}
