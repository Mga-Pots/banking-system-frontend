import { useId, useRef, useState } from 'react'
import Card from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import { CheckIcon, ShieldIcon } from './ui/Icons'
import { useToast } from './ui/Toast'
import { roleLabels } from './admin/roleLabels'
import { useAuth } from '../context/AuthContext'
import { updateMe } from '../api/users'
import { formatLongDate } from '../utils/formatDate'
import { EMAIL_PATTERN, formatMobile, isValidMobile, toStoredMobile } from '../utils/contactDetails'

const messageOf = (err) => err.response?.data?.message ?? err.message

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-divider py-3 first:border-t-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-bold break-words text-text">{children}</dd>
    </div>
  )
}

// The same checks the backend runs (PATCH /users/me), so mistakes show before sending.
function validate({ name, email, mobile }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Enter your name.'
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address, like juan@email.com.'
  if (mobile.trim() && !isValidMobile(mobile)) errors.mobile = 'Enter a mobile number like 0917 123 4567, or leave it empty.'
  return errors
}

// Customers edit their name, email and mobile in this card, through PATCH /users/me.
function EditDetails({ user, onDone }) {
  const { updateUser } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({
    name: user.name ?? '',
    email: user.email ?? '',
    mobile: user.contactNumber ? formatMobile(user.contactNumber) : '',
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const formRef = useRef(null)

  const update = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    setError('')
    const first = ['name', 'email', 'mobile'].find((field) => found[field])
    if (first) {
      formRef.current?.querySelector(`#profile-${first}`)?.focus()
      return
    }
    setSaving(true)
    try {
      const res = await updateMe({
        name: form.name.trim(),
        email: form.email.trim(),
        // Empty removes the saved number; the backend treats undefined the same way.
        contactNumber: toStoredMobile(form.mobile) || undefined,
      })
      updateUser(res.data)
      showToast('Your details are updated.')
      onDone()
    } catch (err) {
      // Whatever was typed stays in the form, so the customer can fix it and retry.
      setError(messageOf(err))
      setSaving(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-5">
      <Input
        id="profile-name"
        label="Name"
        autoComplete="name"
        value={form.name}
        onChange={update('name')}
        error={errors.name}
      />
      <Input
        id="profile-email"
        type="email"
        label="Email"
        autoComplete="email"
        value={form.email}
        onChange={update('email')}
        error={errors.email}
        hint="You’ll use this email to log in."
      />
      <Input
        id="profile-mobile"
        type="tel"
        inputMode="numeric"
        label="Mobile number (optional)"
        autoComplete="tel-national"
        placeholder="0917 123 4567"
        maxLength={16}
        value={form.mobile}
        onChange={update('mobile')}
        error={errors.mobile}
      />

      {error && (
        <p role="alert" className="rounded-xl bg-status-failed px-4 py-3 text-sm font-semibold text-status-failed-text">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

// The signed-in person's own details, the same card for customers, staff and admins.
// It reads the session, which the app refreshes from GET /auth/me on load, so a change
// staff make (verifying a customer, say) shows without logging in again.
//
// Customers can edit their name, email and mobile here (PATCH /users/me). Staff and
// admins can't: that endpoint is customers only, so their card stays read-only.
export default function ProfileDetails() {
  const { user } = useAuth()
  const titleId = useId()
  const [editing, setEditing] = useState(false)
  const editButton = useRef(null)

  const isCustomer = user?.role === 'customer'
  const mobile = user?.contactNumber?.trim()

  const stopEditing = () => {
    setEditing(false)
    // Back to the button that opened the form, for keyboard users.
    requestAnimationFrame(() => editButton.current?.focus())
  }

  return (
    <Card aria-labelledby={titleId}>
      <div className="flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-base font-bold text-text">
          {editing ? 'Edit your details' : 'Your details'}
        </h2>
        {isCustomer && !editing && (
          <Button ref={editButton} variant="secondary" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <EditDetails user={user} onDone={stopEditing} />
      ) : (
        <dl className="mt-2">
          <Row label="Name">{user?.name ?? '—'}</Row>
          <Row label="Email">{user?.email ?? '—'}</Row>
          <Row label="Mobile">
            {mobile ? formatMobile(mobile) : <span className="font-normal text-muted">Not given</span>}
          </Row>
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
      )}

      {isCustomer && !user.isVerified && !editing && (
        <p className="mt-3 rounded-xl bg-status-pending px-4 py-3 text-sm font-semibold text-status-pending-text">
          Bank staff verify your ID. Once they do, you can view your card details.
        </p>
      )}
    </Card>
  )
}
