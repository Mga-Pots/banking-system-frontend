import { ChevronDownIcon } from '../ui/Icons'

// A compact dropdown for a filter bar (its label is for screen readers only).
// Same look as the one on the admin Users page.
export default function FilterSelect({ id, label, value, onChange, children }) {
  return (
    <div className="relative sm:w-48">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full cursor-pointer appearance-none rounded-xl border-[1.5px] border-field-line bg-field pr-11 pl-4 text-[15px] text-text outline-none transition focus:border-wallet focus:ring-4 focus:ring-wallet/20"
      >
        {children}
      </select>
      <ChevronDownIcon size={18} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink" />
    </div>
  )
}
