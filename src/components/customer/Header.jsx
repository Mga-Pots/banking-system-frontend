import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useMatch, useNavigate } from 'react-router-dom'
import { BellIcon, ChevronDownIcon, LogOutIcon, UserIcon } from '../ui/Icons'
import { useAuth } from '../../context/AuthContext'
import { getMyNotifications } from '../../api/notifications'
import { firstNameOf, initialsOf } from '../../utils/names'
import { titleFor } from './pageTitles'

// The bell and avatar are round, like every other button in the app.
const circleBase =
  'relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-divider text-ink transition'
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet'

const menuItem =
  'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-ground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-wallet'

const greetingFor = (hour) =>
  hour < 12 ? 'Magandang umaga' : hour < 18 ? 'Magandang hapon' : 'Magandang gabi'

// Top of every customer page: greeting on the left; notifications and the account
// menu on the right. The avatar is the one way into profile and settings.
export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const onOverview = Boolean(useMatch('/customer')) // the greeting belongs to the overview only
  const title = titleFor(pathname)
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

  // Count unread notifications for the bell, and refresh when the page changes.
  useEffect(() => {
    let active = true
    getMyNotifications()
      .then((res) => active && setUnread(res.data.filter((n) => !n.isRead).length))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [pathname])

  // Close the account menu on Esc or a click outside it.
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
    <header className="mb-6 flex items-center justify-between gap-4">
      {/* Left slot: the greeting on the overview, the page title everywhere else. The
          minimum height keeps the big line at the same place on every page. */}
      <div className="flex min-h-[58px] min-w-0 flex-col justify-end">
        {onOverview ? (
          <p>
            <span lang="fil" className="block text-[15px] text-label">
              {greetingFor(new Date().getHours())},
            </span>
            <span className="block truncate text-[28px] leading-tight font-bold text-ink">
              {firstNameOf(user?.name)}
            </span>
          </p>
        ) : (
          title && <h1 className="truncate text-[28px] leading-tight font-bold text-ink">{title}</h1>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Link
          to="/customer/notifications"
          className={`${circleBase} ${focusRing} bg-white hover:bg-mint`}
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <BellIcon size={20} />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-wallet px-1 text-[11px] font-bold text-white"
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label="Account menu"
            ref={triggerRef}
            className={`${circleBase} ${focusRing} bg-mint text-sm font-bold hover:brightness-95`}
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
                <Link to="/customer/settings" onClick={() => setMenuOpen(false)} className={menuItem}>
                  <UserIcon size={18} className="shrink-0 text-ink" />
                  <span>
                    <span className="block text-sm font-semibold text-text">Profile &amp; settings</span>
                    <span className="block text-xs text-muted">Details, password, notifications</span>
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
      </div>
    </header>
  )
}
