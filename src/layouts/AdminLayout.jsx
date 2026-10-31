import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AccountMenu from '../components/AccountMenu'
import Header from '../components/Header'
import PageTitle from '../components/PageTitle'
import Modal from '../components/ui/Modal'
import { ToastProvider } from '../components/ui/Toast'
import AdminSidebar from '../components/admin/Sidebar'
import { titleFor } from '../components/admin/pageTitles'
import { PrivacyProvider } from '../context/PrivacyContext'

// Admin shell, the same as the staff one: sidebar on the left (a menu button on
// small screens), the slim top bar with the account menu pinned above the page, and the
// page below, starting with its title.
export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const actions = <AccountMenu />

  return (
    <PrivacyProvider>
      <ToastProvider>
        <div className="min-h-dvh bg-canvas text-text md:grid md:grid-cols-[232px_1fr]">
          <aside aria-label="Sidebar" className="sticky top-0 hidden h-dvh border-r border-divider bg-white md:block">
            <AdminSidebar />
          </aside>

          <div className="min-w-0">
            <Header home="/admin" onOpenMenu={() => setMenuOpen(true)} actions={actions} />
            <main className="px-4 py-6 sm:px-6 lg:px-8">
              <PageTitle home="/admin" titleFor={titleFor} />
              <Outlet />
            </main>
          </div>
        </div>

        {menuOpen && (
          <Modal title="Menu" hideTitle placement="left" flush onClose={() => setMenuOpen(false)}>
            <AdminSidebar onNavigate={() => setMenuOpen(false)} />
          </Modal>
        )}
      </ToastProvider>
    </PrivacyProvider>
  )
}
