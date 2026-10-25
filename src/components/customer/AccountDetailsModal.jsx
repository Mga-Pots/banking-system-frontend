import Modal from '../ui/Modal'
import Sensitive from '../ui/Sensitive'
import CopyButton from '../ui/CopyButton'
import AccountStatus from './AccountStatus'
import { cardDetailsFor } from '../../utils/cardDetails'
import { formatAccountNumber, lastFour } from '../../utils/formatAccountNumber'
import { formatLongDate } from '../../utils/formatDate'

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-divider py-3 first:border-t-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="flex items-center gap-1 text-right text-sm font-bold text-text">{children}</dd>
    </div>
  )
}

// The back of the account card (valid thru and CVC), plus the account's details.
export default function AccountDetailsModal({ account, holder, onClose }) {
  const { expiry, cvc } = cardDetailsFor(account)

  return (
    <Modal title="Account details" onClose={onClose}>
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-card-deep via-ink to-wallet text-white shadow-lg">
        <div aria-hidden="true" className="mt-5 h-10 bg-black/70" />
        <dl className="flex items-end justify-between gap-4 p-5">
          <div>
            <dt className="text-xs font-semibold tracking-wider uppercase">Valid thru</dt>
            <dd className="text-2xl font-bold tabular-nums">{expiry}</dd>
          </div>
          <div className="text-right">
            <dt className="text-xs font-semibold tracking-wider uppercase">CVC</dt>
            <dd className="text-2xl font-bold tabular-nums">
              <Sensitive mask="•••">{cvc}</Sensitive>
            </dd>
          </div>
        </dl>
      </div>

      <dl className="mt-4">
        <Row label="Account number">
          <span className="tabular-nums">
            <Sensitive mask={`•••• •••• ${lastFour(account.accountNumber)}`}>
              {formatAccountNumber(account.accountNumber)}
            </Sensitive>
          </span>
          <CopyButton
            value={account.accountNumber}
            label="Copy account number"
            showLabel
            className="text-ink hover:bg-mint"
          />
        </Row>
        <Row label="Account holder">{holder}</Row>
        <Row label="Status">
          <AccountStatus status={account.status} />
        </Row>
        <Row label="Date opened">{formatLongDate(account.createdAt)}</Row>
      </dl>

      <p className="mt-4 text-xs text-muted">
        Simulated account. The expiry date and CVC are for display only, and no real money moves.
      </p>
    </Modal>
  )
}
