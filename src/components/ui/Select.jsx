import { ChevronDownIcon } from './Icons'

// A labelled dropdown, styled like <Input>: same label, height, border and focus.
// The arrow on the right shows that there is a list to choose from. `hint` is the
// text under the field (anything, including a loading placeholder). `hideLabel` keeps
// the label for screen readers only, for filter bars whose options name the filter
// ("Type: All").
export default function Select({ id, label, hideLabel = false, hint, error, className = '', children, ...rest }) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-sm font-bold text-text'}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`h-12 w-full min-w-0 cursor-pointer appearance-none rounded-xl border-[1.5px] border-field-line bg-field pr-11 pl-4 text-[15px] text-text outline-none transition focus:border-wallet focus:ring-4 focus:ring-wallet/20 aria-invalid:border-error disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          {...rest}
        >
          {children}
        </select>
        <ChevronDownIcon
          size={18}
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink"
        />
      </div>
      {hint && (
        <div id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  )
}
