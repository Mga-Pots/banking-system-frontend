import Amount from '../ui/Amount'
import Button from '../ui/Button'
import { CheckIcon } from '../ui/Icons'

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-divider py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-bold text-text">{children}</dd>
    </div>
  )
}

// What the customer sees after funds are added. The container takes focus (via `ref`)
// so keyboard and screen-reader users land on the result.
export default function CashInSuccess({ ref, amount, balance, referenceNumber, onAddMore }) {
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
          <span lang="fil">Naidagdag na</span>
        </h2>
        <p className="mt-1 text-sm text-muted">
          <Amount centavos={amount} className="font-semibold text-text" /> was added to your account. These are
          simulated funds, so no real money moved.
        </p>
      </div>

      <dl className="mt-5">
        <Row label="Amount added">
          <Amount centavos={amount} />
        </Row>
        <Row label="New balance">
          <Amount centavos={balance} sensitive />
        </Row>
        <Row label="Reference number">
          <span className="tabular-nums">{referenceNumber}</span>
        </Row>
      </dl>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button to="/customer" size="lg">
          Back to overview
        </Button>
        <Button variant="secondary" size="lg" onClick={onAddMore}>
          Add more
        </Button>
      </div>
    </div>
  )
}
