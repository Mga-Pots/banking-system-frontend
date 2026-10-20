// transactionType: "cash_in" | "transfer". Amounts are integers in centavos.
// sourceAccount and destinationAccount are account _ids.
// cash_in has no sourceAccount (simulated funds); transfer has both.
// performedBy is the user _id. flagReason is null unless the transaction is flagged.
// status: "pending" | "completed" | "failed" | "cancelled" | "flagged"
export const transactions = [
  {
    _id: 't1',
    referenceNumber: 'TXN-20261001-0915',
    transactionType: 'cash_in',
    amount: 1000000,
    sourceAccount: null,
    destinationAccount: 'a1',
    performedBy: 'u1',
    status: 'completed',
    flagReason: null,
    createdAt: '2026-10-01T09:15:00.000Z',
    updatedAt: '2026-10-01T09:15:00.000Z',
  },
  {
    _id: 't2',
    referenceNumber: 'TXN-20261005-1430',
    transactionType: 'transfer',
    amount: 250000,
    sourceAccount: 'a1',
    destinationAccount: 'a2',
    performedBy: 'u1',
    status: 'completed',
    flagReason: null,
    createdAt: '2026-10-05T14:30:00.000Z',
    updatedAt: '2026-10-05T14:30:00.000Z',
  },
  {
    _id: 't3',
    referenceNumber: 'TXN-20261012-1100',
    transactionType: 'transfer',
    amount: 50000,
    sourceAccount: 'a1',
    destinationAccount: 'a2',
    performedBy: 'u1',
    status: 'pending',
    flagReason: null,
    createdAt: '2026-10-12T11:00:00.000Z',
    updatedAt: '2026-10-12T11:00:00.000Z',
  },
]
