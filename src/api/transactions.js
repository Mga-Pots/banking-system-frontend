import api from './axios'
import { USE_MOCK, mockResponse, mockError, getMockUser } from './helpers'
import { accounts } from '../mocks/accounts'
import { transactions } from '../mocks/transactions'

// Amounts are integers in centavos.
const isValidAmount = (amount) => Number.isInteger(amount) && amount > 0

// Same as the backend: account numbers are compared without spaces.
const normalizeAccountNumber = (value) => String(value ?? '').replace(/\s/g, '')

const HELD_REASON = 'Held for staff review'

// History page size the backend uses when no limit is given.
const DEFAULT_LIMIT = 8

const getMyMockAccount = () => {
  const user = getMockUser()
  return accounts.find((a) => a.owner === user?._id)
}

// Mock reference number like TXN-20261016-0412 (date + 4 random digits)
const newReferenceNumber = (date) => {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `TXN-${day}-${random}`
}

// Customer responses carry the accounts as { _id, accountNumber } (assumed backend
// shape, to be confirmed), so the UI can show account numbers. The mock store keeps
// plain ids; this converts on the way out.
const accountRef = (id) => {
  if (!id) return null
  return { _id: id, accountNumber: accounts.find((a) => a._id === id)?.accountNumber }
}

const populate = (tx) => ({
  ...tx,
  sourceAccount: accountRef(tx.sourceAccount),
  destinationAccount: accountRef(tx.destinationAccount),
})

const newTransaction = (fields) => {
  const now = new Date()
  return {
    _id: `t${now.getTime()}`,
    referenceNumber: newReferenceNumber(now),
    performedBy: getMockUser()?._id,
    status: 'completed',
    flagReason: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...fields,
  }
}

// What a customer can see: everything they sent, their cash ins, and incoming
// transfers only once they're completed (the backend hides pending incoming ones).
const isVisibleTo = (tx, account) => {
  if (!account) return false
  if (tx.sourceAccount === account._id) return true
  if (tx.destinationAccount !== account._id) return false
  return tx.transactionType === 'cash_in' || tx.status === 'completed'
}

// Adds simulated funds to the customer's own account.
export const cashIn = async ({ amount }) => {
  if (USE_MOCK) {
    if (!isValidAmount(amount)) return mockError('Amount must be a positive whole number of centavos')
    const account = getMyMockAccount()
    if (!account) return mockError('Account not found')
    if (account.status !== 'active') return mockError('Account is not active')
    account.balance += amount
    const tx = newTransaction({
      transactionType: 'cash_in',
      amount,
      sourceAccount: null,
      destinationAccount: account._id,
    })
    transactions.unshift(tx)
    return mockResponse(populate(tx))
  }
  return (await api.post('/transactions/cash-in', { amount })).data
}

// Sends funds to another account by its 12-digit account number.
// holdForReview: true keeps it pending: the sender is charged now, and the
// recipient is credited only when staff approve it.
// TODO: the backend also holds transfers at or above a set amount. Add that here
// once the backend confirms the limit and its units (pesos or centavos).
export const transfer = async ({ recipientAccountNumber, amount, holdForReview = false }) => {
  if (USE_MOCK) {
    if (!isValidAmount(amount)) return mockError('Amount must be a positive whole number of centavos')
    const from = getMyMockAccount()
    if (!from) return mockError('Account not found')
    const to = accounts.find((a) => a.accountNumber === normalizeAccountNumber(recipientAccountNumber))
    if (!to) return mockError('Destination account not found')
    if (to._id === from._id) return mockError('Cannot transfer to your own account')
    if (from.status !== 'active' || to.status !== 'active') {
      return mockError('Both accounts must be active')
    }
    if (from.balance < amount) return mockError('Insufficient balance')
    from.balance -= amount
    if (!holdForReview) to.balance += amount
    const tx = newTransaction({
      transactionType: 'transfer',
      amount,
      sourceAccount: from._id,
      destinationAccount: to._id,
      ...(holdForReview && { status: 'pending', flagReason: HELD_REASON }),
    })
    transactions.unshift(tx)
    return mockResponse(populate(tx))
  }
  const body = { recipientAccountNumber: normalizeAccountNumber(recipientAccountNumber), amount }
  if (holdForReview) body.holdForReview = true
  return (await api.post('/transactions/transfer', body)).data
}

// Customer history. Filters: status, type ("cash_in" | "transfer"), page, limit.
// The backend also supports search and days/period; add them to the mock once
// their exact values are confirmed.
// Returns { transactions, pagination, counts, summary }.
export const getMyTransactions = async ({ status, type, page = 1, limit = DEFAULT_LIMIT } = {}) => {
  if (USE_MOCK) {
    const account = getMyMockAccount()
    const mine = transactions.filter((t) => isVisibleTo(t, account))

    // counts cover all of the customer's transactions, so filter tabs can show totals
    const counts = { all: mine.length, completed: 0, pending: 0, failed: 0, cancelled: 0, flagged: 0 }
    mine.forEach((t) => {
      counts[t.status] += 1
    })

    // summary: completed transactions in the current calendar month (to be confirmed)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const summary = { moneyInThisMonth: 0, moneyOutThisMonth: 0 }
    mine
      .filter((t) => t.status === 'completed' && new Date(t.createdAt) >= monthStart)
      .forEach((t) => {
        if (t.destinationAccount === account._id) summary.moneyInThisMonth += t.amount
        else summary.moneyOutThisMonth += t.amount
      })

    const filtered = mine
      .filter((t) => (!status || t.status === status) && (!type || t.transactionType === type))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const total = filtered.length
    const start = (page - 1) * limit
    return mockResponse({
      transactions: filtered.slice(start, start + limit).map(populate),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      counts,
      summary,
    })
  }
  const params = { page, limit, ...(status && { status }), ...(type && { type }) }
  return (await api.get('/transactions', { params })).data
}

export const getTransactionById = async (id) => {
  if (USE_MOCK) {
    const tx = transactions.find((t) => t._id === id)
    if (!tx || !isVisibleTo(tx, getMyMockAccount())) return mockError('Transaction not found')
    return mockResponse(populate(tx))
  }
  return (await api.get(`/transactions/${id}`)).data
}

// Only the sender can cancel, only a pending transfer, and the amount is refunded.
export const cancelTransaction = async (id) => {
  if (USE_MOCK) {
    const account = getMyMockAccount()
    const tx = transactions.find((t) => t._id === id)
    if (!tx || !isVisibleTo(tx, account)) return mockError('Transaction not found')
    if (tx.transactionType !== 'transfer' || tx.sourceAccount !== account._id) {
      return mockError('Only the sender can cancel this transfer')
    }
    if (tx.status !== 'pending') return mockError('Only pending transactions can be cancelled')
    account.balance += tx.amount
    tx.status = 'cancelled'
    tx.updatedAt = new Date().toISOString()
    return mockResponse(populate(tx))
  }
  return (await api.patch(`/transactions/${id}/cancel`)).data
}
