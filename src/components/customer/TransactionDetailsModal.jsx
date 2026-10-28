import { useState } from 'react'
import Modal from '../ui/Modal'
import { useToast } from '../ui/Toast'
import Amount from '../ui/Amount'
import Button from '../ui/Button'
import CopyButton from '../ui/CopyButton'
import StatusBadge from '../ui/StatusBadge'
import MaskedAccount from '../ui/MaskedAccount'
import { formatDateTime } from '../../utils/formatDate'
import { accountIdOf, accountNumberOf, describeTransaction, isInactive } from '../../utils/transactions'

const messageOf = (err) => err.response?.data?.message ?? err.message

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-divider py-3 first:border-t-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-bold text-text">{children}</dd>
    </div>
  )
}

// Dialog with everything about one transaction. When `onCancel` is given, a pending
// transfer the customer sent can be cancelled here: `onCancel(tx)` should return a
// promise that rejects with the error to show.
export default function TransactionDetailsModal({ tx, myAccountId, names, onClose, onCancel }) {
  const { direction, maskedTitle } = describeTransaction(tx, myAccountId, names)
  const incoming = direction === 'in'
  const inactive = isInactive(tx)
  const { showToast } = useToast()
  const amountTone = inactive ? 'text-muted line-through' : incoming ? 'text-wallet' : 'text-error'

  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // The other account's last four digits. When the title has no name to go by it
  // already shows them, so the row only appears next to a name ("To Pedro G.").
  const otherNumber = accountNumberOf(incoming ? tx.sourceAccount : tx.destinationAccount)
  const showAccountRow = tx.transactionType === 'transfer' && Boolean(otherNumber && names?.[otherNumber])

  // Only the sender can cancel, and only a transfer that is still pending.
  const canCancel =
    Boolean(onCancel) &&
    tx.transactionType === 'transfer' &&
    tx.status === 'pending' &&
    accountIdOf(tx.sourceAccount) === myAccountId

  const handleCancel = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await onCancel(tx)
    } catch (err) {
      setError(messageOf(err))
      setBusy(false)
    }
  }

  return (
    <Modal title="Transaction details" onClose={onClose}>
      <p className="text-center text-[15px] font-semibold text-text">{maskedTitle}</p>
      <p className={`mt-1 text-center font-brand text-[32px] leading-tight font-bold ${amountTone}`}>
        <Amount centavos={tx.amount} sign={inactive ? '' : incoming ? '+' : '−'} split />
      </p>
      <div className="mt-2 mb-4 flex justify-center">
        <StatusBadge status={tx.status} />
      </div>

      <dl>
        <Row label="Type">{tx.transactionType === 'cash_in' ? 'Cash in' : 'Transfer'}</Row>
        <Row label="Reference number">
          <span className="inline-flex items-center gap-1">
            {tx.referenceNumber}
            <CopyButton
              value={tx.referenceNumber}
              label="Copy reference number"
              onCopied={() => showToast('Reference number copied')}
              className="-my-1.5 text-muted hover:bg-field hover:text-ink focus-visible:outline-wallet"
            />
          </span>
        </Row>
        <Row label="Date and time">{formatDateTime(tx.createdAt)}</Row>
        {showAccountRow && (
          <Row label="Account">
            <MaskedAccount value={otherNumber} />
          </Row>
        )}
        {tx.transactionType === 'cash_in' && <Row label="Funds">Simulated, no real money</Row>}
        {tx.flagReason && <Row label="Note">{tx.flagReason}</Row>}
      </dl>

      {canCancel && (
        <div className="mt-2">
          {(error || confirming) && (
            <p role={error ? 'alert' : undefined} className={`mb-3 text-sm ${error ? 'font-semibold text-error' : 'text-muted'}`}>
              {error || (
                <>
                  Cancel this transfer? <Amount centavos={tx.amount} className="font-bold text-text" /> will be refunded.
                </>
              )}
            </p>
          )}
          {confirming ? (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="danger" onClick={handleCancel} disabled={busy}>
                {busy ? 'Cancelling...' : 'Cancel transfer'}
              </Button>
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy}>
                Keep transfer
              </Button>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setConfirming(true)}>
              Cancel transfer
            </Button>
          )}
        </div>
      )}
    </Modal>
  )
}
