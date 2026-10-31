// Mock dates are relative to now, so the dashboard always has recent data.
// ago({ d: 2, h: 3 }) is two days and three hours ago.
export const ago = ({ d = 0, h = 0, m = 0 }) =>
  new Date(Date.now() - ((d * 24 + h) * 60 + m) * 60000).toISOString()

// Reference numbers look like TXN-20261016-0412 (date + 4 digits).
export const referenceFor = (iso, suffix) => `TXN-${iso.slice(0, 10).replace(/-/g, '')}-${suffix}`
