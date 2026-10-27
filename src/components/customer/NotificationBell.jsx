import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellIcon } from '../ui/Icons'
import Skeleton from '../ui/Skeleton'
import { useToast } from '../ui/Toast'
import NotificationRow from './NotificationRow'
import TransactionPreview from './TransactionPreview'
import { useNotifications } from '../../context/NotificationsContext'

const BELL_COUNT = 5

const messageOf = (err) => err.response?.data?.message ?? err.message

// The bell in the header: an unread badge, and a dropdown with the latest few
// notifications. "See all" goes to the full page. Clicking one marks it read and, when it
// has a transaction, opens the details.
export default function NotificationBell({ className = '' }) {
  const { status, items, error, unread, refresh, retry, markRead } = useNotifications()
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [previewId, setPreviewId] = useState(null)
  const wrapRef = useRef(null)
  const triggerRef = useRef(null)

  // Close on Esc or a click outside, and give focus back to the bell on Esc.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = () => {
    if (!open) refresh()
    setOpen((current) => !current)
  }

  const handleOpen = (notification) => {
    if (!notification.isRead) markRead(notification._id).catch((err) => showToast(messageOf(err)))
    if (notification.relatedTransaction) {
      setOpen(false)
      setPreviewId(notification.relatedTransaction)
    }
  }

  const closePreview = useCallback(() => setPreviewId(null), [])
  const previewFailed = useCallback(
    (message) => {
      setPreviewId(null)
      showToast(message)
    },
    [showToast],
  )

  const latest = items.slice(0, BELL_COUNT)

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        className={className}
      >
        <BellIcon size={20} />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-wallet px-1 text-[11px] font-bold text-white"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-divider">
          <p className="border-b border-divider px-4 py-3 text-sm font-bold text-text">Notifications</p>

          {status === 'loading' && (
            <div aria-busy="true" className="space-y-3 p-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          )}

          {status === 'error' && (
            <div role="alert" className="p-4">
              <p className="text-sm font-semibold text-text">We couldn’t load your notifications</p>
              <p className="mt-1 text-sm text-muted">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-3 cursor-pointer text-sm font-bold text-wallet underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
              >
                Try again
              </button>
            </div>
          )}

          {status === 'ready' && latest.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted">You have no notifications.</p>
          )}

          {status === 'ready' && latest.length > 0 && (
            <ul className="divide-y divide-divider">
              {latest.map((n) => (
                <NotificationRow key={n._id} notification={n} onOpen={handleOpen} compact />
              ))}
            </ul>
          )}

          <Link
            to="/customer/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-divider px-4 py-3 text-center text-sm font-bold text-wallet transition hover:bg-ground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-wallet"
          >
            See all
          </Link>
        </div>
      )}

      {previewId && <TransactionPreview txId={previewId} onClose={closePreview} onError={previewFailed} />}
    </div>
  )
}
