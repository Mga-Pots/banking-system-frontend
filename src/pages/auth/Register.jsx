import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const { register, role } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', contactNumber: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (role) return <Navigate to={`/${role}`} replace />

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await register(form)
      navigate(`/${user.role}`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Name <input value={form.name} onChange={update('name')} required />
          </label>
        </div>
        <div>
          <label>
            Email <input type="email" value={form.email} onChange={update('email')} required />
          </label>
        </div>
        <div>
          <label>
            Contact number <input value={form.contactNumber} onChange={update('contactNumber')} required />
          </label>
        </div>
        <div>
          <label>
            Password <input type="password" value={form.password} onChange={update('password')} required />
          </label>
        </div>
        {error && <p>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}
