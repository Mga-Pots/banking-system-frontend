import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon, LockIcon, ShieldIcon, SnowIcon, UsersIcon } from '../ui/Icons'

const item =
  'flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-ground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-wallet'

// "Manage" button with a small menu: change role, disable / turn back on, close permanently.
// `onPick(action)` gets "role" | "disable" | "enable" | "close".
export default function ManageMenu({ user, onPick }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null) // where the menu floats, so a scrolling table can't cut it off
  const ref = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    const onMove = () => setOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open])

  const pick = (action) => {
    setOpen(false)
    onPick(action)
  }

  const disabled = user.status === 'disabled'

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          const r = triggerRef.current.getBoundingClientRect()
          // Open below the button, or above it when there isn't room
          const below = window.innerHeight - r.bottom > 260
          setPos({
            right: window.innerWidth - r.right,
            ...(below ? { top: r.bottom + 8 } : { bottom: window.innerHeight - r.top + 8 }),
          })
          setOpen((o) => !o)
        }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Manage ${user.name}`}
        className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-field-line bg-white pr-4 pl-5 text-sm font-bold text-ink transition hover:bg-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
      >
        Manage
        <ChevronDownIcon size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && (
        <div style={pos} className="fixed z-30 w-72 rounded-2xl bg-white p-2 text-left shadow-xl ring-1 ring-divider">
          <button type="button" className={item} onClick={() => pick('role')}>
            <UsersIcon size={18} className="mt-0.5 shrink-0 text-ink" />
            <span>
              <span className="block text-sm font-semibold text-text">Change role</span>
              <span className="block text-xs text-muted">Customer, staff, or admin</span>
            </span>
          </button>
          <button type="button" className={item} onClick={() => pick(disabled ? 'enable' : 'disable')}>
            {disabled ? (
              <ShieldIcon size={18} className="mt-0.5 shrink-0 text-ink" />
            ) : (
              <LockIcon size={18} className="mt-0.5 shrink-0 text-ink" />
            )}
            <span>
              <span className="block text-sm font-semibold text-text">
                {disabled ? 'Turn account back on' : 'Disable account'}
              </span>
              <span className="block text-xs text-muted">
                {disabled ? 'They can log in again' : 'They can’t log in until you turn it back on'}
              </span>
            </span>
          </button>
          <div className="my-1 border-t border-divider" />
          <button type="button" className={item} onClick={() => pick('close')}>
            <SnowIcon size={18} className="mt-0.5 shrink-0 text-error" />
            <span>
              <span className="block text-sm font-semibold text-error">Close permanently</span>
              <span className="block text-xs text-muted">Can’t be undone. Records are kept.</span>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
