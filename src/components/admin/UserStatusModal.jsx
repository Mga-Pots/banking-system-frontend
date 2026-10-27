import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { updateUserStatus } from '../../api/admin'

// What each action does to the account's status, and how the dialog reads.
const ACTIONS = {
  disable: {
    status: 'disabled',
    title: (name) => `Disable ${name}’s account?`,
    body: 'They won’t be able to log in until an admin turns the account back on. Nothing is deleted.',
    button: 'Disable account',
    variant: 'danger',
  },
  enable: {
    status: 'active',
    title: (name) => `Turn ${name}’s account back on?`,
    body: 'They’ll be able to log in again right away.',
    button: 'Turn back on',
    variant: 'primary',
  },
  close: {
    status: 'closed',
    title: (name) => `Close ${name}’s account permanently?`,
    body: null,
    button: 'Close permanently',
    variant: 'danger',
    confirmWord: 'CLOSE',
  },
}

// Confirms disabling, re-enabling, or permanently closing a user's account.
// Closing asks the admin to type CLOSE first, since it can't be undone.
export default function UserStatusModal({ user, action, onClose, onSaved }) {
  const a = ACTIONS[action]
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const ready = !a.confirmWord || typed.trim().toUpperCase() === a.confirmWord

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
        {a.body && <p className="-mt-2 text-sm text-label">{a.body}</p>}
        {a.confirmWord && (
          <>
            <p className="-mt-2 rounded-xl bg-status-failed px-4 py-3.5 text-sm font-semibold text-status-failed-text">
              This can’t be undone. Their records and transactions are kept, but the account can never be used again.
            </p>
            <Input
              id="close-confirm"
              label={`Type ${a.confirmWord} to confirm`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
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
