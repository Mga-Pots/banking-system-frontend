// recipient is the user's _id.
// type: "transaction" | "account" | "security" | "system"
// relatedTransaction is the transaction _id, when there is one.
export const notifications = [
  {
    _id: 'n1',
    recipient: 'u1',
    type: 'transaction',
    message: 'Your cash in of ₱10,000.00 was successful.',
    relatedTransaction: 't1',
    isRead: true,
    createdAt: '2026-10-01T09:15:00.000Z',
  },
  {
    _id: 'n2',
    recipient: 'u1',
    type: 'transaction',
    message: 'Your transfer of ₱2,500.00 to 0098 7654 3210 was completed.',
    relatedTransaction: 't2',
    isRead: false,
    createdAt: '2026-10-05T14:30:00.000Z',
  },
  {
    _id: 'n3',
    recipient: 'u1',
    type: 'transaction',
    message: 'Your transfer of ₱500.00 to 0098 7654 3210 is being held for review.',
    relatedTransaction: 't3',
    isRead: false,
    createdAt: '2026-10-12T11:00:00.000Z',
  },
]
