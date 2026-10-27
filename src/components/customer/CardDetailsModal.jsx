import { useEffect, useRef, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import CopyButton from '../ui/CopyButton'
import PasswordInput from '../auth/PasswordInput'
import AccountStatus from './AccountStatus'
import { getMyCardDetails } from '../../api/accounts'
import { formatCardNumber, maskedCardNumber } from '../../utils/formatCardNumber'

const messageOf = (err) => err.response?.data?.message ?? err.message

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-divider py-3 first:border-t-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="flex items-center gap-1 text-right text-sm font-bold text-text">{children}</dd>
    </div>
  )
}

// Asks for the password first; only then shows the full card. The details live in this
// component's state only, so closing the dialog (which unmounts it) forgets them.
export default function CardDetailsModal({ account, holder, onClose }) {
  const formRef = useRef(null)
  const [password, setPassword] = useState('')
  const [details, setDetails] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // The dialog opens after this component mounts, so wait a tick before focusing.
  useEffect(() => {
    const timer = setTimeout(() => formRef.current?.querySelector('input')?.focus(), 0)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    if (!password) {
      setError('Enter your password.')
      return
    }
    setError('')
    setBusy(true)
    try {
      const res = await getMyCardDetails(password)
      setDetails(res.data)
      setPassword('')
    } catch (err) {
      setError(messageOf(err))
      setBusy(false)
    }
  }

  return (
    <Modal title="Card details" onClose={onClose}>
      {details ? (
        <>
          <div className="rounded-2xl bg-linear-to-br from-card-deep via-ink to-wallet p-5 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <p className="text-xl font-semibold tracking-[0.06em] tabular-nums">
                {formatCardNumber(details.cardNumber)}
              </p>
              <CopyButton
                value={details.cardNumber}
                label="Copy card number"
                showLabel
                className="text-white hover:bg-white/15"
              />
            </div>
            <dl className="mt-6 flex items-end justify-between gap-4">
              <div>
                <dt className="text-xs font-semibold tracking-wider uppercase">Valid thru</dt>
                <dd className="text-2xl font-bold tabular-nums">{details.cardExpiry}</dd>
              </div>
              <div className="text-right">
                <dt className="text-xs font-semibold tracking-wider uppercase">CVC</dt>
                <dd className="text-2xl font-bold tabular-nums">{details.cardCvc}</dd>
              </div>
            </dl>
          </div>

          <dl className="mt-4">
            <Row label="Card holder">{holder}</Row>
            <Row label="Status">
              <AccountStatus status={account.status} />
            </Row>
          </dl>

          <p className="mt-4 text-xs text-muted">
            Simulated card. These details are for display only, and no real money moves. They hide again when you
            close this window.
          </p>
          <Button className="mt-4 w-full" onClick={onClose}>
            Done
          </Button>
        </>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Your card number <span className="font-bold text-text">{maskedCardNumber(account.cardLastFour)}</span> is
            hidden. Enter your password to view the full details.
          </p>
          <div className="flex flex-col gap-2">
            <label htmlFor="card-password" className="text-sm font-bold text-text">
              Password
            </label>
            <PasswordInput
              id="card-password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError('')
              }}
              describedBy={error ? 'card-password-error' : undefined}
              invalid={Boolean(error)}
            />
            {error && (
              <p id="card-password-error" role="alert" className="text-xs font-semibold text-error">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? 'Checking...' : 'View card details'}
          </Button>
        </form>
      )}
    </Modal>
  )
}
