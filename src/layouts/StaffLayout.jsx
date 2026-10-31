import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AccountMenu from '../components/AccountMenu'
import Header from '../components/Header'
import PageTitle from '../components/PageTitle'
import Modal from '../components/ui/Modal'
import { ToastProvider } from '../components/ui/Toast'
import StaffSidebar from '../components/staff/Sidebar'
import { titleFor } from '../components/staff/pageTitles'
import { PrivacyProvider } from '../context/PrivacyContext'

// Staff shell, the same as the admin one: sidebar on the left (a menu button on
// small screens), the slim top bar with the account menu pinned above the page, and the
// page below, starting with its title.
export default function StaffLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const actions = <AccountMenu />

  return (
    <PrivacyProvider switchable={false}>
      <ToastProvider>
        <div className="min-h-dvh bg-canvas text-text md:grid md:grid-cols-[232px_1fr]">
          <aside aria-label="Sidebar" className="sticky top-0 hidden h-dvh border-r border-divider bg-white md:block">
            <StaffSidebar />
          </aside>

          <div className="min-w-0">
            <Header home="/staff" onOpenMenu={() => setMenuOpen(true)} actions={actions} />
            <main className="px-4 py-6 sm:px-6 lg:px-8">
              <PageTitle home="/staff" titleFor={titleFor} />
              <Outlet />
            </main>
          </div>
        </div>

        {menuOpen && (
          <Modal title="Menu" hideTitle placement="left" flush onClose={() => setMenuOpen(false)}>
            <StaffSidebar onNavigate={() => setMenuOpen(false)} />
          </Modal>
        )}
      </ToastProvider>
    </PrivacyProvider>
  )
}
