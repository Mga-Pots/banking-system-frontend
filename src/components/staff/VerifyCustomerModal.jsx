import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import DetailsList from '../ui/DetailsList'
import { verifyCustomer } from '../../api/staff'
import { formatLongDate } from '../../utils/formatDate'
import { formatAccountNumber } from '../../utils/formatAccountNumber'

// Confirms an ID check before marking a customer as verified.
export default function VerifyCustomerModal({ customer, account, onClose, onVerified }) {
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleVerify = async () => {
    setError('')
    setSaving(true)
    try {
      await verifyCustomer(customer._id)
      onVerified(customer)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title={`Verify ${customer.name}?`} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="-mt-2 text-sm text-muted">Only verify after you’ve checked a valid government ID.</p>
        <DetailsList
          rows={[
            ['Email', customer.email],
            ['Mobile', customer.contactNumber || 'Not given'],
            ['Account', account ? formatAccountNumber(account.accountNumber) : 'None'],
            ['Joined', formatLongDate(customer.createdAt)],
          ]}
        />
        <label className="flex cursor-pointer items-start gap-2.5 text-sm font-semibold text-label">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 size-[18px] shrink-0 accent-ink"
          />
          I checked a valid ID that matches this name
        </label>
        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={!checked || saving}>
            {saving ? 'Verifying...' : 'Mark as verified'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
