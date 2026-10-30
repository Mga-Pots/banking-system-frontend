import Sidebar from '../Sidebar'
import { CardIcon, GridIcon, ListIcon, UsersIcon } from '../ui/Icons'

// Staff only get the banking tools: no admin pages (staff accounts, audit log,
// notification log).
const links = [
  { to: '/staff', label: 'Overview', icon: GridIcon, end: true },
  { to: '/staff/customers', label: 'Customers', icon: UsersIcon },
  { to: '/staff/accounts', label: 'Accounts', icon: CardIcon },
  { to: '/staff/transactions', label: 'Transactions', icon: ListIcon },
]

export default function StaffSidebar({ onNavigate }) {
  return <Sidebar home="/staff" links={links} onNavigate={onNavigate} />
}
