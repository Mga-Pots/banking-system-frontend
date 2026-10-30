// Labelled text field. `error` and `hint` are linked to the input for screen readers.
// `prefix` is a symbol shown inside the field, like ₱. `hideLabel` keeps the label for
// screen readers only (a search box in a filter bar, where the placeholder says it).
export default function Input({ id, label, hideLabel = false, error, hint, prefix, className = '', ...rest }) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-sm font-bold text-text'}>
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[15px] font-bold text-muted"
          >
            {prefix}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`h-12 w-full min-w-0 rounded-xl border-[1.5px] border-field-line bg-field pr-4 text-[15px] text-text outline-none transition placeholder:text-placeholder focus:border-wallet focus:ring-4 focus:ring-wallet/20 aria-invalid:border-error disabled:opacity-50 ${prefix ? 'pl-9' : 'pl-4'} ${className}`}
          {...rest}
        />
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  )
}
