import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ title }) {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav>
      <strong>{title}</strong>{' '}
      <span>
        {user?.name} ({role})
      </span>{' '}
      <button onClick={handleLogout}>Logout</button>
    </nav>
  )
}
