import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import DetailsList from '../ui/DetailsList'
import { updateAccountStatus } from '../../api/staff'
import { formatAccountNumber } from '../../utils/formatAccountNumber'

// Freezes an active bank account (a reason is required) or reactivates a frozen one.
// `account` needs _id, accountNumber and status; `ownerName` is shown for context.
export default function AccountStatusModal({ account, ownerName, onClose, onSaved }) {
  const freezing = account.status === 'active'
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    setError('')
    if (freezing && !reason.trim()) {
      setReasonError('Enter a reason for freezing this account.')
      return
    }
    setSaving(true)
    try {
      const res = await updateAccountStatus(account._id, freezing ? 'frozen' : 'active', reason.trim())
      onSaved(res.data)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title={freezing ? 'Freeze this account?' : 'Reactivate this account?'} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="-mt-2 text-sm text-label">
          {freezing
            ? 'The customer won’t be able to cash in, send or receive transfers until the account is reactivated. They’ll get a notification with your reason.'
            : 'The customer will be able to cash in and transfer again right away.'}
        </p>
        <DetailsList
          rows={[
            ['Owner', ownerName || 'Unknown'],
            ['Account', formatAccountNumber(account.accountNumber)],
          ]}
        />
        {freezing && (
          <Input
            id="freeze-reason"
            label="Reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setReasonError('')
            }}
            error={reasonError}
            placeholder="For example, reported lost phone"
            maxLength={200}
            autoComplete="off"
          />
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
          <Button variant={freezing ? 'danger' : 'primary'} onClick={handleConfirm} disabled={saving}>
            {saving ? 'Saving...' : freezing ? 'Freeze account' : 'Reactivate'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
