import { useState } from 'react'
import Modal from '../ui/Modal'
import { useToast } from '../ui/Toast'
import Amount from '../ui/Amount'
import Button from '../ui/Button'
import CopyButton from '../ui/CopyButton'
import StatusBadge from '../ui/StatusBadge'
import MaskedAccount from '../ui/MaskedAccount'
import VerifyTransferModal from './VerifyTransferModal'
import { formatDateTime } from '../../utils/formatDate'
import {
  accountIdOf,
  accountNumberOf,
  describeTransaction,
  documentCheckOf,
  isInactive,
  sentDocumentOf,
} from '../../utils/transactions'
import { needsApproval, noteLabel } from '../../utils/transferRules'

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
// promise that rejects with the error to show. A flagged transfer the customer sent
// shows its document check here too; `onUpdated(tx)` runs once the document has been sent.
export default function TransactionDetailsModal({ tx, myAccountId, names, onClose, onCancel, onUpdated }) {
  const { direction, maskedTitle } = describeTransaction(tx, myAccountId, names)
  const incoming = direction === 'in'
  const inactive = isInactive(tx)
  const { showToast } = useToast()
  const amountTone = inactive ? 'text-muted line-through' : incoming ? 'text-wallet' : 'text-error'

  // A flagged transfer waits on a document check. The modal keeps the latest state itself so
  // the panel updates as soon as the ID is sent, without reloading the list behind it.
  const [verification, setVerification] = useState(tx.verification ?? null)
  const [verifying, setVerifying] = useState(false)
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

  // Only the sender goes through the document check, and only while the transfer is flagged.
  const isSender = tx.transactionType === 'transfer' && accountIdOf(tx.sourceAccount) === myAccountId
  const idCheck = isSender ? documentCheckOf({ ...tx, verification }) : null
  // The document stays on the record once the transfer is approved or rejected, so a
  // resolved transfer still shows that it went through a check.
  const sentDocument = isSender ? sentDocumentOf({ ...tx, verification }) : null

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

  if (verifying) {
    return (
      <VerifyTransferModal
        tx={tx}
        onClose={() => setVerifying(false)}
        onSubmitted={(updated) => {
          setVerification(updated.verification)
          setVerifying(false)
          showToast('ID sent. The bank is reviewing your transfer.')
          onUpdated?.(updated)
        }}
      />
    )
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
        {tx.flagReason && <Row label="Reason for flagging">{tx.flagReason}</Row>}
        {sentDocument && (
          <Row label="Document">
            <span className="block">{sentDocument.name ?? 'Sent'}</span>
            <span className="block font-normal text-muted">{formatDateTime(sentDocument.submittedAt)}</span>
          </Row>
        )}
        {tx.note && !incoming && <Row label={noteLabel(needsApproval(tx.amount))}>{tx.note}</Row>}
      </dl>

      {idCheck?.status === 'requested' && (
        <div className="mt-4">
          <p className="rounded-2xl bg-status-pending px-4 py-3.5 text-sm font-semibold text-status-pending-text">
            This transfer needs a document check before it can go through. You have already been charged, and
            the recipient is credited once the bank approves it.
          </p>
          <Button className="mt-3 w-full" onClick={() => setVerifying(true)}>
            Upload a document
          </Button>
        </div>
      )}

      {idCheck?.status === 'submitted' && (
        <p className="mt-4 rounded-2xl bg-field px-4 py-3.5 text-sm text-label">
          The bank is checking your document now. You will get a notification once it is done.
        </p>
      )}

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
