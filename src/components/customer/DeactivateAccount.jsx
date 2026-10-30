import { startTransition, useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Amount from '../ui/Amount'
import Skeleton from '../ui/Skeleton'
import { useAuth } from '../../context/AuthContext'
import { getMyAccount } from '../../api/accounts'
import { deactivateMe } from '../../api/users'

const messageOf = (err) => err.response?.data?.message ?? err.message

// Shown on the login page after deactivating (Login shows location.state.notice).
const DEACTIVATED_NOTICE = 'Your account is deactivated. To use it again, contact the bank.'

// The confirmation. It loads the balance first: with money still in the account the
// backend refuses, so the dialog says so up front instead of offering the button.
// Held transfers are only known to the backend; its refusal shows as the error.
function DeactivateDialog({ onClose }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [account, setAccount] = useState({ status: 'loading', data: null, error: '' })
  const [understood, setUnderstood] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const checkId = useId()

  useEffect(() => {
    let active = true
    getMyAccount()
      .then((res) => active && setAccount({ status: 'ready', data: res.data, error: '' }))
      .catch((err) => active && setAccount({ status: 'error', data: null, error: messageOf(err) }))
    return () => {
      active = false
    }
  }, [])

  const handleDeactivate = async () => {
    setError('')
    setSaving(true)
    try {
      await deactivateMe()
      // The backend won't accept this session any more: end it here and say why. Both in
      // one transition: on its own, the logout renders first and ProtectedRoute's own
      // redirect to /login wins, dropping the notice.
      startTransition(() => {
        logout()
        navigate('/login', { replace: true, state: { notice: DEACTIVATED_NOTICE } })
      })
    } catch (err) {
      setError(messageOf(err))
      setSaving(false)
    }
  }

  const balance = account.data?.balance ?? 0

  return (
    <Modal title="Deactivate your account?" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {account.status === 'loading' ? (
          <Skeleton className="h-28" />
        ) : balance > 0 ? (
          <>
            <p role="alert" className="rounded-xl bg-status-pending px-4 py-3.5 text-sm font-semibold text-status-pending-text">
              Your account still has <Amount centavos={balance} />. Transfer it to another account first, then come
              back to deactivate.
            </p>
            <Button variant="secondary" onClick={onClose}>
              OK
            </Button>
          </>
        ) : (
          <>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-text">
              <li>You’ll be logged out and won’t be able to log in again.</li>
              <li>Your bank account is frozen, so no money can go in or out.</li>
              <li>Your transaction history stays on record.</li>
              <li>To use your account again, you’ll need to contact the bank.</li>
            </ul>
            {account.status === 'error' && (
              <p className="text-sm text-muted">We couldn’t check your balance ({account.error}). The bank will check it when you continue.</p>
            )}

            <label htmlFor={checkId} className="flex cursor-pointer items-start gap-3 text-sm font-semibold text-text">
              <input
                id={checkId}
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-ink"
              />
              I understand I won’t be able to log in after this.
            </label>

            {error && (
              <p role="alert" className="rounded-xl bg-status-failed px-4 py-3 text-sm font-semibold text-status-failed-text">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeactivate} disabled={!understood || saving}>
                {saving ? 'Deactivating…' : 'Deactivate account'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

// The last card on the customer's Profile & settings (PATCH /users/me/deactivate).
export default function DeactivateAccount() {
  const titleId = useId()
  const [open, setOpen] = useState(false)

  return (
    <Card aria-labelledby={titleId}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-bold text-text">
            Deactivate account
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Stop using sinop. Your balance must be ₱0.00 and no transfer can be waiting.
          </p>
        </div>
        <Button variant="secondary" className="shrink-0" onClick={() => setOpen(true)}>
          Deactivate
        </Button>
      </div>
      {open && <DeactivateDialog onClose={() => setOpen(false)} />}
    </Card>
  )
}
