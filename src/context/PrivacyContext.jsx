import { createContext, useCallback, useContext, useMemo, useState } from 'react'

// "Hide balance and account details": one switch that every <Sensitive> value follows.
const STORAGE_KEY = 'sinop.hideDetails'

const PrivacyContext = createContext(null)

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function PrivacyProvider({ children }) {
  const [hidden, setHidden] = useState(readStored)

  const toggle = useCallback(() => {
    const next = !hidden
    setHidden(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // Storage can be blocked (private window); the switch still works for this visit.
    }
  }, [hidden])

  const value = useMemo(() => ({ hidden, toggle }), [hidden, toggle])
  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePrivacy = () => {
  const ctx = useContext(PrivacyContext)
  if (!ctx) throw new Error('usePrivacy must be used inside <PrivacyProvider>')
  return ctx
}
