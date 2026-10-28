import api from './axios'
import { USE_MOCK, mockResponse, mockError, getMockUser } from './helpers'
import { users } from '../mocks/users'
import { accounts } from '../mocks/accounts'
import { transactions } from '../mocks/transactions'
import { notifications } from '../mocks/notifications'
import { auditLogs } from '../mocks/auditLogs'
import { accountEnding } from '../utils/formatAccountNumber'
import { formatPeso } from '../utils/formatPeso'

// Staff-only endpoints (/staff/*), from docs/least-privilege-guide.md. Staff verify
// customers, freeze or reactivate bank accounts, and approve, flag or cancel transfers.
// Admins can't call these: the backend answers 403, and the mock does the same.
//
// Response shapes are assumed, to be confirmed with the backend:
// - customer: the user's identity fields plus account: { _id, accountNumber, status }
//   (the detail adds account.balance)
// - accounts and transactions: plain arrays, newest first. Transactions carry each
//   account as { _id, accountNumber }, like the customer responses.

// Mock only: unique ids for the notifications and audit entries the mock creates.
let mockSeq = 0
const nextId = (prefix) => `${prefix}${Date.now()}-${++mockSeq}`

const isStaff = () => getMockUser()?.role === 'staff'
const forbidden = () => mockError('Forbidden')

const now = () => new Date().toISOString()

const logMock = (action, targetType, targetId) =>
  auditLogs.push({
    _id: nextId('l'),
    actor: getMockUser()?._id ?? null,
    action,
    targetType,
    targetId,
    createdAt: now(),
  })

// Notification messages never contain a full account number ("account ending 1234").
const notifyMock = (recipient, type, message, relatedTransaction = null) => {
  const createdAt = now()
  notifications.unshift({
    _id: nextId('n'),
    recipient,
    type,
    message,
    relatedTransaction,
    isRead: false,
    createdAt,
    updatedAt: createdAt,
  })
}

const accountOf = (userId) => accounts.find((a) => a.owner === userId)

// The fields a staff member sees about a customer (no role, preferences or token).
// contactNumber is left out when it isn't set, as the backend does.
const customerView = (user, { withBalance = false } = {}) => {
  const account = accountOf(user._id)
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    ...(user.contactNumber && { contactNumber: user.contactNumber }),
    status: user.status,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    account: account
      ? {
          _id: account._id,
          accountNumber: account.accountNumber,
          status: account.status,
          ...(withBalance && { balance: account.balance }),
        }
      : null,
  }
}

// Bank account fields staff need. The card isn't one of them.
const accountView = ({ _id, accountNumber, owner, balance, status, createdAt, updatedAt }) => ({
  _id,
  accountNumber,
  owner,
  balance,
  status,
  createdAt,
  updatedAt,
})

const accountRef = (id) => {
  if (!id) return null
  return { _id: id, accountNumber: accounts.find((a) => a._id === id)?.accountNumber }
}

const transactionView = (tx) => ({
  ...tx,
  sourceAccount: accountRef(tx.sourceAccount),
  destinationAccount: accountRef(tx.destinationAccount),
})

const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt)

const findCustomer = (id) => users.find((u) => u._id === id && u.role === 'customer')

export const getCustomers = async () => {
  if (USE_MOCK) {
    if (!isStaff()) return forbidden()
    const customers = users.filter((u) => u.role === 'customer').sort(newestFirst)
    return mockResponse(customers.map((u) => customerView(u)))
  }
  return (await api.get('/staff/customers')).data
}

export const getCustomer = async (id) => {
  if (USE_MOCK) {
    if (!isStaff()) return forbidden()
    const user = findCustomer(id)
    return user ? mockResponse(customerView(user, { withBalance: true })) : mockError('Customer not found')
  }
  return (await api.get(`/staff/customers/${id}`)).data
}

// Only active customers who aren't verified yet. Returns the updated customer.
export const verifyCustomer = async (id) => {
  if (USE_MOCK) {
    if (!isStaff()) return forbidden()
    const user = findCustomer(id)
    if (!user) return mockError('Customer not found')
    if (user.isVerified) return mockError('Customer is already verified')
    if (user.status !== 'active') return mockError('Only active customers can be verified')
    user.isVerified = true
    user.updatedAt = now()
    logMock('user.verify', 'User', id)
    notifyMock(id, 'account', 'Your account has been verified. You can now view your card details.')
    return mockResponse(customerView(user, { withBalance: true }))
  }
  return (await api.patch(`/staff/customers/${id}/verify`)).data
}

export const getAccounts = async () => {
  if (USE_MOCK) {
    if (!isStaff()) return forbidden()
    return mockResponse([...accounts].sort(newestFirst).map(accountView))
  }
  return (await api.get('/staff/accounts')).data
}

// Freeze ("frozen", reason required) or reactivate ("active"). A closed account can't
// change. Returns the updated account.
export const updateAccountStatus = async (id, status, reason) => {
  if (USE_MOCK) {
    if (!isStaff()) return forbidden()
    const account = accounts.find((a) => a._id === id)
    if (!account) return mockError('Account not found')
    if (!['frozen', 'active'].includes(status)) return mockError('Status must be frozen or active')
    if (account.status === 'closed') return mockError('A closed account cannot be changed')
    if (account.status === status) {
      return mockError(status === 'frozen' ? 'Account is already frozen' : 'Account is already active')
    }
    const why = reason?.trim()
    if (status === 'frozen' && !why) return mockError('A reason is required to freeze an account')

    account.status = status
    account.updatedAt = now()
    logMock('account.status_update', 'BankAccount', id)
    notifyMock(
      account.owner,
      'account',
      status === 'frozen'
        ? `Your ${accountEnding(account.accountNumber)} has been frozen. Reason: ${why}. Please contact staff for help.`
        : `Your ${accountEnding(account.accountNumber)} has been reactivated. You can cash in and transfer again.`,
    )
    return mockResponse(accountView(account))
  }
  const body = status === 'frozen' ? { status, reason } : { status }
  return (await api.patch(`/staff/accounts/${id}/status`, body)).data
}

export const getTransactions = async () => {
  if (USE_MOCK) {
    if (!isStaff()) return forbidden()
    return mockResponse([...transactions].sort(newestFirst).map(transactionView))
  }
  return (await api.get('/staff/transactions')).data
}

// Which review actions a transaction allows (see "Transaction review rules" in
// docs/least-privilege-guide.md). Only transfers that are pending or flagged can be
// reviewed: approve and cancel from either, flag from pending only.
export const reviewActionsFor = (tx) => {
  if (tx.transactionType !== 'transfer') return []
  if (tx.status === 'pending') return ['completed', 'flagged', 'cancelled']
  if (tx.status === 'flagged') return ['completed', 'cancelled']
  return []
}

// Approve ("completed"), flag ("flagged", reason required) or cancel ("cancelled").
// The sender was already charged when the transfer was held: approving credits the
// recipient, cancelling refunds the sender, flagging moves no money.
// Returns the updated transaction.
export const updateTransactionStatus = async (id, status, reason) => {
  if (USE_MOCK) {
    if (!isStaff()) return forbidden()
    const tx = transactions.find((t) => t._id === id)
    if (!tx) return mockError('Transaction not found')
    if (!['completed', 'flagged', 'cancelled'].includes(status)) {
      return mockError('Status must be completed, flagged or cancelled')
    }
    if (tx.transactionType !== 'transfer') return mockError('Only transfers can be reviewed')
    if (!reviewActionsFor(tx).includes(status)) {
      return mockError(
        status === 'flagged'
          ? 'Only pending transfers can be flagged'
          : 'Only pending or flagged transfers can be approved or cancelled',
      )
    }
    const why = reason?.trim()
    if (status === 'flagged' && !why) return mockError('A reason is required to flag a transfer')

    const from = accounts.find((a) => a._id === tx.sourceAccount)
    const to = accounts.find((a) => a._id === tx.destinationAccount)
    if (!from || !to) return mockError('Transfer is missing account information')
    const amount = formatPeso(tx.amount)
    const changedAt = now()

    if (status === 'completed') {
      if (to.status !== 'active') {
        return mockError('Recipient account is not active; cancel the transfer if it cannot be completed')
      }
      to.balance += tx.amount
      to.updatedAt = changedAt
      notifyMock(
        from.owner,
        'transaction',
        `Your transfer of ${amount} to ${accountEnding(to.accountNumber)} was approved and completed.`,
        tx._id,
      )
      notifyMock(to.owner, 'transaction', `You received ${amount} from ${accountEnding(from.accountNumber)}.`, tx._id)
    } else if (status === 'cancelled') {
      from.balance += tx.amount
      from.updatedAt = changedAt
      notifyMock(from.owner, 'transaction', `Your transfer of ${amount} was cancelled and refunded to your account.`, tx._id)
    } else {
      notifyMock(from.owner, 'transaction', `Your transfer of ${amount} is under review.`, tx._id)
    }

    tx.status = status
    if (why) tx.flagReason = why
    tx.updatedAt = changedAt
    logMock('transaction.status_update', 'Transaction', id)
    return mockResponse(transactionView(tx))
  }
  const body = reason?.trim() ? { status, reason: reason.trim() } : { status }
  return (await api.patch(`/staff/transactions/${id}/status`, body)).data
}
