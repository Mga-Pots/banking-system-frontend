import Sidebar from '../Sidebar'
import { ArrowRightIcon, GridIcon, ListIcon, PlusIcon } from '../ui/Icons'

const links = [
  { to: '/customer', label: 'Overview', icon: GridIcon, end: true },
  { to: '/customer/cash-in', label: 'Cash in', icon: PlusIcon },
  { to: '/customer/transfer', label: 'Transfer', icon: ArrowRightIcon },
  { to: '/customer/history', label: 'Transaction History', icon: ListIcon },
]

export default function CustomerSidebar({ onNavigate }) {
  return <Sidebar home="/customer" links={links} onNavigate={onNavigate} />
}
