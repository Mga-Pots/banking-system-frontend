import Amount from '../ui/Amount'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { CheckIcon } from '../ui/Icons'

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-divider py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-bold text-text">{children}</dd>
    </div>
  )
}

// What the customer sees after funds are added, in a modal (which takes focus and closes
// on Esc). `onClose` runs on any dismissal, including "Add more".
export default function CashInSuccess({ amount, referenceNumber, onClose }) {
  return (
    <Modal title="Transaction successful" hideTitle onClose={onClose}>
      <div role="status" className="text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-mint text-ink"
        >
          <CheckIcon size={24} />
        </span>
        <p className="mt-3 text-2xl font-bold text-text">Transaction Successful!</p>
        <p className="mt-1 text-sm text-muted">
          <Amount centavos={amount} className="font-semibold text-text" /> was added to your account. These are
          simulated funds, so no real money moved.
        </p>
      </div>

      <dl className="mt-5">
        <Row label="Amount added">
          <Amount centavos={amount} />
        </Row>
        <Row label="Reference number">
          <span className="tabular-nums">{referenceNumber}</span>
        </Row>
      </dl>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button to="/customer" size="lg" className="sm:flex-1">
          Back to overview
        </Button>
        <Button variant="secondary" size="lg" className="sm:flex-1" onClick={onClose}>
          Add more
        </Button>
      </div>
    </Modal>
  )
}
