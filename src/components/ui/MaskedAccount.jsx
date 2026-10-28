import { accountEnding, maskAccountNumber } from '../../utils/formatAccountNumber'

// An account number as "•••• 7890". Screen readers hear "account ending 7890" instead of
// the bullet characters. Use it for anyone else's account, and for receipts.
export default function MaskedAccount({ value, className = '' }) {
  return (
    <span className={`tabular-nums ${className}`}>
      <span aria-hidden="true">{maskAccountNumber(value)}</span>
      <span className="sr-only">{accountEnding(value)}</span>
    </span>
  )
}
