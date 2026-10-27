import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { updateUserRole } from '../../api/admin'

const ROLES = [
  ['customer', 'Customer', 'Uses sinop for their own money'],
  ['staff', 'Staff', 'Verifies customers, reviews transactions, freezes accounts'],
  ['admin', 'Admin', 'Everything staff can do, plus users, roles and logs'],
]

// Admin picks a new role for a user. Saved in the audit log by the backend.
export default function ChangeRoleModal({ user, onClose, onSaved }) {
  const [role, setRole] = useState(user.role)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      await updateUserRole(user._id, role)
      onSaved(user, role)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title={`Change ${user.name}’s role`} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="-mt-2 text-sm text-muted">This changes what they can see and do. It’s saved in the audit log.</p>
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Role</legend>
          {ROLES.map(([value, label, desc]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] px-4 py-3.5 transition ${
                role === value ? 'border-ink bg-mint' : 'border-field-line bg-white hover:bg-field'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={role === value}
                onChange={() => setRole(value)}
                className="mt-1 size-[18px] shrink-0 accent-ink"
              />
              <span>
                <span className={`block text-[15px] font-bold ${role === value ? 'text-ink' : 'text-text'}`}>{label}</span>
                <span className="block text-[13px] text-muted">{desc}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || role === user.role}>
            {saving ? 'Saving...' : 'Save role'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
