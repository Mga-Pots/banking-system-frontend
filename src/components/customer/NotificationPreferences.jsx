import { useId, useState } from 'react'
import Card from '../ui/Card'
import { useToast } from '../ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { updateNotificationPreferences } from '../../api/users'

// The backend's defaults, used when the user has no (or only some) preferences.
const DEFAULTS = { email: true, sms: false }

const messageOf = (err) => err.response?.data?.message ?? err.message

// `locked` keeps a switch from being turned on (it can still be turned off), with `hint`
// saying why.
function Toggle({ id, label, checked, busy, locked = false, hint, onChange }) {
  const blocked = locked && !checked
  return (
    <div className="flex items-center justify-between gap-4 border-t border-divider py-4 first:border-t-0">
      <div className="min-w-0">
        <span id={id} className="block text-sm font-bold text-text">
          {label}
        </span>
        {hint && (
          <span id={`${id}-hint`} className="mt-0.5 block text-xs text-muted">
            {hint}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        aria-busy={busy || undefined}
        disabled={busy || blocked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet disabled:opacity-50 ${
          busy ? 'disabled:cursor-wait' : 'disabled:cursor-not-allowed'
        } ${checked ? 'bg-wallet' : 'bg-field-line'}`}
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

// Email and SMS preferences (PATCH /users/me/notification-preferences). Each switch saves
// on its own as soon as it's flipped: it moves at once, and moves back if saving fails.
// Nothing sends email or SMS yet; this records what the customer wants.
export default function NotificationPreferences() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const titleId = useId()
  const [saving, setSaving] = useState(null) // 'email' | 'sms' while that switch saves
  const [pending, setPending] = useState(null) // the value shown while saving

  const hasMobile = Boolean(user?.contactNumber?.trim())
  const saved = { ...DEFAULTS, ...user?.notificationPreferences }
  const shown = pending ? { ...saved, ...pending } : saved

  const change = async (field, value) => {
    setSaving(field)
    setPending({ [field]: value })
    try {
      const res = await updateNotificationPreferences({ [field]: value })
      updateUser(res.data)
      showToast(`${field === 'email' ? 'Email' : 'SMS'} notifications turned ${value ? 'on' : 'off'}.`)
    } catch (err) {
      showToast(`Couldn’t save that change: ${messageOf(err)}`)
    } finally {
      setSaving(null)
      setPending(null)
    }
  }

  return (
    <Card aria-labelledby={titleId}>
      <h2 id={titleId} className="text-base font-bold text-text">
        Notification preferences
      </h2>
      <div className="mt-2">
        <Toggle
          id={`${titleId}-email`}
          label="Email notifications"
          checked={shown.email}
          busy={saving !== null}
          onChange={(value) => change('email', value)}
        />
        {/* SMS needs a mobile number: without one it can't be turned on (only off). */}
        <Toggle
          id={`${titleId}-sms`}
          label="SMS notifications"
          checked={shown.sms}
          busy={saving !== null}
          locked={!hasMobile}
          hint={hasMobile ? undefined : 'Add a mobile number in Your details to turn this on.'}
          onChange={(value) => change('sms', value)}
        />
      </div>
    </Card>
  )
}
