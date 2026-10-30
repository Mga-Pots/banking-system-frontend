import { useId } from 'react'
import Card from './ui/Card'
import { CheckIcon, ShieldIcon } from './ui/Icons'
import { roleLabels } from './admin/roleLabels'
import { useAuth } from '../context/AuthContext'
import { formatLongDate } from '../utils/formatDate'

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-divider py-3 first:border-t-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-bold break-words text-text">{children}</dd>
    </div>
  )
}

// The signed-in person's own details, the same card for customers, staff and admins.
// It reads the session, which the app refreshes from GET /auth/me on load, so a change
// staff make (verifying a customer, say) shows without logging in again.
//
// Read-only on purpose: the backend has no endpoint to change a name, email, contact
// number or password, and none to deactivate an account, so there is nothing to submit
// against. See "Customer profile" in CLAUDE.md before adding any editing here.
export default function ProfileDetails() {
  const { user } = useAuth()
  const titleId = useId()

  const isCustomer = user?.role === 'customer'
  // The backend sends "" for a contact number that was never set.
  const mobile = user?.contactNumber?.trim()

  return (
    <Card aria-labelledby={titleId}>
      <h2 id={titleId} className="text-base font-bold text-text">
        Your details
      </h2>

      <dl className="mt-2">
        <Row label="Name">{user?.name ?? '—'}</Row>
        <Row label="Email">{user?.email ?? '—'}</Row>
        <Row label="Mobile">{mobile || <span className="font-normal text-muted">Not given</span>}</Row>
        {user?.createdAt && <Row label="Member since">{formatLongDate(user.createdAt)}</Row>}
        {isCustomer ? (
          <Row label="ID check">
            {user.isVerified ? (
              <span className="inline-flex items-center gap-1.5 text-status-completed-text">
                <CheckIcon size={16} />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-status-pending-text">
                <ShieldIcon size={16} />
                Not verified yet
              </span>
            )}
          </Row>
        ) : (
          <Row label="Role">{roleLabels[user?.role] ?? user?.role ?? '—'}</Row>
        )}
      </dl>

      {isCustomer && !user.isVerified && (
        <p className="mt-3 rounded-xl bg-status-pending px-4 py-3 text-sm font-semibold text-status-pending-text">
          Bank staff verify your ID. Once they do, you can view your card details.
        </p>
      )}
    </Card>
  )
}
