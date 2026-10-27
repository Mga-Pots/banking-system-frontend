import { ArrowRightIcon, BellIcon, CardIcon, ChevronRightIcon, CloseIcon, ShieldIcon } from '../ui/Icons'
import { formatDateTime, formatRelative } from '../../utils/formatDate'

// Which icon each type gets. Anything the backend adds later falls back to the bell.
// The icon comes from `type` only; the message text is never read for meaning.
const iconByType = {
  transaction: ArrowRightIcon,
  account: CardIcon,
  security: ShieldIcon,
  system: BellIcon,
}

// One notification. The row opens it (marks it read, and shows its transaction when it
// has one). With `onDelete` it also has a delete button; the bell dropdown leaves that out
// and uses `compact`, which shows the relative time instead of the full date.
export default function NotificationRow({ notification, onOpen, onDelete, compact = false }) {
  const Icon = iconByType[notification.type] ?? BellIcon
  const unread = !notification.isRead
  const linked = Boolean(notification.relatedTransaction)

  return (
    <li className={`flex items-stretch ${unread ? 'bg-ground' : ''}`}>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 px-4 py-3 text-left transition hover:bg-mint/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-wallet"
      >
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-mint text-ink"
        >
          <Icon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          {unread && <span className="sr-only">Unread. </span>}
          <span className={`block text-sm text-text ${unread ? 'font-bold' : ''}`}>{notification.message}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
            <time dateTime={notification.createdAt}>
              {compact ? formatRelative(notification.createdAt) : formatDateTime(notification.createdAt)}
            </time>
            {linked && !compact && (
              <span className="inline-flex items-center gap-0.5 font-semibold text-wallet">
                View transaction <ChevronRightIcon size={14} />
              </span>
            )}
          </span>
        </span>
        {unread && <span aria-hidden="true" className="mt-2 size-2.5 shrink-0 rounded-full bg-wallet" />}
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(notification)}
          aria-label="Delete notification"
          className="m-2 flex size-11 shrink-0 cursor-pointer items-center justify-center self-center rounded-full text-muted transition hover:bg-mint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
        >
          <CloseIcon size={18} />
        </button>
      )}
    </li>
  )
}
