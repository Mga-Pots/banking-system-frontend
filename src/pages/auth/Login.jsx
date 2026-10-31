import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/auth/AuthLayout'
import Seo from '../../components/Seo'
import PasswordInput from '../../components/auth/PasswordInput'
import RequiredMark from '../../components/auth/RequiredMark'
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../../components/auth/styles'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const { login, role } = useAuth()
  const navigate = useNavigate()
  // A message from the page that sent the user here, like after registering or
  // deactivating, and the email to start with (Register passes the new account's).
  const { notice, email: startEmail } = useLocation().state ?? {}
  const [email, setEmail] = useState(startEmail ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (role) return <Navigate to={`/${role}`} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmedEmail = email.trim()
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Enter a valid email address, like juan@email.com.')
      return
    }
    if (!password) {
      setError('Enter your password.')
      return
    }

    setError('')
    setLoading(true)
    try {
      const user = await login({ email: trimmedEmail, password })
      navigate(`/${user.role}`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Save a little, every day."
      subtitle="Send money, cash in, and keep track of every peso, all in one place."
    >
      <Seo title="Log in" path="/login" index />
      <form className="flex w-full max-w-[400px] flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div>
          <h2 className="mb-1.5 text-[30px] font-extrabold tracking-[-0.8px]">Log in to sinop</h2>
          <p className="text-[15px] text-muted">Welcome back! Enter your details to continue.</p>
        </div>

        {notice && (
          <p role="status" className="rounded-xl bg-status-cancelled px-4 py-3 text-sm font-semibold text-status-cancelled-text">
            {notice}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className={labelClass}>
            Email <RequiredMark />
          </label>
          <input
            aria-required="true"
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className={labelClass}>
            Password <RequiredMark />
          </label>
          <PasswordInput
            required
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="-mt-1.5 text-[13px] font-semibold text-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={`${primaryButtonClass} cursor-pointer`}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <div className="flex items-center gap-3 text-[13px] text-muted before:h-px before:flex-1 before:bg-[#e2e6ef] after:h-px after:flex-1 after:bg-[#e2e6ef]">
          or
        </div>

        <Link to="/register" className={secondaryButtonClass}>
          Create an account
        </Link>
      </form>
    </AuthLayout>
  )
}
