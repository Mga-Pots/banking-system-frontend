// The title shown at the top of each staff page, in the header's left slot.
// The overview has no entry on purpose: it shows the greeting there instead.
const titles = {
  '/staff/customers': 'Customers',
  '/staff/accounts': 'Accounts',
  '/staff/transactions': 'Transactions',
}

export const titleFor = (pathname) => {
  const path = pathname.replace(/\/$/, '')
  if (/^\/staff\/customers\/[^/]+$/.test(path)) return 'Customer details'
  return titles[path] ?? null
}
