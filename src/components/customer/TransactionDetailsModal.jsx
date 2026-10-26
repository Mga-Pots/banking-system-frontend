import { useState } from 'react'
import Modal from '../ui/Modal'
import Amount from '../ui/Amount'
import Button from '../ui/Button'
import { EyeIcon, EyeOffIcon } from '../ui/Icons'
import StatusBadge from '../ui/StatusBadge'
import { formatAccountNumber, lastFour } from '../../utils/formatAccountNumber'
import { formatDateTime } from '../../utils/formatDate'
import { accountIdOf, accountNumberOf, describeTransaction, isInactive } from '../../utils/transactions'

const messageOf = (err) => err.response?.data?.message ?? err.message

// The account number, or "Another account" when the response doesn't carry one.
// Hidden down to the last four unless `shown`.
const partyLabel = (account, shown) => {
  if (!account) return null
  const number = accountNumberOf(account)
  if (!number) return 'Another account'
  return shown ? formatAccountNumber(number) : `•••• •••• ${lastFour(number)}`
}

// One account number with the eye that shows or hides every number in the dialog.
function AccountNumber({ account, shown, onToggle }) {
  const label = partyLabel(account, shown)
  if (!accountNumberOf(account)) return label
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      {label}
      <button
        type="button"
        onClick={onToggle}
        aria-label={shown ? 'Hide account numbers' : 'Show account numbers'}
        className="relative -my-2 flex size-8 cursor-pointer items-center justify-center rounded-full text-muted transition before:absolute before:-inset-1.5 hover:bg-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
      >
        {shown ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
      </button>
    </span>
  )
}

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
  const { direction, title, maskedTitle } = describeTransaction(tx, myAccountId, names)
  const incoming = direction === 'in'
  const inactive = isInactive(tx)
  const amountTone = inactive ? 'text-muted line-through' : incoming ? 'text-wallet' : 'text-error'

  // Account numbers start hidden here, whatever the dashboard's "hide details" is set to.
  const [showNumbers, setShowNumbers] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Only the sender can cancel, and only a transfer that is still pending.
  const canCancel =
    Boolean(onCancel) &&
    tx.transactionType === 'transfer' &&
    tx.status === 'pending' &&
    accountIdOf(tx.sourceAccount) === myAccountId

  const toggleNumbers = () => setShowNumbers((shown) => !shown)

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
      <p className="text-[15px] font-semibold text-text">{showNumbers ? title : maskedTitle}</p>
      <p className={`mt-1 font-brand text-[32px] leading-tight font-bold ${amountTone}`}>
        <Amount centavos={tx.amount} sign={inactive ? '' : incoming ? '+' : '−'} split />
      </p>
      <div className="mt-2 mb-4">
        <StatusBadge status={tx.status} />
      </div>

      <dl>
        <Row label="Type">{tx.transactionType === 'cash_in' ? 'Cash in' : 'Transfer'}</Row>
        <Row label="Reference number">{tx.referenceNumber}</Row>
        <Row label="Date and time">{formatDateTime(tx.createdAt)}</Row>
        {tx.transactionType === 'transfer' && (
          <>
            <Row label="From">
              <AccountNumber account={tx.sourceAccount} shown={showNumbers} onToggle={toggleNumbers} />
            </Row>
            <Row label="To">
              <AccountNumber account={tx.destinationAccount} shown={showNumbers} onToggle={toggleNumbers} />
            </Row>
          </>
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
                  <Amount centavos={tx.amount} className="font-bold text-text" /> will be refunded to your
                  account.
                </>
              )}
            </p>
          )}
          {confirming ? (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="danger" onClick={handleCancel} disabled={busy}>
                {busy ? 'Cancelling...' : 'Yes, cancel'}
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
