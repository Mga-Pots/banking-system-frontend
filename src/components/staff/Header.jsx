import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useMatch, useNavigate } from 'react-router-dom'
import { ChevronDownIcon, LogOutIcon, UserIcon } from '../ui/Icons'
import { useAuth } from '../../context/AuthContext'
import { initialsOf } from '../../utils/names'
import { titleFor } from './pageTitles'

const greetingFor = (hour) =>
  hour < 12 ? 'Magandang umaga' : hour < 18 ? 'Magandang hapon' : 'Magandang gabi'

// Top of every staff page, built like the admin header: greeting (or page title)
// on the left, the account menu on the right. No "hide details" eye button: in a
// bank's staff tools, what staff see is decided by their role, not a switch.
export default function StaffHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const onOverview = Boolean(useMatch('/staff'))
  const title = titleFor(pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

  // Close the account menu on Esc or a click outside it.
  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        triggerRef.current?.focus()
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
    <header className="mb-6 flex items-center justify-between gap-4">
      <div className="flex min-h-[58px] min-w-0 flex-col justify-end">
        {onOverview ? (
          <p>
            <span lang="fil" className="block text-[15px] text-label">
              {greetingFor(new Date().getHours())},
            </span>
            <span className="block truncate text-[28px] leading-tight font-bold text-ink">{user?.name}</span>
          </p>
        ) : (
          title && <h1 className="truncate text-[28px] leading-tight font-bold text-ink">{title}</h1>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label="Account menu"
            ref={triggerRef}
            className="relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-divider bg-mint text-sm font-bold text-ink transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
          >
            {initialsOf(user?.name)}
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
              <div className="border-b border-divider py-1">
                <Link
                  to="/staff/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-ground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-wallet"
                >
                  <UserIcon size={18} className="shrink-0 text-ink" />
                  <span className="text-sm font-semibold text-text">Profile</span>
                </Link>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-ground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-wallet"
                >
                  <LogOutIcon size={18} className="shrink-0 text-ink" />
                  <span className="text-sm font-semibold text-text">Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
