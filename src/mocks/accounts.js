// One account per customer. Balances are integers in centavos (₱25,000.00 = 2500000).
// status: "active" | "frozen" | "closed"
export const accounts = [
  { id: 'a1', userId: 'u1', accountNumber: '1001-2345-6789', balance: 2500000, status: 'active' },
  { id: 'a2', userId: 'u4', accountNumber: '1001-9876-5432', balance: 1000000, status: 'active' },
]
