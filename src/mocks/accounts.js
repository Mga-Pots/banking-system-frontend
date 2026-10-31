import { scenario } from './scenario'

// One account per customer. Balances are integers in centavos (₱25,000.00 = 2500000).
// accountNumber is 12 digits with no spaces (format it only for display).
// owner is the user's _id.
// status: "active" | "frozen" | "closed"
//
// The card is separate from the account number. Account responses carry only
// cardLastFour; the full card details live in `cards` below and are returned only by
// the password-protected card-details call (see src/api/accounts.js).
export const accounts = [
  {
    _id: 'a1',
    accountNumber: '001234567890',
    cardLastFour: '4096',
    owner: 'u1',
    balance: 2500000,
    status: 'active',
    createdAt: '2026-09-20T08:00:00.000Z',
    updatedAt: '2026-10-12T11:00:00.000Z',
  },
  {
    _id: 'a2',
    accountNumber: '009876543210',
    cardLastFour: '5512',
    owner: 'u4',
    balance: 1000000,
    status: 'active',
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-12T11:00:00.000Z',
  },
  {
    _id: 'a3',
    accountNumber: '001290324471',
    cardLastFour: '3347',
    owner: 'u5',
    balance: 800000,
    status: 'active',
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-10-12T11:00:00.000Z',
  },
  {
    _id: 'a4',
    accountNumber: '001277813390',
    cardLastFour: '8820',
    owner: 'u6',
    balance: 500000,
    status: 'active',
    createdAt: '2026-09-28T10:00:00.000Z',
    updatedAt: '2026-10-12T11:00:00.000Z',
  },
]

// Full card details, keyed by account _id. cardNumber is 16 digits with no spaces,
// cardExpiry is "MM/YY". Display only: no real card exists.
export const cards = {
  a1: { cardNumber: '4521883012774096', cardExpiry: '09/31', cardCvc: '482' },
  a2: { cardNumber: '4521883098765512', cardExpiry: '10/31', cardCvc: '195' },
  a3: { cardNumber: '4521883012903347', cardExpiry: '09/31', cardCvc: '731' },
  a4: { cardNumber: '4521883012778820', cardExpiry: '09/31', cardCvc: '264' },
}

// The logged-in customer (u1) owns accounts[0].
if (scenario === 'frozen') accounts[0].status = 'frozen'
if (scenario === 'new') accounts[0].balance = 0
