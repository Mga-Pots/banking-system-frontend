// Dev switch for trying the customer dashboard in different states (mock mode only).
// Open any page with ?scenario=frozen or ?scenario=new. It is remembered for the
// browser tab; ?scenario=default turns it off again.
//   frozen: the customer's account is frozen
//   new:    a brand-new customer with no balance, transactions or notifications
//   error:  the notifications calls fail (everything else works)
const KEY = 'sinop.mockScenario'
const KNOWN = ['frozen', 'new', 'error']

const readScenario = () => {
  try {
    const param = new URLSearchParams(window.location.search).get('scenario')
    if (param) {
      if (KNOWN.includes(param)) sessionStorage.setItem(KEY, param)
      else sessionStorage.removeItem(KEY)
    }
    const saved = sessionStorage.getItem(KEY)
    return KNOWN.includes(saved) ? saved : null
  } catch {
    return null
  }
}

export const scenario = typeof window === 'undefined' ? null : readScenario()
