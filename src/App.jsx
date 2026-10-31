import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import CustomerLayout from './layouts/CustomerLayout'
import StaffLayout from './layouts/StaffLayout'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import CustomerDashboard from './pages/customer/Dashboard'
import CashIn from './pages/customer/CashIn'
import Transfer from './pages/customer/Transfer'
import History from './pages/customer/History'
import Notifications from './pages/customer/Notifications'
import Settings from './pages/customer/Settings'
import StaffDashboard from './pages/staff/Dashboard'
import StaffCustomers from './pages/staff/Customers'
import StaffCustomerDetail from './pages/staff/CustomerDetail'
import StaffAccounts from './pages/staff/Accounts'
import StaffTransactions from './pages/staff/Transactions'
import StaffSettings from './pages/staff/Settings'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminCreateStaff from './pages/admin/CreateStaff'
import AdminAuditLog from './pages/admin/AuditLog'
import AdminNotificationLog from './pages/admin/NotificationLog'
import AdminSettings from './pages/admin/Settings'

function Home() {
  const { role } = useAuth()
  return <Navigate to={role ? `/${role}` : '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route path="/customer" element={<CustomerLayout />}>
              <Route index element={<CustomerDashboard />} />
              <Route path="cash-in" element={<CashIn />} />
              <Route path="transfer" element={<Transfer />} />
              <Route path="history" element={<History />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="*" element={<Navigate to="/customer" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
            <Route path="/staff" element={<StaffLayout />}>
              <Route index element={<StaffDashboard />} />
              <Route path="customers" element={<StaffCustomers />} />
              <Route path="customers/:id" element={<StaffCustomerDetail />} />
              <Route path="accounts" element={<StaffAccounts />} />
              <Route path="transactions" element={<StaffTransactions />} />
              <Route path="settings" element={<StaffSettings />} />
              <Route path="*" element={<Navigate to="/staff" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="create-staff" element={<AdminCreateStaff />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
              <Route path="notification-log" element={<AdminNotificationLog />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
