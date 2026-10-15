import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Requires a logged-in user whose role is in `allowedRoles`.
// Wrong role -> sent to their own dashboard; logged out -> /login.
export default function ProtectedRoute({ allowedRoles }) {
  const { token, role } = useAuth()
  const location = useLocation()

  if (!token || !role) return <Navigate to="/login" state={{ from: location }} replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to={`/${role}`} replace />

  return <Outlet />
}
