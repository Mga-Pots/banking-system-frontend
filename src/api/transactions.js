import api from './axios'
import { USE_MOCK, mockResponse, mockError, getMockUser } from './helpers'
import { accounts } from '../mocks/accounts'
import { transactions } from '../mocks/transactions'

// Amounts are integers in centavos.
const isValidAmount = (amount) => Number.isInteger(amount) && amount > 0

const getMyMockAccount = () => {
  const user = getMockUser()
  return accounts.find((a) => a.userId === user?.id)
}

const newTransaction = (fields) => ({
  id: `t${Date.now()}`,
  status: 'completed',
  createdAt: new Date().toISOString(),
  ...fields,
})

// Adds simulated funds to the customer's own account.
export const cashIn = async ({ amount }) => {
  if (USE_MOCK) {
    if (!isValidAmount(amount)) return mockError('Amount must be a positive whole number of centavos')
    const account = getMyMockAccount()
    if (!account) return mockError('Account not found')
    if (account.status !== 'active') return mockError('Account is not active')
    account.balance += amount
    const tx = newTransaction({
      type: 'cash_in',
      amount,
      fromAccount: null,
      toAccount: account.accountNumber,
      description: 'Cash in',
    })
    transactions.unshift(tx)
    return mockResponse(tx)
  }
  return (await api.post('/transactions/cash-in', { amount })).data
}

// Sends funds to another account by account number.
export const transfer = async ({ toAccountNumber, amount, description = '' }) => {
  if (USE_MOCK) {
    if (!isValidAmount(amount)) return mockError('Amount must be a positive whole number of centavos')
    const from = getMyMockAccount()
    if (!from) return mockError('Account not found')
    const to = accounts.find((a) => a.accountNumber === toAccountNumber)
    if (!to) return mockError('Destination account not found')
    if (to.id === from.id) return mockError('Cannot transfer to your own account')
    if (from.status !== 'active' || to.status !== 'active') {
      return mockError('Both accounts must be active')
    }
    if (from.balance < amount) return mockError('Insufficient balance')
    from.balance -= amount
    to.balance += amount
    const tx = newTransaction({
      type: 'transfer',
      amount,
      fromAccount: from.accountNumber,
      toAccount: to.accountNumber,
      description,
    })
    transactions.unshift(tx)
    return mockResponse(tx)
  }
  return (await api.post('/transactions/transfer', { toAccountNumber, amount, description })).data
}

export const getMyTransactions = async () => {
  if (USE_MOCK) {
    const account = getMyMockAccount()
    const mine = transactions.filter(
      (t) => t.fromAccount === account?.accountNumber || t.toAccount === account?.accountNumber,
    )
    return mockResponse(mine.map((t) => ({ ...t })))
  }
  return (await api.get('/transactions')).data
}

export const getTransactionById = async (id) => {
  if (USE_MOCK) {
    const tx = transactions.find((t) => t.id === id)
    return tx ? mockResponse({ ...tx }) : mockError('Transaction not found')
  }
  return (await api.get(`/transactions/${id}`)).data
}

// Customers can cancel only their own pending transactions.
export const cancelTransaction = async (id) => {
  if (USE_MOCK) {
    const tx = transactions.find((t) => t.id === id)
    if (!tx) return mockError('Transaction not found')
    const account = getMyMockAccount()
    if (tx.fromAccount !== account?.accountNumber && tx.toAccount !== account?.accountNumber) {
      return mockError('Transaction not found')
    }
    if (tx.status !== 'pending') return mockError('Only pending transactions can be cancelled')
    tx.status = 'cancelled'
    return mockResponse({ ...tx })
  }
  return (await api.patch(`/transactions/${id}/cancel`)).data
}
