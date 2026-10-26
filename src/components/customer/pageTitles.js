// The title shown at the top of each customer page, in the header's left slot.
// The overview has no entry on purpose: it shows the greeting there instead.
const titles = {
  '/customer/cash-in': 'Cash in',
  '/customer/transfer': 'Transfer',
  '/customer/history': 'Transaction History',
  '/customer/settings': 'Profile & settings',
  '/customer/notifications': 'Notifications',
}

export const titleFor = (pathname) => titles[pathname.replace(/\/$/, '')] ?? null
