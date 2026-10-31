import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { updateUserStatus } from '../../api/admin'

// Admins can only close staff accounts. Disable / turn back on was removed, and
// customers are closed by staff through their bank account.
const ACTIONS = {
  close: {
    status: 'closed',
    title: () => 'Close this staff account?',
    body: (name) => `${name} loses access right away and is logged out. Their past work stays in the audit log.`,
    button: 'Close account',
    variant: 'danger',
    confirmWithEmail: true,
  },
}

// Confirms closing a staff account. The admin types the staff member's email first,
// so they can't close the wrong person out of habit (it can't be undone).
export default function UserStatusModal({ user, action, onClose, onSaved }) {
  const a = ACTIONS[action]
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const ready = !a.confirmWithEmail || typed.trim().toLowerCase() === user.email.toLowerCase()

  const handleConfirm = async () => {
    setError('')
    setSaving(true)
    try {
      await updateUserStatus(user._id, a.status)
      onSaved(user, a.status)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title={a.title(user.name)} onClose={onClose}>
      <div className="flex flex-col gap-5">
        {a.body && <p className="-mt-2 text-sm text-label">{a.body(user.name)}</p>}
        {a.confirmWithEmail && (
          <>
            <p className="-mt-2 rounded-xl bg-status-failed px-4 py-3.5 text-sm font-semibold text-status-failed-text">
              This can’t be undone. {user.name}’s records are kept, but the account can never be used again.
            </p>
            <Input
              id="close-confirm"
              label={
                <>
                  Type <span className="font-mono">{user.email}</span> to confirm
                </>
              }
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </>
        )}
        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={a.variant} onClick={handleConfirm} disabled={!ready || saving}>
            {saving ? 'Saving...' : a.button}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
