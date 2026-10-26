// The title shown at the top of each admin page, in the header's left slot.
// The overview has no entry on purpose: it shows the greeting there instead.
const titles = {
  '/admin/users': 'Users',
  '/admin/accounts': 'Accounts',
  '/admin/transactions': 'Transactions',
  '/admin/staff': 'Staff',
  '/admin/audit-log': 'Audit log',
  '/admin/notification-log': 'Notification log',
}

export const titleFor = (pathname) => titles[pathname.replace(/\/$/, '')] ?? null
