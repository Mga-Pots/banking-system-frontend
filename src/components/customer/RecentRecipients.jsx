import { PlusIcon } from '../ui/Icons'
import { lastFour } from '../../utils/formatAccountNumber'
import { firstNameOf } from '../../utils/names'

const circle =
  'flex size-12 cursor-pointer items-center justify-center rounded-full text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet'

// The people this customer sent money to lately, as initials circles, plus a "New" button.
// `selected` is the 12-digit number currently typed (no spaces).
// `onChoose(recipient)` fills it in; `onNew` is for sending to an account that isn't listed.
export default function RecentRecipients({ recipients, selected, onChoose, onNew }) {
  return (
    <>
      <p id="recipients-label" className="mb-3 text-sm text-muted">
        Recent recipients
      </p>
      <div role="group" aria-labelledby="recipients-label" className="flex gap-3">
        {recipients.map((recipient) => {
          const isSelected = recipient.accountNumber === selected
          return (
            <div key={recipient.accountNumber} className="flex w-14 flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => onChoose(recipient)}
                aria-pressed={isSelected}
                aria-label={`${recipient.displayName}, account ending ${lastFour(recipient.accountNumber)}`}
                className={`${circle} ${isSelected ? 'bg-ink text-white' : 'bg-mint text-ink hover:bg-mint'}`}
              >
                {recipient.initials}
              </button>
              <span aria-hidden="true" className="max-w-full truncate text-xs text-muted">
                {firstNameOf(recipient.displayName)}
              </span>
            </div>
          )
        })}
        <div className="flex w-14 flex-col items-center gap-1">
          <button
            type="button"
            onClick={onNew}
            aria-label="Send to a new account"
            className={`${circle} border-[1.5px] border-dashed border-wallet text-wallet hover:bg-mint`}
          >
            <PlusIcon size={18} />
          </button>
          <span aria-hidden="true" className="text-xs text-muted">
            New
          </span>
        </div>
      </div>
    </>
  )
}
