import { scenario } from './scenario'

// One account per customer. Balances are integers in centavos (₱25,000.00 = 2500000).
// accountNumber is 12 digits with no spaces (format it only for display).
// owner is the user's _id.
// status: "active" | "frozen" | "closed"
export const accounts = [
  {
    _id: 'a1',
    accountNumber: '001234567890',
    owner: 'u1',
    balance: 2500000,
    status: 'active',
    createdAt: '2026-09-20T08:00:00.000Z',
    updatedAt: '2026-10-12T11:00:00.000Z',
  },
  {
    _id: 'a2',
    accountNumber: '009876543210',
    owner: 'u4',
    balance: 1000000,
    status: 'active',
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-12T11:00:00.000Z',
  },
  {
    _id: 'a3',
    accountNumber: '001290324471',
    owner: 'u5',
    balance: 800000,
    status: 'active',
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-10-12T11:00:00.000Z',
  },
  {
    _id: 'a4',
    accountNumber: '001277813390',
    owner: 'u6',
    balance: 500000,
    status: 'active',
    createdAt: '2026-09-28T10:00:00.000Z',
    updatedAt: '2026-10-12T11:00:00.000Z',
  },
]

// The logged-in customer (u1) owns accounts[0].
if (scenario === 'frozen') accounts[0].status = 'frozen'
if (scenario === 'new') accounts[0].balance = 0
