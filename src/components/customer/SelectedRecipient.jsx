import { useId } from 'react'
import MaskedAccount from '../ui/MaskedAccount'

// A saved recipient that has been picked, shown in place of the account number field:
// name and masked last four. "Change" clears it so a new number can be typed.
export default function SelectedRecipient({ recipient, onClear }) {
  const labelId = useId()

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <p id={labelId} className="text-sm font-bold text-text">
        Recipient
      </p>
      <div className="flex min-h-12 items-center gap-3 rounded-xl border-[1.5px] border-field-line bg-field py-1 pr-1 pl-3">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-bold text-ink"
        >
          {recipient.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-text">{recipient.displayName}</span>
          <MaskedAccount value={recipient.accountNumber} className="block text-xs text-muted" />
        </span>
        <button
          type="button"
          onClick={onClear}
          aria-label="Change recipient"
          className="flex h-11 shrink-0 cursor-pointer items-center rounded-full px-4 text-sm font-bold text-wallet transition hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
        >
          Change
        </button>
      </div>
    </div>
  )
}
