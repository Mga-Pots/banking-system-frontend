import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Amount from '../ui/Amount'
import DetailsList from '../ui/DetailsList'
import MaskedAccount from '../ui/MaskedAccount'
import { ClipboardIcon, CloseIcon } from '../ui/Icons'
import { submitTransferVerification } from '../../api/transactions'
import { accountNumberOf } from '../../utils/transactions'

// Uploading is simulated, like the rest of the money in this project: storing real files
// would need a backend we don't have, so "Attach a document" attaches this sample and only
// its name is ever sent. Swapping in a real file input later only changes this component.
const SAMPLE_DOCUMENT = 'valid-id.jpg'

// The sender's side of a document check on a flagged transfer: they send something that
// shows the transfer is theirs, usually a photo of a valid ID. Attaching it is the
// confirmation, so there is nothing else to tick.
// `onSubmitted(tx)` runs once it has gone through.
export default function VerifyTransferModal({ tx, onClose, onSubmitted }) {
  const [document, setDocument] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const recipient = accountNumberOf(tx.destinationAccount)

  const handleSubmit = async () => {
    setError('')
    setSaving(true)
    try {
      const res = await submitTransferVerification(tx._id, document)
      onSubmitted(res.data)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title="Upload a document for this transfer?" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="-mt-2 text-sm text-muted">
          The bank checks a document before this transfer can go through. You have already been charged, and the
          recipient is credited once it is approved.
        </p>
        <DetailsList
          rows={[
            ['Amount', <Amount key="amount" centavos={tx.amount} />],
            ['To', recipient ? <MaskedAccount key="to" value={recipient} /> : 'Another account'],
            ['Reference', tx.referenceNumber],
            ...(tx.flagReason ? [['Reason', tx.flagReason]] : []),
          ]}
        />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-text">Your document</p>
          {document ? (
            <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-field-line bg-field py-1 pr-1 pl-3">
              <ClipboardIcon size={18} className="shrink-0 text-ink" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text">{document}</span>
              <button
                type="button"
                onClick={() => setDocument('')}
                aria-label={`Remove ${document}`}
                disabled={saving}
                className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-mint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CloseIcon size={16} />
              </button>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setDocument(SAMPLE_DOCUMENT)}>
              <ClipboardIcon size={18} />
              Attach a document
            </Button>
          )}
          <p className="text-xs text-muted">
            A photo of a valid ID, or anything else that shows this transfer is yours. For this demo a sample file
            is attached for you, and nothing leaves your device.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!document || saving}>
            {saving ? 'Sending...' : 'Send for review'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
