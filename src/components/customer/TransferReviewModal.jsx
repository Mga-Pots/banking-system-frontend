import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Amount from '../ui/Amount'
import { useAuth } from '../../context/AuthContext'
import { lookupAccount } from '../../api/accounts'
import { transfer } from '../../api/transactions'
import { formatAccountNumber } from '../../utils/formatAccountNumber'
import { maskedName } from '../../utils/names'
import { APPROVAL_THRESHOLD_TEXT, needsApproval } from '../../utils/transferRules'

const messageOf = (err) => err.response?.data?.message ?? err.message

// The review step before any money moves. It checks the recipient, shows who gets
// what, and only sends when the customer confirms. The Transfer page will reuse it.
// Both accounts show their holder's short name (like "Juan D.") and the full account
// number, saved recipient or not, so a wrong number can be caught before the money moves.
// `onSent(transaction)` runs after a successful transfer.
export default function TransferReviewModal({ recipientAccountNumber, amount, fromAccount, onClose, onSent }) {
  const { user } = useAuth()
  const [lookup, setLookup] = useState({ status: 'loading', recipient: null, error: '' })
  const [submit, setSubmit] = useState({ sending: false, error: '' })

  useEffect(() => {
    let active = true
    lookupAccount(recipientAccountNumber)
      .then((res) => active && setLookup({ status: 'ready', recipient: res.data, error: '' }))
      .catch((err) => active && setLookup({ status: 'error', recipient: null, error: messageOf(err) }))
    return () => {
      active = false
    }
  }, [recipientAccountNumber])

  const confirm = async () => {
    setSubmit({ sending: true, error: '' })
    try {
      const res = await transfer({ recipientAccountNumber, amount })
      onSent(res.data)
    } catch (err) {
      setSubmit({ sending: false, error: messageOf(err) })
    }
  }

  const { recipient } = lookup
  const approval = needsApproval(amount)

  return (
    <Modal title="Review transfer" onClose={onClose}>
      <p className="text-sm text-muted">You are sending</p>
      <p className="mb-4 font-brand text-[32px] leading-tight font-bold text-text">
        <Amount centavos={amount} split />
      </p>

      <dl>
        <div className="flex items-start justify-between gap-4 border-t border-divider py-3">
          <dt className="text-sm text-muted">From</dt>
          <dd className="text-right text-sm font-bold text-text">
            {user?.name && <span className="block">{maskedName(user.name)}</span>}
            <span className="block tabular-nums">{formatAccountNumber(fromAccount.accountNumber)}</span>
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 border-t border-divider py-3">
          <dt className="text-sm text-muted">To</dt>
          <dd className="text-right text-sm font-bold text-text">
            {lookup.status === 'loading' && <span className="font-normal text-muted">Checking account…</span>}
            {recipient && <span className="block">{recipient.displayName}</span>}
            <span className="block tabular-nums">{formatAccountNumber(recipientAccountNumber)}</span>
          </dd>
        </div>
      </dl>

      <p
        className={`mt-3 rounded-xl px-4 py-3 text-sm ${approval ? 'bg-status-pending font-semibold text-status-pending-text' : 'bg-field text-muted'}`}
      >
        {approval
          ? `Transfers of ${APPROVAL_THRESHOLD_TEXT} or more need bank approval before they go through. You are charged now, and the recipient is credited once the bank approves it.`
          : `This transfer goes through right away. Transfers of ${APPROVAL_THRESHOLD_TEXT} or more need bank approval first.`}
      </p>

      {lookup.status === 'error' && (
        <p role="alert" className="mt-3 text-sm font-semibold text-error">
          {lookup.error}
        </p>
      )}
      {submit.error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-error">
          {submit.error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
          {lookup.status === 'error' ? 'Go back' : 'Cancel'}
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={lookup.status !== 'ready' || submit.sending}
          onClick={confirm}
        >
          {submit.sending ? 'Sending…' : approval ? 'Proceed' : 'Confirm transfer'}
        </Button>
      </div>
    </Modal>
  )
}
