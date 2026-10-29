import { ago } from './time'

// actor is the user _id who did the action.
// targetType: "User" | "BankAccount" | "Transaction"
// action: staff.create | user.status_update | user.verify |
//         account.status_update | transaction.status_update
// Dates are relative to now (see ./time.js).
export const auditLogs = [
  { _id: 'l1', actor: 'u2', action: 'user.verify', targetType: 'User', targetId: 'u1', createdAt: '2026-10-01T08:00:00.000Z' },
  { _id: 'l2', actor: 'u2', action: 'transaction.status_update', targetType: 'Transaction', targetId: 't3', createdAt: ago({ h: 5 }) },
  { _id: 'l3', actor: 'u2', action: 'account.status_update', targetType: 'BankAccount', targetId: 'a4', createdAt: ago({ h: 3 }) },
  { _id: 'l4', actor: 'u2', action: 'user.verify', targetType: 'User', targetId: 'u5', createdAt: ago({ h: 1, m: 20 }) },
  { _id: 'l6', actor: 'u3', action: 'staff.create', targetType: 'User', targetId: 'u2', createdAt: '2026-09-15T08:00:00.000Z' },
]
