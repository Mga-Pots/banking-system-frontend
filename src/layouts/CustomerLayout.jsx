import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import Logo from '../components/auth/Logo'
import Modal from '../components/ui/Modal'
import { MenuIcon } from '../components/ui/Icons'
import { ToastProvider } from '../components/ui/Toast'
import Header from '../components/customer/Header'
import Sidebar from '../components/customer/Sidebar'
import { NotificationsProvider } from '../context/NotificationsContext'
import { PrivacyProvider } from '../context/PrivacyContext'

// Customer shell: sidebar on the left (a menu button on small screens), the
// header on top, and the page below.
export default function CustomerLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <PrivacyProvider>
      <ToastProvider>
        <NotificationsProvider>
        <div className="min-h-dvh bg-canvas text-text md:grid md:grid-cols-[232px_1fr]">
          <aside aria-label="Sidebar" className="sticky top-0 hidden h-dvh border-r border-divider bg-white md:block">
            <Sidebar />
          </aside>

          <div className="min-w-0">
            <div className="flex items-center gap-3 border-b border-divider bg-white px-4 py-3 md:hidden">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                className="flex size-11 cursor-pointer items-center justify-center rounded-full text-ink transition hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
              >
                <MenuIcon size={22} />
              </button>
              <Link to="/customer" className="-my-2 flex items-center gap-2 py-2 font-brand text-2xl font-bold text-ink">
                <Logo size={32} />
                <span>sinop</span>
              </Link>
            </div>

            <main className="px-4 py-6 sm:px-6 lg:px-8">
              <Header />
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
