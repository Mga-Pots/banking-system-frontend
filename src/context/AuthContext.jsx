import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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

  // After the user edits their own details: keep the session, swap in the new user.
  const updateUser = useCallback((next) => {
    localStorage.setItem(USER_KEY, JSON.stringify(next))
    setUser(next)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const logout = useCallback(() => {
    // Tell the backend (best effort); the client token is cleared regardless.
    authApi.logout(token).catch(() => {})
    clearSession()
  }, [token, clearSession])

  // On page load, the saved user is only a copy from the last login. Ask the backend
  // for the current one (staff may have verified the customer since, for example),
  // and end the session if the backend no longer accepts the token. If the backend
  // can't be reached, keep the saved copy.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    let stale = false
    authApi
      .getMe()
      .then((res) => {
        if (stale) return
        localStorage.setItem(USER_KEY, JSON.stringify(res.data))
        setUser(res.data)
      })
      .catch((err) => {
        if (stale || !err.response) return
        const status = err.response.status
        if (!status || status === 401 || status === 403) clearSession()
      })
    return () => {
      stale = true
    }
  }, [clearSession])

  const value = useMemo(
    () => ({ user, token, role: user?.role ?? null, login, register, logout, updateUser }),
    [user, token, login, register, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
