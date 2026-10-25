import Sensitive from '../ui/Sensitive'
import CopyButton from '../ui/CopyButton'
import { ArrowRightIcon } from '../ui/Icons'
import AccountStatus from './AccountStatus'
import { formatAccountNumber, lastFour } from '../../utils/formatAccountNumber'

// The front of the account card: brand, status, account number, holder.
// A frosted tile that sits on the deep-green balance banner. When the account isn't
// active it loses most of its color.
export default function AccountCard({ account, holder, onViewDetails, onCopied }) {
  const inactive = account.status !== 'active'

  return (
    <div
      className={`relative isolate flex min-h-[190px] flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-white/15 bg-linear-to-br from-white/15 to-white/5 p-5 text-white backdrop-blur-sm transition ${inactive ? 'saturate-[.3]' : ''}`}
    >
      <div className="relative flex items-start justify-between gap-3">
        <span className="font-brand text-xl font-bold">sinop</span>
        <AccountStatus status={account.status} onDark />
      </div>

      <div className="relative flex items-center gap-2">
        <p className="text-xl font-semibold tracking-[0.06em] whitespace-nowrap tabular-nums">
          <Sensitive mask={`•••• •••• ${lastFour(account.accountNumber)}`}>
            {formatAccountNumber(account.accountNumber)}
          </Sensitive>
        </p>
        <CopyButton
          value={account.accountNumber}
          label="Copy account number"
          onCopied={onCopied}
          className="text-white hover:bg-white/15"
        />
      </div>

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
