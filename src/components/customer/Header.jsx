import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BellIcon, GearIcon } from '../ui/Icons'
import { useAuth } from '../../context/AuthContext'
import { getMyNotifications } from '../../api/notifications'
import { firstNameOf, initialsOf } from '../../utils/names'

const circleBase =
  'relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-divider text-ink transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet'

const greetingFor = (hour) =>
  hour < 12 ? 'Magandang umaga' : hour < 18 ? 'Magandang hapon' : 'Magandang gabi'

// Top of every customer page: greeting on the left; notifications, profile menu
// and settings on the right.
export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
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

  // Close the profile menu on Esc or a click outside it.
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
      <p className="min-w-0">
        <span lang="fil" className="block text-[15px] text-label">
          {greetingFor(new Date().getHours())},
        </span>
        <span className="block truncate text-[28px] leading-tight font-bold text-ink">
          {firstNameOf(user?.name)}
        </span>
      </p>

      <div className="flex items-center gap-3">
        <Link
          to="/customer/notifications"
          className={`${circleBase} bg-white hover:bg-mint`}
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
            className={`${circleBase} bg-mint text-sm font-bold hover:brightness-95`}
          >
            {initialsOf(user?.name)}
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-60 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-divider">
              <p className="px-3 py-2 text-sm font-bold text-text">
                {user?.name}
                <span className="block truncate font-normal text-muted">{user?.email}</span>
              </p>
              <Link
                to="/customer/settings"
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-semibold text-text hover:bg-ground"
              >
                Profile &amp; settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full cursor-pointer rounded-xl px-3 py-3 text-left text-sm font-semibold text-text hover:bg-ground"
              >
                Log out
              </button>
            </div>
          )}
        </div>

        <Link to="/customer/settings" className={`${circleBase} bg-white hover:bg-mint`} aria-label="Settings">
          <GearIcon size={20} />
        </Link>
      </div>
    </header>
  )
}
