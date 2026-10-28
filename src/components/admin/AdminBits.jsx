import { ChevronDownIcon, SearchIcon } from '../ui/Icons'
import { initialsOf } from '../../utils/names'

// Small pieces shared by the admin pages.

export function Avatar({ name, size = 'md' }) {
  const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm' }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-mint font-bold text-ink ${sizes[size]}`}
    >
      {initialsOf(name)}
    </span>
  )
}

export function SearchInput({ id, label, value, onChange, placeholder }) {
  return (
    <div className="relative flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <SearchIcon size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full min-w-0 rounded-xl border-[1.5px] border-field-line bg-field pr-4 pl-11 text-[15px] text-text outline-none transition placeholder:text-placeholder focus:border-wallet focus:ring-4 focus:ring-wallet/20"
      />
    </div>
  )
}

// A compact dropdown for the filter bar (its label is for screen readers only).
export function FilterSelect({ id, label, value, onChange, children }) {
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

const tagStyles = {
  neutral: 'bg-status-cancelled text-status-cancelled-text',
  transaction: 'bg-status-completed text-status-completed-text',
  account: 'bg-status-flagged text-status-flagged-text',
  security: 'bg-status-pending text-status-pending-text',
  system: 'bg-status-cancelled text-status-cancelled-text',
}

export function Tag({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${tagStyles[tone] ?? tagStyles.neutral}`}>
      {children}
    </span>
  )
}

// `failed`: the data it counts didn't load.
export function StatCard({ label, value, hint, loading, failed }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-divider bg-white p-6">
      <p className="text-xs font-bold tracking-wider text-muted uppercase">{label}</p>
      <p className="font-brand text-[28px] leading-tight font-semibold text-ink tabular-nums">{loading || failed ? '–' : value}</p>
      <p className="text-sm text-muted">{failed ? 'Couldn’t load' : hint}</p>
    </div>
  )
}
