import api from './axios'
import { USE_MOCK, mockResponse, mockError, withoutToken, logMock } from './helpers'
import { users } from '../mocks/users'
import { accounts } from '../mocks/accounts'
import { transactions } from '../mocks/transactions'

// Staff = bank officers: verify customers, freeze or reactivate bank accounts, and
// review transactions. Admins can't call any of these (the backend returns 403).

const customerRow = (user) => {
  const account = accounts.find((a) => a.owner === user._id)
  const { _id, name, email, contactNumber, status, isVerified, createdAt } = withoutToken(user)
  return {
    _id, name, email, contactNumber, status, isVerified, createdAt,
    account: account ? { _id: account._id, accountNumber: account.accountNumber, status: account.status } : null,
  }
}

// List: no balances. Detail: adds the balance.
export const getCustomers = async () => {
  if (USE_MOCK) return mockResponse(users.filter((u) => u.role === 'customer').map(customerRow))
  return (await api.get('/staff/customers')).data
}

export const getCustomerById = async (id) => {
  if (USE_MOCK) {
    const user = users.find((u) => u._id === id && u.role === 'customer')
    if (!user) return mockError('Customer not found')
    const row = customerRow(user)
    const account = accounts.find((a) => a.owner === id)
    return mockResponse({ ...row, account: row.account && { ...row.account, balance: account.balance } })
  }
  return (await api.get(`/staff/customers/${id}`)).data
}

export const verifyCustomer = async (id) => {
  if (USE_MOCK) {
    const user = users.find((u) => u._id === id && u.role === 'customer')
    if (!user) return mockError('Customer not found')
    user.isVerified = true
    logMock('user.verify', 'User', id)
    return mockResponse(customerRow(user))
  }
  return (await api.patch(`/staff/customers/${id}/verify`)).data
}

export const getAccounts = async () => {
  if (USE_MOCK) return mockResponse(accounts.map((a) => ({ ...a })))
  return (await api.get('/staff/accounts')).data
}

// { status: "frozen" | "active", reason }. A reason is required when freezing.
export const updateAccountStatus = async (id, { status, reason }) => {
  if (USE_MOCK) {
    const account = accounts.find((a) => a._id === id)
    if (!account) return mockError('Account not found')
    if (account.status === 'closed') return mockError('Closed accounts can’t be changed')
    if (!['frozen', 'active'].includes(status)) return mockError('Invalid status')
    if (status === 'frozen' && !reason?.trim()) return mockError('A reason is required to freeze an account')
    account.status = status
    logMock('account.status_update', 'BankAccount', id)
    return mockResponse({ ...account })
  }
  return (await api.patch(`/staff/accounts/${id}/status`, { status, reason })).data
}

export const getTransactions = async ({ status } = {}) => {
  if (USE_MOCK) return mockResponse(transactions.filter((t) => !status || t.status === status).map((t) => ({ ...t })))
  return (await api.get('/staff/transactions', { params: status ? { status } : {} })).data
}

// Review rules: approve (completed) or cancel from pending/flagged transfers;
// flag only from pending (reason required). Cash-ins and finished ones can't be reviewed.
export const updateTransactionStatus = async (id, { status, reason }) => {
  if (USE_MOCK) {
    const tx = transactions.find((t) => t._id === id)
    if (!tx) return mockError('Transaction not found')
    if (tx.transactionType !== 'transfer') return mockError('Only transfers can be reviewed')
    const from = tx.status
    const ok =
      (['completed', 'cancelled'].includes(status) && ['pending', 'flagged'].includes(from)) ||
      (status === 'flagged' && from === 'pending')
    if (!ok) return mockError(`A ${from} transfer can’t be set to ${status}`)
    if (status === 'flagged' && !reason?.trim()) return mockError('A reason is required to flag a transfer')
    tx.status = status
    if (reason) tx.flagReason = reason
    tx.updatedAt = new Date().toISOString()
    logMock('transaction.status_update', 'Transaction', id)
    return mockResponse({ ...tx })
  }
  return (await api.patch(`/staff/transactions/${id}/status`, { status, reason })).data
}
