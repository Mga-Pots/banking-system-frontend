import Amount from '../ui/Amount'
import Button from '../ui/Button'
import Sensitive from '../ui/Sensitive'
import { CheckIcon } from '../ui/Icons'
import { formatAccountNumber, lastFour } from '../../utils/formatAccountNumber'

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-divider py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-bold text-text">{children}</dd>
    </div>
  )
}

// What the customer sees after a transfer is sent. The container takes focus (via `ref`)
// so keyboard and screen-reader users land on the result. A held transfer says so in
// plain English: the sender is charged, the recipient is credited after bank approval.
export default function TransferSuccess({ ref, transaction, recipientName, accountNumber, balance, onSendAnother }) {
  const held = transaction.status === 'pending'

  return (
    <div ref={ref} tabIndex={-1} className="outline-none">
      <div role="status">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-mint text-ink"
        >
          <CheckIcon size={24} />
        </span>
        <h2 className="mt-4 text-xl font-bold text-text">
          {held ? 'Waiting for bank approval' : <span lang="fil">Naipadala na</span>}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {held ? (
            <>
              Your transfer of <Amount centavos={transaction.amount} className="font-semibold text-text" /> needs
              bank approval before it goes through. You have been charged, and the recipient is credited once the
              bank approves it. You can cancel it while it is waiting.
            </>
          ) : (
            <>
              <Amount centavos={transaction.amount} className="font-semibold text-text" /> was sent right away.
            </>
          )}
        </p>
      </div>

      <dl className="mt-5">
        <Row label="Amount">
          <Amount centavos={transaction.amount} />
        </Row>
        <Row label="To">
          {recipientName && <span className="block">{recipientName}</span>}
          <span className="block tabular-nums">
            <Sensitive mask={`•••• •••• ${lastFour(accountNumber)}`}>{formatAccountNumber(accountNumber)}</Sensitive>
          </span>
        </Row>
        <Row label="New balance">
          <Amount centavos={balance} sensitive />
        </Row>
        <Row label="Status">{held ? 'Waiting for approval' : 'Completed'}</Row>
        <Row label="Reference number">
          <span className="tabular-nums">{transaction.referenceNumber}</span>
        </Row>
      </dl>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button to="/customer/history" size="lg">
          View transaction history
        </Button>
        <Button variant="secondary" size="lg" onClick={onSendAnother}>
          Send another
        </Button>
      </div>
    </div>
  )
}
