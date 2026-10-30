import { Link, NavLink } from 'react-router-dom'
import Logo from '../auth/Logo'
import { BellIcon, ClipboardIcon, GridIcon, UserPlusIcon, UsersIcon } from '../ui/Icons'

// Admin = IT and people only. Bank accounts and transactions are staff pages.
const groups = [
  {
    links: [
      { to: '/admin', label: 'Overview', icon: GridIcon, end: true },
      { to: '/admin/users', label: 'Users', icon: UsersIcon },
      { to: '/admin/create-staff', label: 'Create staff', icon: UserPlusIcon },
      { to: '/admin/audit-log', label: 'Audit log', icon: ClipboardIcon },
      { to: '/admin/notification-log', label: 'Notification log', icon: BellIcon },
    ],
  },
]

// `onNavigate` runs after a link is pressed (the mobile menu uses it to close itself).
export default function AdminSidebar({ onNavigate }) {
  return (
    <div className="flex min-h-dvh flex-col gap-8 p-4">
      <div>
        <Link
          to="/admin"
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

      <nav aria-label="Main" className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.title ?? 'main'}>
            {group.title && (
              <p className="px-3.5 pb-1 text-xs font-bold tracking-wider text-muted uppercase">{group.title}</p>
            )}
            <ul className="flex flex-col gap-1">
              {group.links.map(({ to, label, icon: Icon, end }) => (
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
          </div>
        ))}
      </nav>
    </div>
  )
}
