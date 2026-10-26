import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Amount from '../ui/Amount'
import StatusBadge from '../ui/StatusBadge'
import DetailsList from './DetailsList'
import { updateTransactionStatus } from '../../api/admin'
import { formatDateTime } from '../../utils/formatDate'

// Details of a flagged or held transaction, with the option to cancel it.
// Cancelled transactions stay on record with the "cancelled" status.
export default function ReviewTransactionModal({ tx, fromName, toName, onClose, onCancelled }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCancel = async () => {
    setError('')
    setSaving(true)
    try {
      await updateTransactionStatus(tx._id, 'cancelled')
      onCancelled(tx)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
      setSaving(false)
    }
  }

  const isTransfer = tx.transactionType === 'transfer'

  return (
    <Modal title={isTransfer ? 'Transfer to review' : 'Cash in to review'} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-brand text-[32px] leading-none font-bold text-text">
            <Amount centavos={tx.amount} split />
          </p>
          <StatusBadge status={tx.status} />
        </div>
        <DetailsList
          rows={[
            ...(isTransfer ? [['From', fromName]] : []),
            ['To', toName],
            ['Reference', tx.referenceNumber],
            ['Date', formatDateTime(tx.createdAt)],
            ['Reason', tx.flagReason || 'None given'],
          ]}
        />
        <p className="text-sm text-label">
          Cancelling stops this transaction. It stays on record as Cancelled.
        </p>
        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>
            Keep for review
          </Button>
          <Button variant="danger" onClick={handleCancel} disabled={saving}>
            {saving ? 'Cancelling...' : 'Cancel transaction'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
