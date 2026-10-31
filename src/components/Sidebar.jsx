import { Link, NavLink } from 'react-router-dom'
import Logo from './auth/Logo'

// The sidebar every role shares: the logo, then the role's navigation. Each role's
// links live in its own folder (customer/Sidebar.jsx, staff/…, admin/…).
// `home` is where the logo goes. `links` are { to, label, icon, end }, where `end`
// marks the overview link so it's only active on its exact path.
// `onNavigate` runs after a link is pressed (the mobile menu uses it to close itself).
export default function Sidebar({ home, links, onNavigate }) {
  return (
    <div className="flex min-h-dvh flex-col gap-8 px-4 pb-4">
      {/* As tall as the page's top bar (64px), so the logo sits level with the avatar */}
      <div className="flex h-16 items-center">
        <Link
          to={home}
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-2 font-brand text-[28px] font-bold tracking-[-0.8px] text-ink"
        >
          <Logo size={36} />
          <span>sinop</span>
        </Link>
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
