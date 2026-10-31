import { Link } from 'react-router-dom'
import Logo from './auth/Logo'
import { MenuIcon } from './ui/Icons'

// The slim bar across the top of every page, for customers, staff and admins. It stays
// pinned while the page scrolls under it, so it's kept low (64px) and holds only the
// account `actions` (the avatar menu, and the bell for customers) on the right. The page
// title is not in here: it belongs to the page and scrolls with it (see PageTitle).
//
// On phones, where the sidebar is hidden, the left side has the menu button and the logo.
// The sidebar's logo row is the same 64px, so on larger screens the logo and the avatar
// sit level.
export default function Header({ home, onOpenMenu, actions }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-divider bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 md:hidden">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="flex size-11 cursor-pointer items-center justify-center rounded-full text-ink transition hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
        >
          <MenuIcon size={22} />
        </button>
        <Link to={home} className="-my-2 flex items-center gap-2 py-2 font-brand text-2xl font-bold text-ink">
          <Logo size={32} />
          <span>sinop</span>
        </Link>
      </div>

      <div className="ml-auto">{actions}</div>
    </header>
  )
}
