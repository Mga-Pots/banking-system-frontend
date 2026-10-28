import { Link, NavLink } from 'react-router-dom'
import Logo from '../auth/Logo'
import { CardIcon, GridIcon, ListIcon, UsersIcon } from '../ui/Icons'

// Same look as the admin and customer sidebars. Staff only get the banking tools:
// no admin pages (staff accounts, audit log, notification log).
const links = [
  { to: '/staff', label: 'Overview', icon: GridIcon, end: true },
  { to: '/staff/customers', label: 'Customers', icon: UsersIcon },
  { to: '/staff/accounts', label: 'Accounts', icon: CardIcon },
  { to: '/staff/transactions', label: 'Transactions', icon: ListIcon },
]

// `onNavigate` runs after a link is pressed (the mobile menu uses it to close itself).
export default function StaffSidebar({ onNavigate }) {
  return (
    <div className="flex min-h-dvh flex-col gap-8 p-4">
      <div>
        <Link
          to="/staff"
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
