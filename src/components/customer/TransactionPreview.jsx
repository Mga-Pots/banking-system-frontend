import { useEffect, useState } from 'react'
import { useToast } from '../ui/Toast'
import TransactionDetailsModal from './TransactionDetailsModal'
import { getMyAccount, getRecentRecipients } from '../../api/accounts'
import { cancelTransaction, getTransactionById } from '../../api/transactions'
import { useNotifications } from '../../context/NotificationsContext'

const messageOf = (err) => err.response?.data?.message ?? err.message

// Opens the details dialog for one transaction by its id, for places that only know the
// id (a notification's relatedTransaction). It loads the transaction, the customer's
// account and the recipients' names, then shows the dialog. Nothing shows while loading.
// A failed load calls `onError(message)` so the caller can tell the customer.
export default function TransactionPreview({ txId, onClose, onError }) {
  const { showToast } = useToast()
  const { refresh } = useNotifications()
  const [loaded, setLoaded] = useState(null) // { tx, account, names }

  useEffect(() => {
    let active = true
    Promise.all([
      getTransactionById(txId),
      getMyAccount(),
      // Names are a nice-to-have: the dialog falls back to the account number without them.
      getRecentRecipients().catch(() => ({ data: [] })),
    ]).then(
      ([tx, account, recipients]) => {
        if (!active) return
        setLoaded({
          tx: tx.data,
          account: account.data,
          names: Object.fromEntries(recipients.data.map((r) => [r.accountNumber, r.displayName])),
        })
      },
      (err) => active && onError(messageOf(err)),
    )
    return () => {
      active = false
    }
  }, [txId, onError])

  if (!loaded) return null

  // Cancelling a pending transfer: a failure goes back to the dialog to show.
  const handleCancel = async (tx) => {
    await cancelTransaction(tx._id)
    onClose()
    showToast('Transfer cancelled. The money was refunded to your account.')
    refresh()
  }

  return (
    <TransactionDetailsModal
      tx={loaded.tx}
      myAccountId={loaded.account._id}
      names={loaded.names}
      onClose={onClose}
      onCancel={handleCancel}
      onUpdated={(updated) => setLoaded((current) => ({ ...current, tx: updated }))}
    />
  )
}
