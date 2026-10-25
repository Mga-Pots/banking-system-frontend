import Amount from '../ui/Amount'
import StatusBadge from '../ui/StatusBadge'
import { ArrowDownLeftIcon, ArrowUpRightIcon, PlusIcon } from '../ui/Icons'
import { describeTransaction, isInactive } from '../../utils/transactions'
import { formatTransactionDate } from '../../utils/formatDate'

// One line in a transaction list. Opens the transaction's details when pressed.
// `names` maps account numbers to people, so rows can say "To Pedro G.".
export default function TransactionRow({ tx, myAccountId, names, onSelect }) {
  const { direction, title } = describeTransaction(tx, myAccountId, names)
  const incoming = direction === 'in'
  const inactive = isInactive(tx)
  const amountTone = inactive ? 'text-muted line-through' : incoming ? 'text-wallet' : 'text-text'

  const Icon = tx.transactionType === 'cash_in' ? PlusIcon : incoming ? ArrowDownLeftIcon : ArrowUpRightIcon

  return (
    <button
      type="button"
      onClick={() => onSelect(tx)}
      className="grid w-full cursor-pointer grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 rounded-2xl px-2 py-4 text-left transition hover:bg-field focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-wallet sm:grid-cols-[auto_1fr_auto_auto]"
    >
      <span
        aria-hidden="true"
        className={`flex size-10 items-center justify-center rounded-full border border-divider ${incoming ? 'text-wallet' : 'text-text'}`}
      >
        <Icon size={18} />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold text-text">{title}</span>
        <span className="block text-sm text-muted">
          {formatTransactionDate(tx.createdAt)}
          <span className="hidden sm:inline"> · {tx.referenceNumber}</span>
        </span>
      </span>

      <span className="col-start-2 flex items-center justify-between gap-4 sm:contents">
        <StatusBadge status={tx.status} />
        <Amount
          centavos={tx.amount}
          sign={inactive ? '' : incoming ? '+' : '−'}
          className={`font-brand text-right text-[15px] font-semibold sm:min-w-28 ${amountTone}`}
        />
      </span>
    </button>
  )
}
