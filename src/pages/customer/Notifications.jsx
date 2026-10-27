import { useCallback, useState } from 'react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Skeleton from '../../components/ui/Skeleton'
import { BellIcon } from '../../components/ui/Icons'
import { useToast } from '../../components/ui/Toast'
import ConfirmDialog from '../../components/customer/ConfirmDialog'
import NotificationRow from '../../components/customer/NotificationRow'
import TransactionPreview from '../../components/customer/TransactionPreview'
import { useNotifications } from '../../context/NotificationsContext'

const messageOf = (err) => err.response?.data?.message ?? err.message

export default function Notifications() {
  const { showToast } = useToast()
  const { status, items, error, hasMore, unread, retry, loadMore, markRead, markAllRead, remove, clearAll } =
    useNotifications()
  const [previewId, setPreviewId] = useState(null)
  const [toDelete, setToDelete] = useState(null) // a notification, or 'all'
  const [markingAll, setMarkingAll] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState('')

  const handleOpen = (notification) => {
    if (!notification.isRead) markRead(notification._id).catch((err) => showToast(messageOf(err)))
    if (notification.relatedTransaction) setPreviewId(notification.relatedTransaction)
  }

  const closePreview = useCallback(() => setPreviewId(null), [])
  const previewFailed = useCallback(
    (message) => {
      setPreviewId(null)
      showToast(message)
    },
    [showToast],
  )

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      await markAllRead()
      showToast('All notifications marked as read.')
    } catch (err) {
      showToast(messageOf(err))
    } finally {
      setMarkingAll(false)
    }
  }

  const handleLoadMore = async () => {
    setLoadingMore(true)
    setMoreError('')
    try {
      await loadMore()
    } catch (err) {
      setMoreError(messageOf(err))
    } finally {
      setLoadingMore(false)
    }
  }

  // Runs inside the confirm dialog, which shows a failure; on success the dialog closes.
  const confirmDelete = async () => {
    if (toDelete === 'all') {
      await clearAll()
      showToast('All notifications cleared.')
    } else {
      await remove(toDelete._id)
      showToast('Notification deleted.')
    }
    setToDelete(null)
  }

  if (status === 'error') {
    return (
      <Card role="alert">
        <h2 className="text-xl font-bold text-text">We couldn’t load your notifications</h2>
        <p className="mt-1 mb-4 text-muted">{error}</p>
        <Button onClick={retry}>Try again</Button>
      </Card>
    )
  }

  return (
    <div>
      {/* The page title ("Notifications") is shown in the header */}
      <Card aria-busy={status === 'loading'} className="p-0">
        {status === 'loading' && (
          <div className="space-y-3 p-6">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        )}

        {status === 'ready' && items.length === 0 && (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-mint text-ink">
              <BellIcon size={24} />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-text">
              You have no notifications
            </p>
            <p className="mt-1 text-sm text-muted">
              When something happens with your account or a transaction, you will see it here.
            </p>
          </div>
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-4 py-3">
              <p className="text-sm text-muted" aria-live="polite">
                {unread > 0 ? `${unread} unread` : 'All caught up'}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleMarkAll} disabled={unread === 0 || markingAll}>
                  Mark all as read
                </Button>
                <Button variant="secondary" onClick={() => setToDelete('all')}>
                  Clear all
                </Button>
              </div>
            </div>

            <ul className="divide-y divide-divider">
              {items.map((n) => (
                <NotificationRow key={n._id} notification={n} onOpen={handleOpen} onDelete={setToDelete} />
              ))}
            </ul>

            {hasMore && (
              <div className="border-t border-divider p-4 text-center">
                {moreError && (
                  <p role="alert" className="mb-3 text-sm font-semibold text-error">
                    {moreError}
                  </p>
                )}
                <Button variant="secondary" onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {toDelete && (
        <ConfirmDialog
          title={toDelete === 'all' ? 'Clear all notifications?' : 'Delete this notification?'}
          confirmLabel={toDelete === 'all' ? 'Clear all' : 'Delete'}
          busyLabel={toDelete === 'all' ? 'Clearing...' : 'Deleting...'}
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
        >
          {toDelete === 'all' ? (
            <p>
              This removes every notification you have, including ones that are not loaded on this page yet. It
              cannot be undone.
            </p>
          ) : (
            <p>This removes it from your list. It cannot be undone.</p>
          )}
        </ConfirmDialog>
      )}

      {previewId && <TransactionPreview txId={previewId} onClose={closePreview} onError={previewFailed} />}
    </div>
  )
}
