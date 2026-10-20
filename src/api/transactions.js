import api from './axios'
import { USE_MOCK, mockResponse, mockError, getMockUser } from './helpers'
import { accounts } from '../mocks/accounts'
import { transactions } from '../mocks/transactions'

// Amounts are integers in centavos.
const isValidAmount = (amount) => Number.isInteger(amount) && amount > 0

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

const involvesAccount = (tx, account) =>
  Boolean(account) && (tx.sourceAccount === account._id || tx.destinationAccount === account._id)

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
    return mockResponse({ ...tx })
  }
  return (await api.post('/transactions/cash-in', { amount })).data
}

// Sends funds to another account by account number.
export const transfer = async ({ toAccountNumber, amount }) => {
  if (USE_MOCK) {
    if (!isValidAmount(amount)) return mockError('Amount must be a positive whole number of centavos')
    const from = getMyMockAccount()
    if (!from) return mockError('Account not found')
    const to = accounts.find((a) => a.accountNumber === toAccountNumber)
    if (!to) return mockError('Destination account not found')
    if (to._id === from._id) return mockError('Cannot transfer to your own account')
    if (from.status !== 'active' || to.status !== 'active') {
      return mockError('Both accounts must be active')
    }
    if (from.balance < amount) return mockError('Insufficient balance')
    from.balance -= amount
    to.balance += amount
    const tx = newTransaction({
      transactionType: 'transfer',
      amount,
      sourceAccount: from._id,
      destinationAccount: to._id,
    })
    transactions.unshift(tx)
    return mockResponse({ ...tx })
  }
  return (await api.post('/transactions/transfer', { toAccountNumber, amount })).data
}

export const getMyTransactions = async () => {
  if (USE_MOCK) {
    const account = getMyMockAccount()
    const mine = transactions.filter((t) => involvesAccount(t, account))
    return mockResponse(mine.map((t) => ({ ...t })))
  }
  return (await api.get('/transactions')).data
}

export const getTransactionById = async (id) => {
  if (USE_MOCK) {
    const tx = transactions.find((t) => t._id === id)
    return tx ? mockResponse({ ...tx }) : mockError('Transaction not found')
  }
  return (await api.get(`/transactions/${id}`)).data
}

// Customers can cancel only their own pending transactions.
export const cancelTransaction = async (id) => {
  if (USE_MOCK) {
    const tx = transactions.find((t) => t._id === id)
    if (!tx || !involvesAccount(tx, getMyMockAccount())) return mockError('Transaction not found')
    if (tx.status !== 'pending') return mockError('Only pending transactions can be cancelled')
    tx.status = 'cancelled'
    tx.updatedAt = new Date().toISOString()
    return mockResponse({ ...tx })
  }
  return (await api.patch(`/transactions/${id}/cancel`)).data
}
