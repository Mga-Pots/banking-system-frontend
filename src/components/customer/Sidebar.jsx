import { Link, NavLink } from 'react-router-dom'
import Logo from '../auth/Logo'
import { ArrowRightIcon, GridIcon, ListIcon, PlusIcon } from '../ui/Icons'

const links = [
  { to: '/customer', label: 'Overview', icon: GridIcon, end: true },
  { to: '/customer/cash-in', label: 'Cash in', icon: PlusIcon },
  { to: '/customer/transfer', label: 'Transfer', icon: ArrowRightIcon },
  { to: '/customer/history', label: 'Transaction History', icon: ListIcon },
]

// Logo and main navigation. `onNavigate` runs after a link is pressed (the mobile
// menu uses it to close itself).
export default function Sidebar({ onNavigate }) {
  return (
    <div className="flex min-h-dvh flex-col gap-8 p-4">
      <div>
        <Link
          to="/customer"
          onClick={onNavigate}
          className="flex items-center gap-2.5 self-start px-2 pt-2 font-brand text-[28px] font-bold tracking-[-0.8px] text-ink"
        >
          <Logo size={36} />
          <span>sinop</span>
        </Link>
        <p lang="fil" className="mt-1 pl-[54px] text-xs text-muted">
          masinop sa pera
        </p>
      </div>

      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex h-12 items-center gap-2.5 rounded-xl px-3.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet ${
                    isActive ? 'bg-mint text-ink' : 'text-label hover:bg-ground'
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
