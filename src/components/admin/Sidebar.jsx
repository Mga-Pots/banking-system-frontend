import Sidebar from '../Sidebar'
import { BellIcon, ClipboardIcon, GridIcon, UserPlusIcon, UsersIcon } from '../ui/Icons'

// Admin = IT and people only. Bank accounts and transactions are staff pages.
const links = [
  { to: '/admin', label: 'Overview', icon: GridIcon, end: true },
  { to: '/admin/users', label: 'Users', icon: UsersIcon },
  { to: '/admin/create-staff', label: 'Create staff', icon: UserPlusIcon },
  { to: '/admin/audit-log', label: 'Audit log', icon: ClipboardIcon },
  { to: '/admin/notification-log', label: 'Notification log', icon: BellIcon },
]

export default function AdminSidebar({ onNavigate }) {
  return <Sidebar home="/admin" links={links} onNavigate={onNavigate} />
}
