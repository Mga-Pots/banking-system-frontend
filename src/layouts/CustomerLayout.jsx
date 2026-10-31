import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import PageTitle from '../components/PageTitle'
import Modal from '../components/ui/Modal'
import { ToastProvider } from '../components/ui/Toast'
import CustomerHeaderActions from '../components/customer/HeaderActions'
import Sidebar from '../components/customer/Sidebar'
import { titleFor } from '../components/customer/pageTitles'
import { NotificationsProvider } from '../context/NotificationsContext'
import { PrivacyProvider } from '../context/PrivacyContext'

// Customer shell: sidebar on the left (a menu button on small screens), the slim top bar
// with the notification bell and account menu pinned above the page, and the page below,
// starting with its title.
export default function CustomerLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const actions = <CustomerHeaderActions />

  return (
    <PrivacyProvider>
      <ToastProvider>
        <NotificationsProvider>
          <div className="min-h-dvh bg-canvas text-text md:grid md:grid-cols-[232px_1fr]">
            <aside aria-label="Sidebar" className="sticky top-0 hidden h-dvh border-r border-divider bg-white md:block">
              <Sidebar />
            </aside>

            <div className="min-w-0">
              <Header home="/customer" onOpenMenu={() => setMenuOpen(true)} actions={actions} />
              <main className="px-4 py-6 sm:px-6 lg:px-8">
                <PageTitle home="/customer" titleFor={titleFor} firstNameOnly />
                <Outlet />
              </main>
            </div>
          </div>

          {menuOpen && (
            <Modal title="Menu" hideTitle placement="left" flush onClose={() => setMenuOpen(false)}>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </Modal>
          )}
        </NotificationsProvider>
      </ToastProvider>
    </PrivacyProvider>
  )
}
