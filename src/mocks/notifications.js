import { ago } from './time'
import { scenario } from './scenario'

// Same fields as the backend's Notification model. recipient is the user's _id.
// type: "transaction" | "account" | "security" | "system"
// relatedTransaction is a transaction _id, or null when there is none (the backend
// sends the id unpopulated). message is free text; the UI never reads it for meaning.
// Dates are relative to now (see ./time.js).
const make = (_id, when, fields) => {
  const createdAt = ago(when)
  return { _id, recipient: 'u1', relatedTransaction: null, isRead: false, ...fields, createdAt, updatedAt: createdAt }
}

export const notifications = [
  make('n1', { m: 40 }, {
    type: 'transaction',
    message: 'You received ₱2,500.00 from Luis S.',
    relatedTransaction: 't8',
  }),
  make('n2', { d: 1, h: 3 }, {
    type: 'transaction',
    message: 'Your transfer of ₱500.00 is being held for review.',
    relatedTransaction: 't3',
  }),
  make('n3', { d: 2 }, {
    type: 'transaction',
    message: 'Your cash in of ₱10,000.00 was successful.',
    relatedTransaction: 't4',
    isRead: true,
  }),
  make('n4', { d: 3 }, {
    type: 'security',
    message: 'Your password was changed. If this was not you, contact staff right away.',
  }),
  make('n5', { d: 6 }, {
    type: 'transaction',
    message: 'Your transfer of ₱750.00 was cancelled and refunded.',
    relatedTransaction: 't6',
    isRead: true,
  }),
  make('n6', { d: 7 }, {
    type: 'transaction',
    message: 'Your transfer of ₱2,500.00 was completed.',
    relatedTransaction: 't2',
    isRead: true,
  }),
  make('n7', { d: 9 }, {
    type: 'account',
    message: 'Your account has been verified. You can now view your card details.',
    isRead: true,
  }),
  make('n8', { d: 14 }, {
    type: 'system',
    message: 'Scheduled maintenance is planned for Sunday, 2:00 AM to 3:00 AM.',
    isRead: true,
  }),
  make('n9', { d: 15 }, {
    type: 'transaction',
    message: 'Your transfer of ₱300.00 was flagged for review.',
    relatedTransaction: 't9',
    isRead: true,
  }),
  make('n10', { d: 24 }, {
    type: 'transaction',
    message: 'Your cash in of ₱10,000.00 was successful.',
    relatedTransaction: 't1',
    isRead: true,
  }),
]

// A frozen account comes with its own account notification.
if (scenario === 'frozen') {
  notifications.unshift(
    make('n-frozen', { m: 5 }, {
      type: 'account',
      message: 'Your account has been frozen. Please contact staff for help.',
    }),
  )
}

// A new customer has no notifications yet.
if (scenario === 'new') notifications.splice(0, notifications.length)
