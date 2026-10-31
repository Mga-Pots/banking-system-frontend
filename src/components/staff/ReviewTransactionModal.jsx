import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Amount from '../ui/Amount'
import StatusBadge from '../ui/StatusBadge'
import { CheckIcon, CloseIcon, FlagIcon } from '../ui/Icons'
import DetailsList from '../ui/DetailsList'
import { reviewActionsFor, updateTransactionStatus } from '../../api/staff'
import { formatDateTime } from '../../utils/formatDate'
import { documentCheckOf, sentDocumentOf } from '../../utils/transactions'
import { formatPeso } from '../../utils/formatPeso'
import { needsApproval, noteLabel } from '../../utils/transferRules'

// What each review action does, in the words staff see before they confirm.
// Keys are the status each action sets (see "Transaction review rules" in
// docs/least-privilege-guide.md).
const ACTIONS = {
  completed: {
    label: 'Approve',
    icon: CheckIcon,
    variant: 'primary',
    explain: (amount) => `The recipient is credited ${amount} right away. This can’t be undone.`,
    confirm: 'Approve transfer',
    reasonLabel: 'Note (optional)',
  },
  flagged: {
    label: 'Flag',
    icon: FlagIcon,
    variant: 'secondary',
    explain: () =>
      'No money moves. The sender is asked to send a document, and the transfer stays on hold until it’s approved or rejected.',
    confirm: 'Flag transfer',
    reasonLabel: 'Reason',
    reasonRequired: true,
  },
  cancelled: {
    label: 'Reject',
    icon: CloseIcon,
    variant: 'danger',
    explain: (amount) => `${amount} is refunded to the sender. The transfer stays on record as Cancelled.`,
    confirm: 'Reject transfer',
    reasonLabel: 'Note (optional)',
  },
}

const whyNotReviewable = (tx) => {
  if (tx.transactionType !== 'transfer') return 'Cash ins don’t need review.'
  return `This transfer is ${tx.status}, so there’s nothing to review.`
}

// Details of a transaction. For a pending or flagged transfer, staff can approve,
// flag or cancel it; anything else opens read-only.
// `from` and `to` are display strings ("Juan Dela Cruz · 0012 3456 7890").
export default function ReviewTransactionModal({ tx, from, to, onClose, onReviewed }) {
  const actions = reviewActionsFor(tx)
  const [choice, setChoice] = useState(null) // a key of ACTIONS, once picked
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // A flagged transfer waits on the sender's document before staff decide either way.
  const idCheck = documentCheckOf(tx)
  // Kept after the transfer resolves, so a reviewed transfer still shows what was checked.
  const sentDocument = sentDocumentOf(tx)
  const isTransfer = tx.transactionType === 'transfer'
  const picked = choice && ACTIONS[choice]

  const back = () => {
    setChoice(null)
    setReason('')
    setReasonError('')
    setError('')
  }

  const handleConfirm = async () => {
    setError('')
    if (picked.reasonRequired && !reason.trim()) {
      setReasonError('Enter a reason for flagging this transfer.')
      return
    }
    setSaving(true)
    try {
      const res = await updateTransactionStatus(tx._id, choice, reason.trim())
      onReviewed(res.data)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title={isTransfer ? 'Transfer details' : 'Cash in details'} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-brand text-[32px] leading-none font-bold text-text">
            <Amount centavos={tx.amount} split sensitive />
          </p>
          <StatusBadge status={tx.status} />
        </div>

        <DetailsList
          rows={[
            ...(isTransfer ? [['From', from]] : []),
            ['To', to],
            ['Reference', tx.referenceNumber],
            ['Date', formatDateTime(tx.createdAt)],
            ...(tx.flagReason ? [['Reason', tx.flagReason]] : []),
            ...(tx.note ? [[noteLabel(needsApproval(tx.amount)), tx.note]] : []),
            ...(sentDocument
              ? [['Document', `${sentDocument.name ?? 'Sent'}, sent ${formatDateTime(sentDocument.submittedAt)}`]]
              : idCheck
                ? [
                    [
                      'Document',
                      idCheck.requestedAt
                        ? `Asked for on ${formatDateTime(idCheck.requestedAt)}`
                        : 'Waiting for the sender’s document',
                    ],
                  ]
                : []),
          ]}
        />

        {actions.length === 0 && <p className="text-sm text-muted">{whyNotReviewable(tx)}</p>}

        {actions.length > 0 && !picked && (
          <>
            <p className="text-sm text-label">
              {tx.status === 'pending'
                ? 'The sender has already been charged. The recipient is credited only when you approve it.'
                : idCheck?.status === 'submitted'
                  ? 'This transfer is flagged. The sender has already been charged; approve it to credit the recipient, or reject it to refund the sender.'
                  : 'This transfer is flagged and waiting on the sender’s document. The sender has already been charged, so rejecting refunds them.'}
            </p>
            {idCheck?.status === 'submitted' && (
              <p className="rounded-xl bg-status-completed px-4 py-3.5 text-sm font-semibold text-status-completed-text">
                Check the document above against the name on the account before you approve.
              </p>
            )}
            {idCheck?.status === 'requested' && (
              <p className="rounded-xl bg-status-pending px-4 py-3.5 text-sm font-semibold text-status-pending-text">
                The sender hasn’t sent a document yet, so this can’t be approved. Reject it if they never do.
              </p>
            )}
            <div className={`grid gap-3 ${actions.length === 3 ? 'sm:grid-cols-3' : actions.length === 2 ? 'sm:grid-cols-2' : ''}`}>
              {actions.map((key) => {
                const { label, icon: Icon, variant } = ACTIONS[key]
                return (
                  <Button key={key} variant={variant} onClick={() => setChoice(key)}>
                    <Icon size={18} />
                    {label}
                  </Button>
                )
              })}
            </div>
          </>
        )}

        {picked && (
          <>
            <p className="rounded-xl bg-field px-4 py-3.5 text-sm font-semibold text-label">
              {picked.explain(formatPeso(tx.amount))}
            </p>
            <Input
              id="review-reason"
              label={picked.reasonLabel}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setReasonError('')
              }}
              error={reasonError}
              maxLength={200}
              autoComplete="off"
            />
            {error && (
              <p role="alert" className="text-sm font-semibold text-error">
                {error}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={back} disabled={saving}>
                Back
              </Button>
              <Button variant={picked.variant === 'secondary' ? 'primary' : picked.variant} onClick={handleConfirm} disabled={saving}>
                {saving ? 'Saving...' : picked.confirm}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
