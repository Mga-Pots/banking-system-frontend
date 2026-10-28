import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import CopyButton from '../ui/CopyButton'
import { resetPassword } from '../../api/admin'
import { firstNameOf } from '../../utils/names'

// Customers only. Step 1 confirms; step 2 shows the temporary password once.
// The admin never sees the old password, and the new one isn't stored anywhere here.
export default function ResetPasswordModal({ user, onClose, onDone }) {
  const [temp, setTemp] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const first = firstNameOf(user.name)

  const handleReset = async () => {
    setError('')
    setSaving(true)
    try {
      const res = await resetPassword(user._id)
      setTemp(res.data.temporaryPassword)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  if (temp) {
    return (
      <Modal title={`Temporary password for ${first}`} onClose={() => onDone(user)}>
        <div className="flex flex-col gap-5">
          <p className="-mt-2 text-sm text-label">
            This is the only time it’s shown. Give it to {first} in person, never by chat or email. They’ll set a new
            one at their next login.
          </p>
          <div className="flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-ink bg-mint px-4 py-4">
            <span className="font-brand text-2xl font-bold tracking-wider text-ink select-all">{temp}</span>
            <CopyButton value={temp} label="Copy temporary password" showLabel className="text-ink hover:bg-white/60" />
          </div>
          <Button onClick={() => onDone(user)}>I’ve given it to {first}</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={`Reset ${user.name}’s password?`} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="-mt-2 text-sm text-label">
          You’ll see a temporary password once. Give it to {first} in person. They must change it the next time they
          log in. This is saved in the audit log.
        </p>
        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleReset} disabled={saving}>
            {saving ? 'Creating...' : 'Create temporary password'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
