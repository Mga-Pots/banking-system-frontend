import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import * as authApi from '../api/auth'
import { TOKEN_KEY } from '../api/axios'

const USER_KEY = 'user'

const AuthContext = createContext(null)

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)

  const persist = useCallback(({ user, token }) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setToken(token)
    setUser(user)
    return user
  }, [])

  // Both resolve to the logged-in user so callers can redirect by role.
  const login = useCallback(
    async (credentials) => persist((await authApi.login(credentials)).data),
    [persist],
  )

  const register = useCallback(
    async (details) => persist((await authApi.register(details)).data),
    [persist],
  )

  const logout = useCallback(() => {
    // Tell the backend (best effort); the client token is cleared regardless.
    authApi.logout(token).catch(() => {})
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [token])

  const value = useMemo(
    () => ({ user, token, role: user?.role ?? null, login, register, logout }),
    [user, token, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
