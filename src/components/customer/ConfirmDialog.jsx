import { useState } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

const messageOf = (err) => err.response?.data?.message ?? err.message

// Asks before something that can't be undone. `onConfirm` should return a promise that
// rejects with the error to show; on success the caller closes the dialog (by no longer
// rendering it). Both buttons stay disabled while it runs.
export default function ConfirmDialog({ title, confirmLabel, busyLabel, onConfirm, onClose, children }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const confirm = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await onConfirm()
    } catch (err) {
      setError(messageOf(err))
      setBusy(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="text-sm text-muted">{children}</div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-error">
          {error}
        </p>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="danger" onClick={confirm} disabled={busy}>
          {busy ? busyLabel : confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Keep
        </Button>
      </div>
    </Modal>
  )
}
