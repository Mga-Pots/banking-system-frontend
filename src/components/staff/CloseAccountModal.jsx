import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Amount from '../ui/Amount'
import DetailsList from '../ui/DetailsList'
import { updateAccountStatus } from '../../api/staff'
import { formatAccountNumber } from '../../utils/formatAccountNumber'

const CONFIRM_WORD = 'CLOSE'

// Permanently closes a customer: their bank account and their login together
// (see "Closing a customer" in docs/least-privilege-guide.md). The balance must be
// ₱0.00 and no transfer can be waiting in either direction; the second rule is only
// known to the server, so its refusal is shown as the error.
// `account` needs _id, accountNumber and balance; `ownerName` is shown for context.
export default function CloseAccountModal({ account, ownerName, onClose, onClosed }) {
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const hasMoney = account.balance > 0
  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD

  const handleClose = async () => {
    setError('')
    if (!reason.trim()) {
      setReasonError('Enter a reason for closing this account.')
      return
    }
    setSaving(true)
    try {
      const res = await updateAccountStatus(account._id, 'closed', reason.trim())
      onClosed(res.data)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title="Close this account permanently?" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <DetailsList
          rows={[
            ['Owner', ownerName || 'Unknown'],
            ['Account', formatAccountNumber(account.accountNumber)],
            ['Balance', <Amount key="balance" centavos={account.balance} />],
          ]}
        />

        {hasMoney ? (
          <>
            <p role="alert" className="rounded-xl bg-status-pending px-4 py-3.5 text-sm font-semibold text-status-pending-text">
              This account still has money in it. The balance must be ₱0.00 before it can be closed. The customer can
              transfer it to another account first.
            </p>
            <Button variant="secondary" onClick={onClose}>
              OK
            </Button>
          </>
        ) : (
          <>
            <p className="rounded-xl bg-status-failed px-4 py-3.5 text-sm font-semibold text-status-failed-text">
              This can’t be undone. The bank account and the customer’s login are both closed for good. Their
              transactions stay on record. Any transfer still waiting for review must be approved or cancelled first.
            </p>
            <Input
              id="close-reason"
              label="Reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setReasonError('')
              }}
              error={reasonError}
              placeholder="For example, customer asked to close their account"
              maxLength={200}
              autoComplete="off"
            />
            <Input
              id="close-confirm"
              label={`Type ${CONFIRM_WORD} to confirm`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
            />
            {error && (
              <p role="alert" className="text-sm font-semibold text-error">
                {error}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleClose} disabled={!confirmed || saving}>
                {saving ? 'Closing...' : 'Close permanently'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
