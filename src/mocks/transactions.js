// type: "cash_in" | "transfer". Amounts are integers in centavos.
// cash_in has no fromAccount (simulated funds); transfer has both.
export const transactions = [
  {
    id: 't1',
    type: 'cash_in',
    amount: 1000000,
    status: 'completed',
    fromAccount: null,
    toAccount: '1001-2345-6789',
    description: 'Cash in',
    createdAt: '2026-10-01T09:15:00.000Z',
  },
  {
    id: 't2',
    type: 'transfer',
    amount: 250000,
    status: 'completed',
    fromAccount: '1001-2345-6789',
    toAccount: '1001-9876-5432',
    description: 'Rent share',
    createdAt: '2026-10-05T14:30:00.000Z',
  },
  {
    id: 't3',
    type: 'transfer',
    amount: 50000,
    status: 'pending',
    fromAccount: '1001-2345-6789',
    toAccount: '1001-9876-5432',
    description: 'Lunch',
    createdAt: '2026-10-12T11:00:00.000Z',
  },
]
