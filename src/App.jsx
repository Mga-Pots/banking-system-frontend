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
import ComingSoon from './pages/customer/ComingSoon'
import StaffDashboard from './pages/staff/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'

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
              <Route path="transfer" element={<ComingSoon />} />
              <Route path="history" element={<ComingSoon />} />
              <Route path="settings" element={<ComingSoon />} />
              <Route path="notifications" element={<ComingSoon />} />
              <Route path="*" element={<Navigate to="/customer" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
            <Route path="/staff" element={<StaffLayout />}>
              <Route index element={<StaffDashboard />} />
              <Route path="*" element={<Navigate to="/staff" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              {/* Not built yet: placeholders so the sidebar links work */}
              {['accounts', 'transactions', 'staff', 'audit-log', 'notification-log'].map((path) => (
                <Route key={path} path={path} element={<ComingSoon />} />
              ))}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
