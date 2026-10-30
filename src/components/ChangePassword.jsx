import { useId, useRef, useState } from 'react'
import Card from './ui/Card'
import Button from './ui/Button'
import { useToast } from './ui/Toast'
import PasswordInput from './auth/PasswordInput'
import { changePassword } from '../api/users'

const messageOf = (err) => err.response?.data?.message ?? err.message

const FIELDS = ['current', 'next', 'confirm']

// A labelled password field with Show/Hide, the same field as on the card details dialog.
function PasswordField({ id, label, hint, error, ...rest }) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ')
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold text-text">
        {label}
      </label>
      <PasswordInput id={id} describedBy={describedBy || undefined} invalid={Boolean(error)} {...rest} />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  )
}

// The same rule as Register: the backend only asks for 8 characters, this asks for a
// letter and a number too, so new passwords match the ones people sign up with.
function validate({ current, next, confirm }) {
  const errors = {}
  if (!current) errors.current = 'Enter your current password.'
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) {
    errors.next = 'Use at least 8 characters with letters and numbers.'
  } else if (next === current) {
    errors.next = 'Choose a password different from your current one.'
  }
  if (!confirm) errors.confirm = 'Re-enter your new password.'
  else if (confirm !== next) errors.confirm = 'Passwords don’t match.'
  return errors
}

// The backend's own refusals belong next to a field.
function errorsFromServer(message) {
  if (/incorrect password/i.test(message)) return { current: 'That’s not your current password.' }
  if (/used here before/i.test(message)) return { next: 'Choose a password you haven’t used here before.' }
  return null
}

const EMPTY = { current: '', next: '', confirm: '' }

// Change password, for every role (PATCH /users/me/password). Closed until asked for,
// like the details card's Edit. The session stays valid after a change.
export default function ChangePassword() {
  const titleId = useId()
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const formRef = useRef(null)
  const openButton = useRef(null)

  const close = () => {
    setOpen(false)
    setForm(EMPTY)
    setErrors({})
    setError('')
    setSaving(false)
    requestAnimationFrame(() => openButton.current?.focus())
  }

  const update = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const focusFirst = (found) => {
    const first = FIELDS.find((field) => found[field])
    if (first) formRef.current?.querySelector(`#password-${first}`)?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    setError('')
    if (Object.keys(found).length) return focusFirst(found)
    setSaving(true)
    try {
      await changePassword({ currentPassword: form.current, newPassword: form.next })
      showToast('Your password is changed.')
      close()
    } catch (err) {
      const message = messageOf(err)
      const fieldErrors = errorsFromServer(message)
      if (fieldErrors) {
        setErrors(fieldErrors)
        focusFirst(fieldErrors)
      } else {
        setError(message)
      }
      setSaving(false)
    }
  }

  return (
    <Card aria-labelledby={titleId}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-bold text-text">
            Password
          </h2>
          {!open && <p className="mt-0.5 text-sm text-muted">Change the password you log in with.</p>}
        </div>
        {!open && (
          <Button ref={openButton} variant="secondary" className="shrink-0" onClick={() => setOpen(true)}>
            Change password
          </Button>
        )}
      </div>

      {open && (
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-5">
          <PasswordField
            id="password-current"
            label="Current password"
            autoComplete="current-password"
            value={form.current}
            onChange={update('current')}
            error={errors.current}
          />
          <PasswordField
            id="password-next"
            label="New password"
            autoComplete="new-password"
            hint="At least 8 characters, with letters and numbers."
            value={form.next}
            onChange={update('next')}
            error={errors.next}
          />
          <PasswordField
            id="password-confirm"
            label="Confirm new password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={update('confirm')}
            error={errors.confirm}
          />

          {error && (
            <p role="alert" className="rounded-xl bg-status-failed px-4 py-3 text-sm font-semibold text-status-failed-text">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Change password'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}
