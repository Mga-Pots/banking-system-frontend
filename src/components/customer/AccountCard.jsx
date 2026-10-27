import { ArrowRightIcon } from '../ui/Icons'
import AccountStatus from './AccountStatus'
import { maskedCardNumber } from '../../utils/formatCardNumber'

// The front of the card: brand, status, masked card number, holder.
// A frosted tile that sits on the deep-green balance banner. When the account isn't
// active it loses most of its color. The card number is always masked here and is not
// covered by the hide-details eye: it only unlocks with the password in "View Details".
export default function AccountCard({ account, holder, onViewDetails }) {
  const inactive = account.status !== 'active'

  return (
    <div
      className={`relative isolate flex min-h-[190px] flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-white/15 bg-linear-to-br from-white/15 to-white/5 p-5 text-white backdrop-blur-sm transition ${inactive ? 'saturate-[.3]' : ''}`}
    >
      <div className="relative flex items-start justify-between gap-3">
        <span className="font-brand text-xl font-bold">sinop</span>
        <AccountStatus status={account.status} onDark />
      </div>

      <p className="relative text-xl font-semibold tracking-[0.06em] whitespace-nowrap tabular-nums">
        {/* Sora draws the bullet as a square, so the mask uses the body face */}
        <span aria-hidden="true" className="font-sans font-medium">
          {maskedCardNumber(account.cardLastFour)}
        </span>
        <span className="sr-only">Card ending in {account.cardLastFour}</span>
      </p>

      <div className="relative flex items-end justify-between gap-3 text-xs">
        <span className="font-semibold tracking-wider uppercase">{holder}</span>
        <button
          type="button"
          onClick={onViewDetails}
          className="-my-3.5 inline-flex cursor-pointer items-center gap-1 py-3.5 font-bold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          View Details <ArrowRightIcon size={14} />
        </button>
      </div>
    </div>
  )
}
