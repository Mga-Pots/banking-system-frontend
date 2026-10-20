// One account per customer. Balances are integers in centavos (₱25,000.00 = 2500000).
// owner is the user's _id.
// status: "active" | "frozen" | "closed"
export const accounts = [
  {
    _id: 'a1',
    accountNumber: '1001-2345-6789',
    owner: 'u1',
    balance: 2500000,
    status: 'active',
    createdAt: '2026-09-20T08:00:00.000Z',
    updatedAt: '2026-10-12T11:00:00.000Z',
  },
  {
    _id: 'a2',
    accountNumber: '1001-9876-5432',
    owner: 'u4',
    balance: 1000000,
    status: 'active',
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-12T11:00:00.000Z',
  },
]
