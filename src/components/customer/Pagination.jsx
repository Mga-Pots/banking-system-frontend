import { ChevronLeftIcon, ChevronRightIcon } from '../ui/Icons'

// Page numbers to show: the first, the last, and the current page with one
// neighbour each side. A gap becomes "ellipsis" (a string, so it can't be pressed).
const pageItems = (page, totalPages) => {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1])
  const pages = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  const items = []
  pages.forEach((n, i) => {
    if (i > 0 && n - pages[i - 1] > 1) items.push(`ellipsis-${n}`)
    items.push(n)
  })
  return items
}

function ArrowButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-field-line bg-white text-ink transition hover:bg-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
    >
      {children}
    </button>
  )
}

// Arrow buttons either side of the numbered pages, all in one group. On small
// screens the numbers give way to "Page 2 of 5" so everything fits at 360px.
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <ArrowButton label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeftIcon size={18} />
      </ArrowButton>

      <p className="px-3 text-sm text-muted sm:hidden">
        Page {page} of {totalPages}
      </p>
      <ul className="mx-1 hidden items-center gap-1 sm:flex">
        {pageItems(page, totalPages).map((item) =>
          typeof item === 'string' ? (
            <li key={item} aria-hidden="true" className="w-6 text-center text-muted">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={`flex size-11 cursor-pointer items-center justify-center rounded-full text-sm tabular-nums transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet ${
                  item === page ? 'font-bold text-ink' : 'font-medium text-ink/60 hover:text-ink'
                }`}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>

      <ArrowButton label="Next page" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRightIcon size={18} />
      </ArrowButton>
    </nav>
  )
}
