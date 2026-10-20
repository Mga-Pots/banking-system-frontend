// actor is the user _id who did the action.
// targetType: "User" | "BankAccount" | "Transaction"
export const auditLogs = [
  {
    _id: 'l1',
    actor: 'u3',
    action: 'user.verify',
    targetType: 'User',
    targetId: 'u1',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    _id: 'l2',
    actor: 'u2',
    action: 'transaction.status_update',
    targetType: 'Transaction',
    targetId: 't3',
    createdAt: '2026-10-12T11:05:00.000Z',
  },
]
