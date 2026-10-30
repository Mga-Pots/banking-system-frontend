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

// `switchable={false}` turns the switch off for a whole area (staff pages have no eye
// button: what staff see is decided by their role), so a "hide" saved on the customer
// side can't hide details there with no way to show them again.
export function PrivacyProvider({ switchable = true, children }) {
  const [stored, setHidden] = useState(readStored)
  const hidden = switchable && stored

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
