import { useId } from 'react'
import Card from '../ui/Card'
import { useAuth } from '../../context/AuthContext'

// The backend's defaults, used when the user has no (or only some) preferences.
const DEFAULTS = { email: true, sms: false }

function Toggle({ id, label, checked, enabled }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-divider py-4 first:border-t-0">
      <span id={id} className="text-sm font-bold text-text">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        disabled={!enabled}
        className={`relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-wallet' : 'bg-field-line'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-1 left-1 size-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  )
}

// Email and SMS preferences, read from the logged-in user. Display only for now: the
// backend has no way to change them and nothing sends email or SMS yet, so the toggles
// are disabled and nothing is saved anywhere.
// TODO: when the backend adds an update endpoint (e.g. PATCH /users/me/notification-preferences),
// add the save call in src/api/users.js, wire it to the toggles here, and pass `enabled`.
export default function NotificationPreferences({ enabled = false }) {
  const { user } = useAuth()
  const titleId = useId()
  const prefs = user?.notificationPreferences
  const email = typeof prefs?.email === 'boolean' ? prefs.email : DEFAULTS.email
  const sms = typeof prefs?.sms === 'boolean' ? prefs.sms : DEFAULTS.sms

  return (
    <Card aria-labelledby={titleId}>
      <h2 id={titleId} className="text-base font-bold text-text">
        Notification preferences
      </h2>
      <div className="mt-2">
        <Toggle id={`${titleId}-email`} label="Email notifications" checked={email} enabled={enabled} />
        <Toggle id={`${titleId}-sms`} label="SMS notifications" checked={sms} enabled={enabled} />
      </div>
      {!enabled && <p className="mt-2 text-sm text-muted">Email and SMS alerts aren’t available yet.</p>}
    </Card>
  )
}
