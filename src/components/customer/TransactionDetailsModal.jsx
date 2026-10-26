import Modal from '../ui/Modal'
import Amount from '../ui/Amount'
import StatusBadge from '../ui/StatusBadge'
import { formatAccountNumber } from '../../utils/formatAccountNumber'
import { formatDateTime } from '../../utils/formatDate'
import { accountIdOf, accountNumberOf, describeTransaction, isInactive } from '../../utils/transactions'

// "Your account" for the customer's own account, otherwise the formatted number.
const partyLabel = (account, myAccountId) => {
  if (!account) return null
  if (accountIdOf(account) === myAccountId) return 'Your account'
  const number = accountNumberOf(account)
  return number ? formatAccountNumber(number) : 'Another account'
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-divider py-3 first:border-t-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-bold text-text">{children}</dd>
    </div>
  )
}

// Dialog with everything about one transaction.
export default function TransactionDetailsModal({ tx, myAccountId, names, onClose }) {
  const { direction, title } = describeTransaction(tx, myAccountId, names)
  const incoming = direction === 'in'
  const inactive = isInactive(tx)
  const amountTone = inactive ? 'text-muted line-through' : incoming ? 'text-wallet' : 'text-error'

  return (
    <Modal title="Transaction details" onClose={onClose}>
      <p className="text-[15px] font-semibold text-text">{title}</p>
      <p className={`mt-1 font-brand text-[32px] leading-tight font-bold ${amountTone}`}>
        <Amount centavos={tx.amount} sign={inactive ? '' : incoming ? '+' : '−'} split />
      </p>
      <div className="mt-2 mb-6">
        <StatusBadge status={tx.status} />
      </div>

      <dl>
        <Row label="Type">{tx.transactionType === 'cash_in' ? 'Cash in' : 'Transfer'}</Row>
        <Row label="Reference number">{tx.referenceNumber}</Row>
        <Row label="Date and time">{formatDateTime(tx.createdAt)}</Row>
        {tx.transactionType === 'transfer' && (
          <>
            <Row label="From">{partyLabel(tx.sourceAccount, myAccountId)}</Row>
            <Row label="To">{partyLabel(tx.destinationAccount, myAccountId)}</Row>
          </>
        )}
        {tx.transactionType === 'cash_in' && <Row label="Funds">Simulated, no real money</Row>}
        {tx.flagReason && <Row label="Note">{tx.flagReason}</Row>}
      </dl>
    </Modal>
  )
}
