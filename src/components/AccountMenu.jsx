import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDownIcon, LogOutIcon, UserIcon } from './ui/Icons'
import { circleButton } from './ui/circleButton'
import { useAuth } from '../context/AuthContext'
import { initialsOf } from '../utils/names'

const menuItem =
  'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-ground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-wallet'

// The avatar with its menu, the same for every role: who you are, a way into your
// profile (`/<role>/settings`), and Log out. `profileLabel` and `profileHint` word the
// profile entry (customers have more on that page than staff and admins do).
export default function AccountMenu({ profileLabel = 'Profile', profileHint }) {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

  // Close the menu on Esc or a click outside it.
  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        triggerRef.current?.focus() // keep keyboard users where they were
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-haspopup="true"
        aria-label="Account menu"
        ref={triggerRef}
        className={`${circleButton} bg-mint text-sm font-bold hover:brightness-95`}
      >
        {initialsOf(user?.name)}
        {/* A small round arrow on the avatar's corner hints that it opens a menu */}
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-ink text-white ring-2 ring-canvas"
        >
          <ChevronDownIcon size={10} className={`transition ${menuOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-divider">
          <div className="flex items-center gap-3 border-b border-divider px-3 pt-2 pb-4">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-ink"
            >
              {initialsOf(user?.name)}
            </span>
            <p className="min-w-0 text-sm font-bold text-text">
              <span className="block truncate">{user?.name}</span>
              <span className="block truncate font-normal text-muted">{user?.email}</span>
            </p>
          </div>

          <div className="py-1">
            <Link to={`/${role}/settings`} onClick={() => setMenuOpen(false)} className={menuItem}>
              <UserIcon size={18} className="shrink-0 text-ink" />
              <span>
                <span className="block text-sm font-semibold text-text">{profileLabel}</span>
                {profileHint && <span className="block text-xs text-muted">{profileHint}</span>}
              </span>
            </Link>
          </div>

          <div className="border-t border-divider pt-1">
            <button type="button" onClick={handleLogout} className={menuItem}>
              <LogOutIcon size={18} className="shrink-0 text-ink" />
              <span className="text-sm font-semibold text-text">Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
